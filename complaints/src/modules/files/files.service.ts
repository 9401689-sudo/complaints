import { postgres } from '../db/postgres';
import { fsmService } from '../fsm/fsm.service';
import { casesService } from '../cases/cases.service';
import { nextcloudClient } from '../nextcloud/nextcloud.client';
import {
  CaseFileRecord,
  SyncedCaseFile,
  UploadResultFilesBody,
  UpdateCaseFilesBody,
  UpdateCaseFilesItem,
  UpdateCaseFilesResult,
} from './files.types';

export class FilesService {
  async getCaseFiles(caseId: string): Promise<CaseFileRecord[]> {
    const result = await postgres.query<CaseFileRecord>(
      `
      select
        cf.id,
        cf.case_id,
        cf.file_path,
        cf.file_name,
        cf.mime_type,
        cf.size_bytes,
        cf.checksum,
        cf.preview_url,
        cf.selected_for_submission,
        cf.sort_order,
        cf.source_mtime,
        cf.created_at
      from case_files cf
      join cases c on c.id = cf.case_id
      where cf.case_id = $1
        and not (cf.file_path like c.nextcloud_result_folder || '/%')
      order by
        cf.selected_for_submission desc,
        cf.sort_order asc nulls last,
        cf.created_at asc
      `,
      [caseId]
    );

    return result.rows;
  }

  async syncCaseFiles(caseId: string) {
    const caseRow = await casesService.getCaseById(caseId);

    if (!caseRow) {
      throw new Error('case not found');
    }

    const snapshot = await fsmService.getSnapshot(caseId);

    if (!snapshot) {
      throw new Error('fsm not found');
    }

    if (!fsmService.isEditableState(snapshot.state)) {
      throw new Error(`invalid fsm state: ${snapshot.state}`);
    }
    const incomingFiles = await nextcloudClient.listFiles(caseRow.nextcloud_incoming_folder);

    await postgres.query('begin');

    try {
      await this.upsertSyncedFiles(caseId, incomingFiles);

      const files = await this.getCaseFiles(caseId);
      const selectedFiles = files.filter((file) => file.selected_for_submission);
      const selectedFileIds = selectedFiles.map((file) => file.id);

      const fsm = await fsmService.syncWorkingState(caseId, {
        filesTotal: files.length,
        filesSelected: selectedFiles.length,
        selectedFileIds,
        textReady: snapshot.context.textReady,
        textChecksum: snapshot.context.textChecksum,
        packageReady: snapshot.context.packageReady,
        packageChecksum: snapshot.context.packageChecksum,
        lastErrorCode: null,
        lastErrorMessage: null
      });

      await casesService.logCaseAction(caseId, 'files.synced', {
        filesTotal: files.length,
        filesSelected: selectedFiles.length,
        incomingCount: incomingFiles.length,
        incomingFiles: incomingFiles.map((file) => ({
          filePath: file.filePath,
          fileName: file.fileName,
          mimeType: file.mimeType,
          sizeBytes: file.sizeBytes,
          sourceMtime: file.sourceMtime,
        })),
      });

      await postgres.query('commit');

      return {
        case: caseRow,
        files,
        fsm,
      };
    } catch (error) {
      await postgres.query('rollback');

      try {
        await fsmService.transition(caseId, 'files_sync_failed', {
          lastErrorCode: 'FILES_SYNC_FAILED',
          lastErrorMessage: error instanceof Error ? error.message : 'files sync failed',
        });
      } catch {
        // ignore secondary FSM errors
      }

      throw error;
    }
  }

