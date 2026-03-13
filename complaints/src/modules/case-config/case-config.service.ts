import { postgres } from '../db/postgres';
import { casesService } from '../cases/cases.service';
import { fsmService } from '../fsm/fsm.service';
import { UpdateCaseConfigBody } from './case-config.types';

export class CaseConfigService {
  async updateCaseConfig(caseId: string, body: UpdateCaseConfigBody = {}) {
    const caseRow = await casesService.getCaseById(caseId);

    if (!caseRow) {
      throw new Error('case not found');
    }

    const institutionId =
      body?.institutionId !== undefined ? body.institutionId : caseRow.institution_id;

    const templateId =
      body?.templateId !== undefined ? body.templateId : caseRow.template_id;

    if (institutionId !== null && institutionId !== undefined) {
      const institutionResult = await postgres.query<{ id: string }>(
        `
        select id
        from institutions
        where id = $1
        limit 1
        `,
        [institutionId]
      );

      if (institutionResult.rows.length === 0) {
        throw new Error('institution not found');
      }
    }

    if (templateId !== null && templateId !== undefined) {
      const templateResult = await postgres.query<{ id: string }>(
        `
        select id
        from templates
        where id = $1
        limit 1
        `,
        [templateId]
      );

      if (templateResult.rows.length === 0) {
        throw new Error('template not found');
      }
    }

    const result = await postgres.query(
      `
      update cases
      set
        institution_id = $2,
        template_id = $3,
        updated_at = now()
      where id = $1
      returning
        id,
        case_number,
        institution_id,
        template_id,
        nextcloud_case_folder,
        nextcloud_incoming_folder,
        nextcloud_artifacts_folder,
        nextcloud_result_folder,
        submission_number,
        submitted_at,
        created_at,
        updated_at
      `,
      [caseId, institutionId ?? null, templateId ?? null]
    );

    const updatedCase = result.rows[0];

    const snapshot = await fsmService.getSnapshot(caseId);

    if (!snapshot) {
      throw new Error('fsm not found');
    }

    if (!fsmService.isEditableState(snapshot.state)) {
      throw new Error(`invalid fsm state: ${snapshot.state}`);
    }

    await fsmService.syncWorkingState(caseId, {
      institutionId: institutionId ?? null,
      templateId: templateId ?? null,
      textReady: false,
      textChecksum: null,
      packageReady: false,
      packageChecksum: null,
      lastErrorCode: null,
      lastErrorMessage: null
    });

    await casesService.logCaseAction(caseId, 'case.config.updated', {
      institutionId: institutionId ?? null,
      templateId: templateId ?? null,
    });

    return updatedCase;
  }
}

export const caseConfigService = new CaseConfigService();
