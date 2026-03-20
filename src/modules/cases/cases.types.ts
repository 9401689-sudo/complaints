export interface CaseRecord {
  id: string;
  case_number: string;
  case_status: string;
  parent_case_id: string | null;
  owner_user_id: string | null;
  institution_id: string | null;
  title: string | null;
  description: string | null;
  template_id: string | null;
  nextcloud_case_folder: string;
  nextcloud_incoming_folder: string;
  nextcloud_artifacts_folder: string;
  nextcloud_result_folder: string;
  case_date: string;
  registration_date: string | null;
  submission_number: string | null;
  response_comment: string | null;
  submitted_at: string | null;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
  institution_name?: string | null;
  template_name?: string | null;
  owner_nickname?: string | null;
  linked_cases_count?: number;
  has_reply?: boolean;
}

export interface CreateCaseResponse {
  case: CaseRecord;
  fsm: unknown;
}
