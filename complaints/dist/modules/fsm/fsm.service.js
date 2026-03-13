"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fsmService = exports.FsmService = exports.EDITABLE_CASE_STATES = void 0;
const redis_1 = require("../redis/redis");
exports.EDITABLE_CASE_STATES = [
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
class FsmService {
    getKey(caseId) {
        return `complaints:case:${caseId}:fsm`;
    }
    isEditableState(state) {
        return exports.EDITABLE_CASE_STATES.includes(state);
    }
    deriveWorkingState(context) {
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
    async getSnapshot(caseId) {
        const raw = await redis_1.redis.get(this.getKey(caseId));
        if (!raw) {
            return null;
        }
        return JSON.parse(raw);
    }
    async saveSnapshot(caseId, snapshot) {
        await redis_1.redis.set(this.getKey(caseId), JSON.stringify(snapshot));
    }
    async patchContext(caseId, patch) {
        const snapshot = await this.getSnapshot(caseId);
        if (!snapshot) {
            throw new Error(`FSM not found for case ${caseId}`);
        }
        const next = {
            ...snapshot,
            context: {
                ...snapshot.context,
                ...patch,
            },
        };
        await this.saveSnapshot(caseId, next);
        return next;
    }
    async transition(caseId, nextState, contextPatch) {
        const snapshot = await this.getSnapshot(caseId);
        if (!snapshot) {
            throw new Error(`FSM not found for case ${caseId}`);
        }
        const next = {
            state: nextState,
            context: {
                ...snapshot.context,
                ...(contextPatch ?? {}),
            },
        };
        await this.saveSnapshot(caseId, next);
        return next;
    }
    async syncWorkingState(caseId, contextPatch) {
        const snapshot = await this.getSnapshot(caseId);
        if (!snapshot) {
            throw new Error(`FSM not found for case ${caseId}`);
        }
        const nextContext = {
            ...snapshot.context,
            ...(contextPatch ?? {})
        };
        const nextState = this.deriveWorkingState(nextContext);
        const next = {
            state: nextState,
            context: nextContext
        };
        await this.saveSnapshot(caseId, next);
        return next;
    }
}
exports.FsmService = FsmService;
exports.fsmService = new FsmService();