  async updateSelectedFiles(caseId: string, body: UpdateCaseFilesBody): Promise<UpdateCaseFilesResult> {
    if (!body?.files || !Array.isArray(body.files) || body.files.length === 0) {
      throw new Error('files array is required');
    }

    const caseRow = await casesService.getCaseById(caseId);
    if (!caseRow) {
      throw new Error('case not found');
    }

    const snapshot = await fsmService.getSnapshot(caseId);
    if (!snapshot) {
      throw new Error('fsm not found');
    }

    if (!fsmService.isEditableState(snapshot.state)) {
      throw new Error(`invalid fsm state: ${snapshot.state}`);
    }

    const existingFilesResult = await postgres.query<{
      id: string;
      file_path: string;
      file_name: string;
      selected_for_submission: boolean;
    }>(
      `
      select id, file_path, file_name, selected_for_submission
      from case_files
      where case_id = $1
      `,
      [caseId]
    );

    const existingById = new Map(existingFilesResult.rows.map((row) => [row.id, row]));
    const existingIds = new Set<string>(existingFilesResult.rows.map((row) => row.id));

    for (const item of body.files) {
      if (!item.fileId) {
        throw new Error('fileId is required');
      }

      if (!existingIds.has(item.fileId)) {
        throw new Error(`file does not belong to case: ${item.fileId}`);
      }

      if (item.sortOrder !== undefined && item.sortOrder !== null) {
        if (!Number.isInteger(item.sortOrder) || item.sortOrder < 0) {
          throw new Error(`invalid sortOrder for file: ${item.fileId}`);
        }
      }
    }

    await postgres.query('begin');

    try {
      for (const item of body.files) {
        const existingFile = existingById.get(item.fileId);

        if (
          existingFile &&
          existingFile.selected_for_submission &&
          !item.selected &&
          existingFile.file_path.startsWith(caseRow.nextcloud_artifacts_folder.replace(/\/+$/, '') + '/')
        ) {
          const incomingPath = `${caseRow.nextcloud_incoming_folder.replace(/\/+$/, '')}/${existingFile.file_name}`;
          await nextcloudClient.moveFile(existingFile.file_path, incomingPath);
          await postgres.query(
            `
            update case_files
            set file_path = $3
            where case_id = $1
              and id = $2
            `,
            [caseId, item.fileId, incomingPath]
          );
        }

        await this.applyFileSelection(caseId, item);
      }

      const files = await this.getCaseFiles(caseId);
      const selectedFiles = files.filter((file) => file.selected_for_submission);
      const selectedFileIds = selectedFiles.map((file) => file.id);

      await fsmService.syncWorkingState(caseId, {
        filesTotal: files.length,
        filesSelected: selectedFiles.length,
        selectedFileIds,
        textReady: false,
        textChecksum: null,
        packageReady: false,
        packageChecksum: null,
        lastErrorCode: null,
        lastErrorMessage: null
      });

      await casesService.logCaseAction(caseId, 'files.selection.updated', {
        files: body.files,
        selectedCount: selectedFiles.length,
        selectedFileIds,
      });

      await postgres.query('commit');

      return {
        caseId,
        selectedCount: selectedFiles.length,
        files,
      };
    } catch (error) {
      await postgres.query('rollback');
      throw error;
    }
  }

  private async upsertSyncedFiles(caseId: string, files: SyncedCaseFile[]): Promise<void> {
    for (const file of files) {
      const updated = await postgres.query(
        `
        update case_files
        set
          file_name = $3,
          mime_type = $4,
          size_bytes = $5,
          checksum = $6,
          preview_url = $7,
          source_mtime = $8::timestamptz
        where case_id = $1
          and file_path = $2
        returning id
        `,
        [
          caseId,
          file.filePath,
          file.fileName,
          file.mimeType,
          file.sizeBytes,
          file.checksum ?? null,
          file.previewUrl ?? null,
          file.sourceMtime
        ]
      );

      if (updated.rows[0]) {
        continue;
      }

      await postgres.query(
        `
        insert into case_files (
          case_id,
          file_path,
          file_name,
          mime_type,
          size_bytes,
          checksum,
          preview_url,
          source_mtime
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8::timestamptz)
        `,
        [
          caseId,
          file.filePath,
          file.fileName,
          file.mimeType,
          file.sizeBytes,
          file.checksum ?? null,
          file.previewUrl ?? null,
          file.sourceMtime,
        ]
      );
    }
  }

