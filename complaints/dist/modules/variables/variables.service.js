"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.variablesService = exports.VariablesService = void 0;
const postgres_1 = require("../db/postgres");
const cases_service_1 = require("../cases/cases.service");
const fsm_service_1 = require("../fsm/fsm.service");
class VariablesService {
    async getCaseVariables(caseId) {
        const caseRow = await cases_service_1.casesService.getCaseById(caseId);
        if (!caseRow) {
            throw new Error('case not found');
        }
        const result = await postgres_1.postgres.query(`
      select
        id,
        case_id,
        var_key,
        var_value,
        created_at
      from case_variables
      where case_id = $1
      order by created_at asc
      `, [caseId]);
        const variables = {};
        for (const row of result.rows) {
            variables[row.var_key] = row.var_value ?? '';
        }
        return variables;
    }
    async updateCaseVariables(caseId, body) {
        const caseRow = await cases_service_1.casesService.getCaseById(caseId);
        if (!caseRow) {
            throw new Error('case not found');
        }
        if (!body || typeof body !== 'object' || !body.variables || typeof body.variables !== 'object' || Array.isArray(body.variables)) {
            throw new Error('variables object is required');
        }
        const snapshot = await fsm_service_1.fsmService.getSnapshot(caseId);
        if (!snapshot) {
            throw new Error('fsm not found');
        }
        if (!fsm_service_1.fsmService.isEditableState(snapshot.state)) {
            throw new Error(`invalid fsm state: ${snapshot.state}`);
        }
        await postgres_1.postgres.query('begin');
        try {
            for (const [key, rawValue] of Object.entries(body.variables)) {
                const varKey = key.trim();
                if (!varKey) {
                    throw new Error('variable key cannot be empty');
                }
                const varValue = rawValue === null || rawValue === undefined ? '' : String(rawValue);
                await postgres_1.postgres.query(`
          insert into case_variables (
            case_id,
            var_key,
            var_value
          )
          values ($1, $2, $3)
          on conflict (case_id, var_key)
          do update set
            var_value = excluded.var_value
          `, [caseId, varKey, varValue]);
            }
            await cases_service_1.casesService.logCaseAction(caseId, 'case.variables.updated', {
                variables: body.variables,
            });
            await postgres_1.postgres.query('commit');
        }
        catch (error) {
            await postgres_1.postgres.query('rollback');
            throw error;
        }
        await fsm_service_1.fsmService.syncWorkingState(caseId, {
            lastErrorCode: null,
            lastErrorMessage: null
        });
        return this.getCaseVariables(caseId);
    }
}
exports.VariablesService = VariablesService;
exports.variablesService = new VariablesService();
