"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.caseConfigService = exports.CaseConfigService = void 0;
const postgres_1 = require("../db/postgres");
const cases_service_1 = require("../cases/cases.service");
const fsm_service_1 = require("../fsm/fsm.service");
const nextcloud_client_1 = require("../nextcloud/nextcloud.client");
class CaseConfigService {
    async updateCaseConfig(caseId, body = {}) {
        const caseRow = await cases_service_1.casesService.getCaseById(caseId);
        if (!caseRow) {
            throw new Error('case not found');
        }
        const institutionId = body?.institutionId !== undefined ? body.institutionId : caseRow.institution_id;
        const templateId = body?.templateId !== undefined ? body.templateId : caseRow.template_id;
        if (institutionId !== null && institutionId !== undefined) {
            const institutionResult = await postgres_1.postgres.query(`
        select id
        from institutions
        where id = $1
        limit 1
        `, [institutionId]);
            if (institutionResult.rows.length === 0) {
                throw new Error('institution not found');
            }
        }
        if (templateId !== null && templateId !== undefined) {
            const templateResult = await postgres_1.postgres.query(`
        select id
        from templates
        where id = $1
        limit 1
        `, [templateId]);
            if (templateResult.rows.length === 0) {
                throw new Error('template not found');
            }
        }
        const result = await postgres_1.postgres.query(`
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
        case_date,
        registration_date,
        submission_number,
        submitted_at,
        created_at,
        updated_at
      `, [caseId, institutionId ?? null, templateId ?? null]);
        const updatedCase = result.rows[0];
        const templateChanged = (caseRow.template_id ?? null) !== (templateId ?? null);
        const snapshot = await fsm_service_1.fsmService.getSnapshot(caseId);
        if (!snapshot) {
            throw new Error('fsm not found');
        }
        if (!fsm_service_1.fsmService.isEditableState(snapshot.state)) {
            throw new Error(`invalid fsm state: ${snapshot.state}`);
        }
        if (templateChanged) {
            const complaintTextPath = `${caseRow.nextcloud_artifacts_folder.replace(/\/+$/, '')}/complaint.txt`;
            const packagePath = `${caseRow.nextcloud_artifacts_folder.replace(/\/+$/, '')}/submission-package.json`;
            await nextcloud_client_1.nextcloudClient.deletePath(complaintTextPath);
            await nextcloud_client_1.nextcloudClient.deletePath(packagePath);
            await postgres_1.postgres.query(`
        delete from case_artifacts
        where case_id = $1
          and artifact_type in ('generated_text', 'submission_package')
        `, [caseId]);
        }
        await fsm_service_1.fsmService.syncWorkingState(caseId, {
            institutionId: institutionId ?? null,
            templateId: templateId ?? null,
            textReady: templateChanged ? false : snapshot.context.textReady,
            textChecksum: templateChanged ? null : snapshot.context.textChecksum,
            packageReady: false,
            packageChecksum: null,
            lastErrorCode: null,
            lastErrorMessage: null
        });
        await cases_service_1.casesService.logCaseAction(caseId, 'case.config.updated', {
            institutionId: institutionId ?? null,
            templateId: templateId ?? null,
        });
        return updatedCase;
    }
}
exports.CaseConfigService = CaseConfigService;
exports.caseConfigService = new CaseConfigService();
