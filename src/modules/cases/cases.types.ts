export interface CaseRecord {
  id: string;
  case_number: string;
  institution_id: string | null;
  title: string | null;
  description: string | null;
  template_id: string | null;
  nextcloud_case_folder: string;
  nextcloud_incoming_folder: string;
  nextcloud_artifacts_folder: string;
  nextcloud_result_folder: string;
  submission_number: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCaseResponse {
  case: CaseRecord;
  fsm: unknown;
}
