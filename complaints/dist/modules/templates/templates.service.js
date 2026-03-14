"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.templatesService = exports.TemplatesService = void 0;
const postgres_1 = require("../db/postgres");
class TemplatesService {
    async listTemplates() {
        const result = await postgres_1.postgres.query(`
      select
        id,
        name,
        institution_id,
        body_template,
        variables_schema,
        default_values,
        created_at,
        updated_at
      from templates
      order by created_at desc
      `);
        return result.rows;
    }
    async getTemplateById(id) {
        const result = await postgres_1.postgres.query(`
      select
        id,
        name,
        institution_id,
        body_template,
        variables_schema,
        default_values,
        created_at,
        updated_at
      from templates
      where id = $1
      limit 1
      `, [id]);
        return result.rows[0] ?? null;
    }
    async createTemplate(body) {
        const name = body.name?.trim();
        const bodyTemplate = body.bodyTemplate?.trim();
        const institutionId = body.institutionId ?? null;
        const variablesSchema = body.variablesSchema ?? [];
        const defaultValues = body.defaultValues ?? {};
        if (!name) {
            throw new Error('name is required');
        }
        if (!bodyTemplate) {
            throw new Error('bodyTemplate is required');
        }
        if (!Array.isArray(variablesSchema)) {
            throw new Error('variablesSchema must be an array');
        }
        if (defaultValues === null ||
            Array.isArray(defaultValues) ||
            typeof defaultValues !== 'object') {
            throw new Error('defaultValues must be an object');
        }
        const result = await postgres_1.postgres.query(`
      insert into templates (
        name,
        institution_id,
        body_template,
        variables_schema,
        default_values
      )
      values ($1, $2, $3, $4::jsonb, $5::jsonb)
      returning
        id,
        name,
        institution_id,
        body_template,
        variables_schema,
        default_values,
        created_at,
        updated_at
      `, [
            name,
            institutionId,
            bodyTemplate,
            JSON.stringify(variablesSchema),
            JSON.stringify(defaultValues),
        ]);
        return result.rows[0];
    }
    async updateTemplate(id, body) {
        const existing = await this.getTemplateById(id);
        if (!existing) {
            throw new Error('template not found');
        }
        const name = body.name !== undefined ? body.name.trim() : existing.name;
        const institutionId = body.institutionId !== undefined ? body.institutionId : existing.institution_id;
        const bodyTemplate = body.bodyTemplate !== undefined ? body.bodyTemplate.trim() : existing.body_template;
        const variablesSchema = body.variablesSchema !== undefined ? body.variablesSchema : existing.variables_schema;
        const defaultValues = body.defaultValues !== undefined ? body.defaultValues : existing.default_values;
        if (!name) {
            throw new Error('name is required');
        }
        if (!bodyTemplate) {
            throw new Error('bodyTemplate is required');
        }
        if (!Array.isArray(variablesSchema)) {
            throw new Error('variablesSchema must be an array');
        }
        if (defaultValues === null ||
            Array.isArray(defaultValues) ||
            typeof defaultValues !== 'object') {
            throw new Error('defaultValues must be an object');
        }
        const result = await postgres_1.postgres.query(`
      update templates
      set
        name = $2,
        institution_id = $3,
        body_template = $4,
        variables_schema = $5::jsonb,
        default_values = $6::jsonb,
        updated_at = now()
      where id = $1
      returning
        id,
        name,
        institution_id,
        body_template,
        variables_schema,
        default_values,
        created_at,
        updated_at
      `, [
            id,
            name,
            institutionId,
            bodyTemplate,
            JSON.stringify(variablesSchema),
            JSON.stringify(defaultValues),
        ]);
        return result.rows[0];
    }
    async deleteTemplate(id) {
        const existing = await this.getTemplateById(id);
        if (!existing) {
            throw new Error('template not found');
        }
        const inUseResult = await postgres_1.postgres.query(`
      select count(*)::text as count
      from cases
      where template_id = $1
      `, [id]);
        const inUseCount = Number(inUseResult.rows[0]?.count ?? '0');
        if (inUseCount > 0) {
            throw new Error('template is used in cases');
        }
        await postgres_1.postgres.query(`
      delete from templates
      where id = $1
      `, [id]);
        return {
            id: existing.id,
            name: existing.name
        };
    }
}
exports.TemplatesService = TemplatesService;
exports.templatesService = new TemplatesService();
