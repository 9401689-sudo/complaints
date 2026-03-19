import { env } from '../config/env';
import { postgres } from '../modules/db/postgres';
import { fsmService, FsmSnapshot } from '../modules/fsm/fsm.service';
import { nextcloudClient } from '../modules/nextcloud/nextcloud.client';
import { redis } from '../modules/redis/redis';
import { CaseRecord } from '../modules/cases/cases.types';
import { SyncedCaseFile } from '../modules/files/files.types';

type InsertedFileRow = {
  id: string;
};

function trimSlashes(input: string): string {
  return input.replace(/^\/+|\/+$/g, '');
}

function buildCaseFolders(caseNumber: string) {
  const rootPath = trimSlashes(env.NEXTCLOUD_ROOT_PATH ?? '');

  if (!rootPath) {
    throw new Error('NEXTCLOUD_ROOT_PATH is not configured');
  }

  const caseRoot = `/${rootPath}/${caseNumber}`;

  return {
    caseRoot,
    incoming: `${caseRoot}/incoming`,
    artifacts: `${caseRoot}/artifacts`,
    result: `${caseRoot}/result`
  };
}

async function ensureFolderExists(path: string, label: string): Promise<void> {
  const exists = await nextcloudClient.pathExists(path);

  if (!exists) {
    throw new Error(`${label} folder not found in Nextcloud: ${path}`);
  }
}

async function listFilesIfExists(path: string): Promise<SyncedCaseFile[]> {
  const exists = await nextcloudClient.pathExists(path);
  if (!exists) {
    return [];
  }

  return nextcloudClient.listFiles(path);
}

function buildPreviewUrl(filePath: string, mimeType: string | null): string | null {
  if (!mimeType) {
    return null;
  }

  if (
    mimeType.startsWith('image/') ||
    mimeType.startsWith('video/') ||
    mimeType === 'application/pdf'
  ) {
    return nextcloudClient.getFileUrl(filePath);
  }

  return null;
}

function buildStateSnapshot(caseRow: CaseRecord, filesTotal: number, selectedFiles: Array<{ id: string }>, textReady: boolean, packageReady: boolean): FsmSnapshot {
  const filesSelected = selectedFiles.length;
  const state = packageReady
    ? 'package_ready'
    : textReady
      ? 'text_ready'
      : filesSelected > 0
        ? 'files_selected'
        : filesTotal > 0
          ? 'files_synced'
          : 'awaiting_files';

  return {
    state,
    context: {
      caseId: caseRow.id,
      caseNumber: caseRow.case_number,
      filesTotal,
      filesSelected,
      selectedFileIds: selectedFiles.map((file) => file.id),
      institutionId: caseRow.institution_id,
      templateId: caseRow.template_id,
      templateVersion: null,
      textReady,
      textChecksum: null,
      packageReady,
      packageChecksum: null,
      responseReady: caseRow.case_status === 'has_reply',
      submissionNumber: caseRow.submission_number,
      lastErrorCode: null,
      lastErrorMessage: null
    }
  };
}

