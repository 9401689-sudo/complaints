import { createHash } from 'crypto';
import { postgres } from '../db/postgres';
import { casesService } from '../cases/cases.service';
import { fsmService } from '../fsm/fsm.service';
import { nextcloudClient } from '../nextcloud/nextcloud.client';
import { AuthUser } from '../auth/auth.service';
import { GetCaseTextResult, UpdateCaseTextBody } from './text.types';

function buildComplaintTextPath(artifactsFolder: string): string {
  return `${artifactsFolder.replace(/\/+$/, '')}/complaint.txt`;
}

function sha256(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

export class TextService {
  async getCaseText(caseId: string, authUser?: AuthUser | null): Promise<GetCaseTextResult> {
    const caseRow = await casesService.getCaseById(caseId, authUser);

    if (!caseRow) {
      throw new Error('case not found');
    }

    const filePath = buildComplaintTextPath(caseRow.nextcloud_artifacts_folder);
    const content = await nextcloudClient.downloadTextFile(filePath);

    return {
      caseId,
      filePath,
      content,
    };
  }

  async saveCaseText(caseId: string, body: UpdateCaseTextBody, authUser?: AuthUser | null): Promise<GetCaseTextResult> {
    const caseRow = await casesService.getCaseById(caseId, authUser);

    if (!caseRow) {
      throw new Error('case not found');
    }

    if (!body || typeof body.content !== 'string') {
      throw new Error('content is required');
    }

    const snapshot = await fsmService.getSnapshot(caseId);

    if (!snapshot) {
      throw new Error('fsm not found');
    }

    if (!fsmService.isEditableState(snapshot.state)) {
      throw new Error(`invalid fsm state: ${snapshot.state}`);
    }

    const filePath = buildComplaintTextPath(caseRow.nextcloud_artifacts_folder);
    const content = body.content;
    const textChecksum = sha256(content);

    await nextcloudClient.uploadTextFile(filePath, content);
    await postgres.query('begin');

    try {
      await postgres.query(
        `
        delete from case_artifacts
        where case_id = $1
          and artifact_type = 'generated_text'
        `,
        [caseId]
      );

      await postgres.query(
        `
        insert into case_artifacts (case_id, artifact_type, file_path)
        values ($1, $2, $3)
        `,
        [caseId, 'generated_text', filePath]
      );

      await fsmService.syncWorkingState(caseId, {
        textReady: true,
        textChecksum,
        packageReady: false,
        packageChecksum: null,
        lastErrorCode: null,
        lastErrorMessage: null
      });

      await casesService.logCaseAction(caseId, 'case.text.saved', {
        filePath,
        textChecksum,
        contentLength: content.length,
      });

      await postgres.query('commit');
    } catch (error) {
      await postgres.query('rollback');
      throw error;
    }

    return {
      caseId,
      filePath,
      content,
    };
  }
}

export const textService = new TextService();