  private async applyFileSelection(caseId: string, item: UpdateCaseFilesItem): Promise<void> {
    const sortOrder = item.selected ? (item.sortOrder ?? 0) : 0;

    await postgres.query(
      `
      update case_files
      set
        selected_for_submission = $3,
        sort_order = $4
      where case_id = $1
        and id = $2
      `,
      [caseId, item.fileId, item.selected, sortOrder]
    );
  }
  async getCaseFileById(caseId: string, fileId: string): Promise<CaseFileRecord | null> {
    const result = await postgres.query<CaseFileRecord>(
      `
      select
        id,
        case_id,
        file_path,
        file_name,
        mime_type,
        size_bytes,
        checksum,
        preview_url,
        selected_for_submission,
        sort_order,
        source_mtime,
        created_at
      from case_files
      where case_id = $1
        and id = $2
      limit 1
      `,
      [caseId, fileId]
    );

    return result.rows[0] ?? null;
  }

  async syncResultFiles(caseId: string): Promise<CaseFileRecord[]> {
    const caseRow = await casesService.getCaseById(caseId);

    if (!caseRow) {
      throw new Error('case not found');
    }

    const resultFiles = await nextcloudClient.listFiles(caseRow.nextcloud_result_folder);

    await postgres.query('begin');

    try {
      const resultFolderPrefix = `${caseRow.nextcloud_result_folder.replace(/\/+$/, '')}/`;
      const currentPaths = new Set(resultFiles.map((file) => file.filePath));

      await postgres.query(
        `
        delete from case_files
        where case_id = $1
          and file_path like $2
          and file_path <> all($3::text[])
        `,
        [caseId, `${resultFolderPrefix}%`, Array.from(currentPaths)]
      );

      for (const file of resultFiles) {
        const updated = await postgres.query<CaseFileRecord>(
          `
          update case_files
          set
            file_name = $3,
            mime_type = $4,
            size_bytes = $5,
            preview_url = $6,
            source_mtime = $7::timestamptz,
            selected_for_submission = false,
            sort_order = 0
          where case_id = $1
            and file_path = $2
          returning *
          `,
          [
            caseId,
            file.filePath,
            file.fileName,
            file.mimeType,
            file.sizeBytes,
            file.previewUrl ?? null,
            file.sourceMtime
          ]
        );

        if (updated.rows[0]) {
          continue;
        }

        await postgres.query(
          `
          insert into case_files (
            case_id,
            file_path,
            file_name,
            mime_type,
            size_bytes,
            preview_url,
            source_mtime,
            selected_for_submission,
            sort_order
          )
          values ($1, $2, $3, $4, $5, $6, $7::timestamptz, false, 0)
          `,
          [
            caseId,
            file.filePath,
            file.fileName,
            file.mimeType,
            file.sizeBytes,
            file.previewUrl ?? null,
            file.sourceMtime
          ]
        );
      }

      const synced = await postgres.query<CaseFileRecord>(
        `
        select
          id,
          case_id,
          file_path,
          file_name,
          mime_type,
          size_bytes,
          checksum,
          preview_url,
          selected_for_submission,
          sort_order,
          source_mtime,
          created_at
        from case_files
        where case_id = $1
          and file_path like $2
        order by created_at asc
        `,
        [caseId, `${resultFolderPrefix}%`]
      );

      await postgres.query('commit');
      return synced.rows;
    } catch (error) {
      await postgres.query('rollback');
      throw error;
    }
  }

  async uploadResultFiles(caseId: string, body: UploadResultFilesBody): Promise<CaseFileRecord[]> {
    const caseRow = await casesService.getCaseById(caseId);

    if (!caseRow) {
      throw new Error('case not found');
    }

    if (!body?.files || !Array.isArray(body.files) || body.files.length === 0) {
      throw new Error('files array is required');
    }

    for (const file of body.files) {
      if (!file?.fileName?.trim()) {
        throw new Error('fileName is required');
      }

      if (!file?.contentBase64) {
        throw new Error('contentBase64 is required');
      }
    }

    for (const file of body.files) {
      const filePath = `${caseRow.nextcloud_result_folder.replace(/\/+$/, '')}/${file.fileName.trim()}`;
      const buffer = Buffer.from(file.contentBase64, 'base64');
      await nextcloudClient.uploadBinaryFile(filePath, buffer, file.mimeType ?? 'application/octet-stream');
    }

    await casesService.logCaseAction(caseId, 'result.files.uploaded', {
      files: body.files.map((file) => ({
        fileName: file.fileName,
        mimeType: file.mimeType ?? null
      }))
    });

    return this.syncResultFiles(caseId);
  }
}

export const filesService = new FilesService();
