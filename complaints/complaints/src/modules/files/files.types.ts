export type CaseFileRecord = {
  id: string;
  case_id: string;
  file_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  checksum: string | null;
  preview_url: string | null;
  selected_for_submission: boolean;
  sort_order: number | null;
  source_mtime: string | null;
  created_at: string;
};

export type SyncedCaseFile = {
  filePath: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  checksum?: string | null;
  previewUrl?: string | null;
  sourceMtime: string | null;
};

export type UpdateCaseFilesItem = {
  fileId: string;
  selected: boolean;
  sortOrder?: number | null;
};

export type UpdateCaseFilesBody = {
  files: UpdateCaseFilesItem[];
};

export type UpdateCaseFilesResult = {
  caseId: string;
  selectedCount: number;
  files: CaseFileRecord[];
};
