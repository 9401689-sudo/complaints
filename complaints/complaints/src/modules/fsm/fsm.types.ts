export type CaseFsmState =
  | 'case_created'
  | 'awaiting_files'
  | 'files_synced'
  | 'files_selected'
  | 'institution_selected'
  | 'template_selected'
  | 'text_prepared'
  | 'package_ready'
  | 'ready_to_submit'
  | 'submitted_pending_fixation'
  | 'submitted'
  | 'failed'
  | 'archived';

export type CaseFsmEvent =
  | 'CASE_CREATED'
  | 'CASE_FOLDER_CREATED'
  | 'CASE_FOLDER_CREATE_FAILED'
  | 'FILES_SYNC_REQUESTED'
  | 'FILES_SYNCED'
  | 'FILES_SYNC_FAILED'
  | 'FILES_SELECTED_UPDATED'
  | 'FILES_CLEARED'
  | 'INSTITUTION_SET'
  | 'TEMPLATE_SET'
  | 'TEMPLATE_RENDERED'
  | 'TEMPLATE_RENDER_FAILED'
  | 'TEXT_SAVED'
  | 'TEXT_INVALIDATED'
  | 'PACKAGE_BUILD_REQUESTED'
  | 'PACKAGE_BUILT'
  | 'PACKAGE_BUILD_FAILED'
  | 'READY_TO_SUBMIT_CONFIRMED'
  | 'SUBMISSION_MARKED_DONE'
  | 'SUBMISSION_FIXATED'
  | 'SUBMISSION_FIXATION_FAILED'
  | 'RETRY'
  | 'RESET_TO_STEP'
  | 'ARCHIVE'
  | 'FAIL';

export interface CaseFsmContext {
  caseId: string;
  caseNumber: string;

  filesTotal: number;
  filesSelected: number;
  selectedFileIds: string[];

  institutionId: string | null;
  templateId: string | null;
  templateVersion: number | null;

  textReady: boolean;
  textChecksum: string | null;

  packageReady: boolean;
  packageChecksum: string | null;

  submissionNumber: string | null;

  lastErrorCode: string | null;
  lastErrorMessage: string | null;
}

export interface CaseFsmSnapshot {
  state: CaseFsmState;
  version: number;
  updatedAt: string;
  lastEvent: CaseFsmEvent;
  context: CaseFsmContext;
}

export interface TransitionResult {
  from: CaseFsmState;
  to: CaseFsmState;
  event: CaseFsmEvent;
  snapshot: CaseFsmSnapshot;
}

export interface ApplyEventInput {
  caseId: string;
  event: CaseFsmEvent;
  patch?: Partial<CaseFsmContext>;
  forceState?: CaseFsmState;
}
