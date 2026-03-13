"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filesService = exports.FilesService = void 0;
const postgres_1 = require("../db/postgres");
const fsm_service_1 = require("../fsm/fsm.service");
const cases_service_1 = require("../cases/cases.service");
const nextcloud_client_1 = require("../nextcloud/nextcloud.client");
class FilesService {
    async getCaseFiles(caseId) {
        const result = await postgres_1.postgres.query(`
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
      order by
        selected_for_submission desc,
        sort_order asc nulls last,
        created_at asc
      `, [caseId]);
        return result.rows;
    }
    async syncCaseFiles(caseId) {
        const caseRow = await cases_service_1.casesService.getCaseById(caseId);
        if (!caseRow) {
            throw new Error('case not found');
        }
        const snapshot = await fsm_service_1.fsmService.getSnapshot(caseId);
        if (!snapshot) {
            throw new Error('fsm not found');
        }
        if (!fsm_service_1.fsmService.isEditableState(snapshot.state)) {
            throw new Error(`invalid fsm state: ${snapshot.state}`);
        }
        const incomingFiles = await nextcloud_client_1.nextcloudClient.listFiles(caseRow.nextcloud_incoming_folder);
        await postgres_1.postgres.query('begin');
        try {
            await this.upsertSyncedFiles(caseId, incomingFiles);
            const files = await this.getCaseFiles(caseId);
            const selectedFiles = files.filter((file) => file.selected_for_submission);
            const selectedFileIds = selectedFiles.map((file) => file.id);
            const fsm = await fsm_service_1.fsmService.syncWorkingState(caseId, {
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
            await cases_service_1.casesService.logCaseAction(caseId, 'files.synced', {
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
            await postgres_1.postgres.query('commit');
            return {
                case: caseRow,
                files,
                fsm,
            };
        }
        catch (error) {
            await postgres_1.postgres.query('rollback');
            try {
                await fsm_service_1.fsmService.transition(caseId, 'files_sync_failed', {
                    lastErrorCode: 'FILES_SYNC_FAILED',
                    lastErrorMessage: error instanceof Error ? error.message : 'files sync failed',
                });
            }
            catch {
                // ignore secondary FSM errors
            }
            throw error;
        }
    }
    async updateSelectedFiles(caseId, body) {
        if (!body?.files || !Array.isArray(body.files) || body.files.length === 0) {
            throw new Error('files array is required');
        }
        const caseRow = await cases_service_1.casesService.getCaseById(caseId);
        if (!caseRow) {
            throw new Error('case not found');
        }
        const snapshot = await fsm_service_1.fsmService.getSnapshot(caseId);
        if (!snapshot) {
            throw new Error('fsm not found');
        }
        if (!fsm_service_1.fsmService.isEditableState(snapshot.state)) {
            throw new Error(`invalid fsm state: ${snapshot.state}`);
        }
        const existingFilesResult = await postgres_1.postgres.query(`
      select id, file_path, file_name, selected_for_submission
      from case_files
      where case_id = $1
      `, [caseId]);
        const existingById = new Map(existingFilesResult.rows.map((row) => [row.id, row]));
        const existingIds = new Set(existingFilesResult.rows.map((row) => row.id));
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
        await postgres_1.postgres.query('begin');
        try {
            for (const item of body.files) {
                const existingFile = existingById.get(item.fileId);
                if (existingFile &&
                    existingFile.selected_for_submission &&
                    !item.selected &&
                    existingFile.file_path.startsWith(caseRow.nextcloud_result_folder.replace(/\/+$/, '') + '/')) {
                    const incomingPath = `${caseRow.nextcloud_incoming_folder.replace(/\/+$/, '')}/${existingFile.file_name}`;
                    await nextcloud_client_1.nextcloudClient.moveFile(existingFile.file_path, incomingPath);
                    await postgres_1.postgres.query(`
            update case_files
            set file_path = $3
            where case_id = $1
              and id = $2
            `, [caseId, item.fileId, incomingPath]);
                }
                await this.applyFileSelection(caseId, item);
            }
            const files = await this.getCaseFiles(caseId);
            const selectedFiles = files.filter((file) => file.selected_for_submission);
            const selectedFileIds = selectedFiles.map((file) => file.id);
            await fsm_service_1.fsmService.syncWorkingState(caseId, {
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
            await cases_service_1.casesService.logCaseAction(caseId, 'files.selection.updated', {
                files: body.files,
                selectedCount: selectedFiles.length,
                selectedFileIds,
            });
            await postgres_1.postgres.query('commit');
            return {
                caseId,
                selectedCount: selectedFiles.length,
                files,
            };
        }
        catch (error) {
            await postgres_1.postgres.query('rollback');
            throw error;
        }
    }
    async upsertSyncedFiles(caseId, files) {
        for (const file of files) {
            await postgres_1.postgres.query(`
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
        on conflict do nothing
        `, [
                caseId,
                file.filePath,
                file.fileName,
                file.mimeType,
                file.sizeBytes,
                file.checksum ?? null,
                file.previewUrl ?? null,
                file.sourceMtime,
            ]);
        }
    }
    async applyFileSelection(caseId, item) {
        const sortOrder = item.selected ? (item.sortOrder ?? 0) : 0;
        await postgres_1.postgres.query(`
      update case_files
      set
        selected_for_submission = $3,
        sort_order = $4
      where case_id = $1
        and id = $2
      `, [caseId, item.fileId, item.selected, sortOrder]);
    }
    async getCaseFileById(caseId, fileId) {
        const result = await postgres_1.postgres.query(`
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
      `, [caseId, fileId]);
        return result.rows[0] ?? null;
    }
}
exports.FilesService = FilesService;
exports.filesService = new FilesService();
