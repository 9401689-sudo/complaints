import { casesService } from '../cases/cases.service';
import { nextcloudClient } from '../nextcloud/nextcloud.client';
import { AuthUser } from '../auth/auth.service';
import { GetCasePackageResult } from './package.types';

function buildPackagePath(artifactsFolder: string): string {
  return `${artifactsFolder.replace(/\/+$/, '')}/submission-package.json`;
}

export class PackageService {
  async getCasePackage(caseId: string, authUser?: AuthUser | null): Promise<GetCasePackageResult> {
    const caseRow = await casesService.getCaseById(caseId, authUser);

    if (!caseRow) {
      throw new Error('case not found');
    }

    const filePath = buildPackagePath(caseRow.nextcloud_artifacts_folder);
    const packagePayload = await nextcloudClient.downloadJsonFile(filePath);

    return {
      caseId,
      filePath,
      packagePayload,
    };
  }
}

export const packageService = new PackageService();
