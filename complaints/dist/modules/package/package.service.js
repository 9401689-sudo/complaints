"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.packageService = exports.PackageService = void 0;
const cases_service_1 = require("../cases/cases.service");
const nextcloud_client_1 = require("../nextcloud/nextcloud.client");
function buildPackagePath(artifactsFolder) {
    return `${artifactsFolder.replace(/\/+$/, '')}/submission-package.json`;
}
class PackageService {
    async getCasePackage(caseId) {
        const caseRow = await cases_service_1.casesService.getCaseById(caseId);
        if (!caseRow) {
            throw new Error('case not found');
        }
        const filePath = buildPackagePath(caseRow.nextcloud_artifacts_folder);
        const packagePayload = await nextcloud_client_1.nextcloudClient.downloadJsonFile(filePath);
        return {
            caseId,
            filePath,
            packagePayload,
        };
    }
}
exports.PackageService = PackageService;
exports.packageService = new PackageService();