async function restoreCase(caseNumber: string): Promise<void> {
  const normalizedCaseNumber = caseNumber.trim().toUpperCase();

  if (!/^CASE-\d{6}$/.test(normalizedCaseNumber)) {
    throw new Error('case number must look like CASE-000032');
  }

  const existing = await postgres.query<CaseRecord>(
    `
    select *
    from cases
    where case_number = $1
    limit 1
    `,
    [normalizedCaseNumber]
  );

  if (existing.rows[0]) {
    throw new Error(`case already exists in database: ${normalizedCaseNumber}`);
  }

  const folders = buildCaseFolders(normalizedCaseNumber);

  await ensureFolderExists(folders.caseRoot, 'case');
  await ensureFolderExists(folders.incoming, 'incoming');
  await ensureFolderExists(folders.artifacts, 'artifacts');
  await ensureFolderExists(folders.result, 'result');

  const incomingFiles = await listFilesIfExists(folders.incoming);
  const artifactFiles = await listFilesIfExists(folders.artifacts);
  const resultFiles = await listFilesIfExists(folders.result);

  const generatedTextFile = artifactFiles.find((file) => file.fileName === 'complaint.txt');
  const packageFile = artifactFiles.find((file) => file.fileName === 'submission-package.json');
  const selectedArtifactFiles = artifactFiles.filter(
    (file) => file.fileName !== 'complaint.txt' && file.fileName !== 'submission-package.json'
  );

  await postgres.query('begin');

  try {
    const insertedCase = await postgres.query<CaseRecord>(
      `
      insert into cases (
        case_number,
        case_status,
        institution_id,
        template_id,
        nextcloud_case_folder,
        nextcloud_incoming_folder,
        nextcloud_artifacts_folder,
        nextcloud_result_folder,
        case_date
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, to_char(now(), 'DD.MM.YYYY'))
      returning *
      `,
      [
        normalizedCaseNumber,
        resultFiles.length > 0 ? 'has_reply' : 'created',
        null,
        null,
        folders.caseRoot,
        folders.incoming,
        folders.artifacts,
        folders.result
      ]
    );

    const caseRow = insertedCase.rows[0];

    if (!caseRow) {
      throw new Error('failed to recreate case row');
    }

    const insertedSelectedFiles: Array<{ id: string }> = [];
    let sortOrder = 1;

    const insertCaseFile = async (file: SyncedCaseFile, selectedForSubmission: boolean, itemSortOrder: number) => {
      const result = await postgres.query<InsertedFileRow>(
        `
        insert into case_files (
          case_id,
          file_path,
          file_name,
          mime_type,
          size_bytes,
          checksum,
          preview_url,
          selected_for_submission,
          sort_order,
          source_mtime
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::timestamptz)
        returning id
        `,
        [
          caseRow.id,
          file.filePath,
          file.fileName,
          file.mimeType,
          file.sizeBytes,
          file.checksum ?? null,
          buildPreviewUrl(file.filePath, file.mimeType),
          selectedForSubmission,
          itemSortOrder,
          file.sourceMtime
        ]
      );

      if (selectedForSubmission && result.rows[0]) {
        insertedSelectedFiles.push({ id: result.rows[0].id });
      }
    };

    for (const file of incomingFiles) {
      await insertCaseFile(file, false, 0);
    }

    for (const file of selectedArtifactFiles) {
      await insertCaseFile(file, true, sortOrder);
      sortOrder += 1;
    }

    for (const file of resultFiles) {
      await insertCaseFile(file, false, 0);
    }

    if (generatedTextFile) {
      await postgres.query(
        `
        insert into case_artifacts (case_id, artifact_type, file_path)
        values ($1, $2, $3)
        `,
        [caseRow.id, 'generated_text', generatedTextFile.filePath]
      );
    }

    if (packageFile) {
      await postgres.query(
        `
        insert into case_artifacts (case_id, artifact_type, file_path)
        values ($1, $2, $3)
        `,
        [caseRow.id, 'submission_package', packageFile.filePath]
      );
    }

    const filesTotal = incomingFiles.length + selectedArtifactFiles.length;
    const snapshot = buildStateSnapshot(
      caseRow,
      filesTotal,
      insertedSelectedFiles,
      Boolean(generatedTextFile),
      Boolean(packageFile)
    );

    await fsmService.saveSnapshot(caseRow.id, snapshot);

    await postgres.query(
      `
      insert into case_logs (case_id, action, payload_json)
      values ($1, $2, $3::jsonb)
      `,
      [
        caseRow.id,
        'case.restored.from_nextcloud',
        JSON.stringify({
          caseNumber: normalizedCaseNumber,
          incomingFiles: incomingFiles.length,
          selectedArtifactFiles: selectedArtifactFiles.length,
          resultFiles: resultFiles.length,
          generatedTextRestored: Boolean(generatedTextFile),
          packageRestored: Boolean(packageFile)
        })
      ]
    );

    await postgres.query('commit');

    console.log(`Case restored: ${normalizedCaseNumber}`);
    console.log(`New case id: ${caseRow.id}`);
    console.log(`Incoming files: ${incomingFiles.length}`);
    console.log(`Selected artifact files: ${selectedArtifactFiles.length}`);
    console.log(`Result files: ${resultFiles.length}`);
    console.log(`FSM state: ${snapshot.state}`);
  } catch (error) {
    await postgres.query('rollback');
    throw error;
  }
}

async function main() {
  const caseNumber = process.argv[2];

  if (!caseNumber) {
    throw new Error('usage: node dist/scripts/restore-case-from-nextcloud.js CASE-000032');
  }

  await restoreCase(caseNumber);
}

main()
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Restore failed: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.allSettled([postgres.end(), redis.quit()]);
  });
