import { createHash } from 'crypto';
import { casesService } from '../cases/cases.service';
import { fsmService } from '../fsm/fsm.service';
import { nextcloudClient } from '../nextcloud/nextcloud.client';
import { GetCaseTextResult, UpdateCaseTextBody } from './text.types';

function buildComplaintTextPath(artifactsFolder: string): string {
  return `${artifactsFolder.replace(/\/+$/, '')}/complaint.txt`;
}

function sha256(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

export class TextService {
  async getCaseText(caseId: string): Promise<GetCaseTextResult> {
    const caseRow = await casesService.getCaseById(caseId);

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

  async saveCaseText(caseId: string, body: UpdateCaseTextBody): Promise<GetCaseTextResult> {
    const caseRow = await casesService.getCaseById(caseId);

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

    if (!['files_selected', 'text_ready', 'package_ready'].includes(snapshot.state)) {
      throw new Error(`invalid fsm state: ${snapshot.state}`);
    }

    const filePath = buildComplaintTextPath(caseRow.nextcloud_artifacts_folder);
    const content = body.content;
    const textChecksum = sha256(content);

    await nextcloudClient.uploadTextFile(filePath, content);

    await fsmService.transition(caseId, 'text_ready', {
      textReady: true,
      textChecksum,
      packageReady: false,
      packageChecksum: null,
      lastErrorCode: null,
      lastErrorMessage: null,
    });

    await casesService.logCaseAction(caseId, 'case.text.saved', {
      filePath,
      textChecksum,
      contentLength: content.length,
    });

    return {
      caseId,
      filePath,
      content,
    };
  }
}

export const textService = new TextService();
