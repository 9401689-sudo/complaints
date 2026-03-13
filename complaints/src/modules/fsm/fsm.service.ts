import { redis } from '../redis/redis';

export type CaseState =
  | 'draft'
  | 'awaiting_files'
  | 'files_synced'
  | 'files_selected'
  | 'text_ready'
  | 'package_ready'
  | 'submitted'
  | 'files_sync_failed'
  | 'nextcloud_failed'
  | 'submission_failed';

export type FsmContext = {
  caseId: string;
  caseNumber: string;
  filesTotal: number;
  filesSelected: number;
  selectedFileIds: string[];
  institutionId: string | null;
  templateId: string | null;
  templateVersion: string | null;
  textReady: boolean;
  textChecksum: string | null;
  packageReady: boolean;
  packageChecksum: string | null;
  submissionNumber: string | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
};

export type FsmSnapshot = {
  state: CaseState;
  context: FsmContext;
};

export const EDITABLE_CASE_STATES: CaseState[] = [
  'draft',
  'awaiting_files',
  'files_synced',
  'files_selected',
  'text_ready',
  'package_ready',
  'files_sync_failed',
  'nextcloud_failed',
  'submission_failed'
];

export class FsmService {
  private getKey(caseId: string): string {
    return `complaints:case:${caseId}:fsm`;
  }

  isEditableState(state: CaseState): boolean {
    return EDITABLE_CASE_STATES.includes(state);
  }

  deriveWorkingState(context: Pick<FsmContext, 'filesTotal' | 'filesSelected' | 'textReady' | 'packageReady'>): CaseState {
    if (context.packageReady) {
      return 'package_ready';
    }

    if (context.textReady) {
      return 'text_ready';
    }

    if (context.filesSelected > 0) {
      return 'files_selected';
    }

    if (context.filesTotal > 0) {
      return 'files_synced';
    }

    return 'awaiting_files';
  }

  async getSnapshot(caseId: string): Promise<FsmSnapshot | null> {
    const raw = await redis.get(this.getKey(caseId));

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as FsmSnapshot;
  }

  async saveSnapshot(caseId: string, snapshot: FsmSnapshot): Promise<void> {
    await redis.set(this.getKey(caseId), JSON.stringify(snapshot));
  }

  async patchContext(caseId: string, patch: Partial<FsmContext>): Promise<FsmSnapshot> {
    const snapshot = await this.getSnapshot(caseId);

    if (!snapshot) {
      throw new Error(`FSM not found for case ${caseId}`);
    }

    const next: FsmSnapshot = {
      ...snapshot,
      context: {
        ...snapshot.context,
        ...patch,
      },
    };

    await this.saveSnapshot(caseId, next);
    return next;
  }

  async transition(
    caseId: string,
    nextState: CaseState,
    contextPatch?: Partial<FsmContext>
  ): Promise<FsmSnapshot> {
    const snapshot = await this.getSnapshot(caseId);

    if (!snapshot) {
      throw new Error(`FSM not found for case ${caseId}`);
    }

    const next: FsmSnapshot = {
      state: nextState,
      context: {
        ...snapshot.context,
        ...(contextPatch ?? {}),
      },
    };

    await this.saveSnapshot(caseId, next);
    return next;
  }

  async syncWorkingState(caseId: string, contextPatch?: Partial<FsmContext>): Promise<FsmSnapshot> {
    const snapshot = await this.getSnapshot(caseId);

    if (!snapshot) {
      throw new Error(`FSM not found for case ${caseId}`);
    }

    const nextContext: FsmContext = {
      ...snapshot.context,
      ...(contextPatch ?? {})
    };

    const nextState = this.deriveWorkingState(nextContext);
    const next: FsmSnapshot = {
      state: nextState,
      context: nextContext
    };

    await this.saveSnapshot(caseId, next);
    return next;
  }
}

export const fsmService = new FsmService();
