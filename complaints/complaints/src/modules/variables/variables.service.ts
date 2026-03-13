import { postgres } from '../db/postgres';
import { casesService } from '../cases/cases.service';
import {
  CaseVariableRecord,
  CaseVariablesMap,
  UpdateCaseVariablesBody,
} from './variables.types';

export class VariablesService {
  async getCaseVariables(caseId: string): Promise<CaseVariablesMap> {
    const caseRow = await casesService.getCaseById(caseId);

    if (!caseRow) {
      throw new Error('case not found');
    }

    const result = await postgres.query<CaseVariableRecord>(
      `
      select
        id,
        case_id,
        var_key,
        var_value,
        created_at
      from case_variables
      where case_id = $1
      order by created_at asc
      `,
      [caseId]
    );

    const variables: CaseVariablesMap = {};

    for (const row of result.rows) {
      variables[row.var_key] = row.var_value ?? '';
    }

    return variables;
  }

  async updateCaseVariables(
    caseId: string,
    body: UpdateCaseVariablesBody
  ): Promise<CaseVariablesMap> {
    const caseRow = await casesService.getCaseById(caseId);

    if (!caseRow) {
      throw new Error('case not found');
    }

    if (!body || typeof body !== 'object' || !body.variables || typeof body.variables !== 'object' || Array.isArray(body.variables)) {
      throw new Error('variables object is required');
    }

    await postgres.query('begin');

    try {
      for (const [key, rawValue] of Object.entries(body.variables)) {
        const varKey = key.trim();

        if (!varKey) {
          throw new Error('variable key cannot be empty');
        }

        const varValue =
          rawValue === null || rawValue === undefined ? '' : String(rawValue);

        await postgres.query(
          `
          insert into case_variables (
            case_id,
            var_key,
            var_value
          )
          values ($1, $2, $3)
          on conflict (case_id, var_key)
          do update set
            var_value = excluded.var_value
          `,
          [caseId, varKey, varValue]
        );
      }

      await casesService.logCaseAction(caseId, 'case.variables.updated', {
        variables: body.variables,
      });

      await postgres.query('commit');
    } catch (error) {
      await postgres.query('rollback');
      throw error;
    }

    return this.getCaseVariables(caseId);
  }
}

export const variablesService = new VariablesService();
