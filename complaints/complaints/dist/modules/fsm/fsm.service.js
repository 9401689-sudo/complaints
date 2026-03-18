"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fsmService = exports.FsmService = void 0;
const redis_1 = require("../redis/redis");
class FsmService {
    getKey(caseId) {
        return `complaints:case:${caseId}:fsm`;
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
}
exports.FsmService = FsmService;
exports.fsmService = new FsmService();
