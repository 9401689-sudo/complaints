export interface GetCaseTextResult {
  caseId: string;
  filePath: string;
  content: string;
}

export interface UpdateCaseTextBody {
  content: string;
}
