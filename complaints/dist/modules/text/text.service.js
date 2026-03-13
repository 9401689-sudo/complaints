"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.textService = exports.TextService = void 0;
const crypto_1 = require("crypto");
const cases_service_1 = require("../cases/cases.service");
const fsm_service_1 = require("../fsm/fsm.service");
const nextcloud_client_1 = require("../nextcloud/nextcloud.client");
function buildComplaintTextPath(artifactsFolder) {
    return `${artifactsFolder.replace(/\/+$/, '')}/complaint.txt`;
}
function sha256(input) {
    return (0, crypto_1.createHash)('sha256').update(input, 'utf8').digest('hex');
}
class TextService {
    async getCaseText(caseId) {
        const caseRow = await cases_service_1.casesService.getCaseById(caseId);
        if (!caseRow) {
            throw new Error('case not found');
        }
        const filePath = buildComplaintTextPath(caseRow.nextcloud_artifacts_folder);
        const content = await nextcloud_client_1.nextcloudClient.downloadTextFile(filePath);
        return {
            caseId,
            filePath,
            content,
        };
    }
    async saveCaseText(caseId, body) {
        const caseRow = await cases_service_1.casesService.getCaseById(caseId);
        if (!caseRow) {
            throw new Error('case not found');
        }
        if (!body || typeof body.content !== 'string') {
            throw new Error('content is required');
        }
        const snapshot = await fsm_service_1.fsmService.getSnapshot(caseId);
        if (!snapshot) {
            throw new Error('fsm not found');
        }
        if (!fsm_service_1.fsmService.isEditableState(snapshot.state)) {
            throw new Error(`invalid fsm state: ${snapshot.state}`);
        }
        const filePath = buildComplaintTextPath(caseRow.nextcloud_artifacts_folder);
        const content = body.content;
        const textChecksum = sha256(content);
        await nextcloud_client_1.nextcloudClient.uploadTextFile(filePath, content);
        await fsm_service_1.fsmService.syncWorkingState(caseId, {
            textReady: true,
            textChecksum,
            packageReady: false,
            packageChecksum: null,
            lastErrorCode: null,
            lastErrorMessage: null
        });
        await cases_service_1.casesService.logCaseAction(caseId, 'case.text.saved', {
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
exports.TextService = TextService;
exports.textService = new TextService();
