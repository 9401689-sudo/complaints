import { postgres } from '../db/postgres';
import {
  CreateTemplateBody,
  TemplateRecord,
  UpdateTemplateBody,
} from './templates.types';

export class TemplatesService {
  async listTemplates(): Promise<TemplateRecord[]> {
    const result = await postgres.query<TemplateRecord>(
      `
      select
        id,
        name,
        institution_id,
        body_template,
        variables_schema,
        default_values,
        active,
        created_at,
        updated_at
      from templates
      order by created_at desc
      `
    );

    return result.rows;
  }

  async getTemplateById(id: string): Promise<TemplateRecord | null> {
    const result = await postgres.query<TemplateRecord>(
      `
      select
        id,
        name,
        institution_id,
        body_template,
        variables_schema,
        default_values,
        active,
        created_at,
        updated_at
      from templates
      where id = $1
      limit 1
      `,
      [id]
    );

    return result.rows[0] ?? null;
  }

  async createTemplate(body: CreateTemplateBody): Promise<TemplateRecord> {
    const name = body.name?.trim();
    const bodyTemplate = body.bodyTemplate?.trim();
    const institutionId = body.institutionId ?? null;
    const variablesSchema = body.variablesSchema ?? [];
    const defaultValues = body.defaultValues ?? {};
    const active = body.active ?? true;

    if (!name) {
      throw new Error('name is required');
    }

    if (!bodyTemplate) {
      throw new Error('bodyTemplate is required');
    }

    if (!Array.isArray(variablesSchema)) {
      throw new Error('variablesSchema must be an array');
    }

    if (
      defaultValues === null ||
      Array.isArray(defaultValues) ||
      typeof defaultValues !== 'object'
    ) {
      throw new Error('defaultValues must be an object');
    }

    const result = await postgres.query<TemplateRecord>(
      `
      insert into templates (
        name,
        institution_id,
        body_template,
        variables_schema,
        default_values,
        active
      )
      values ($1, $2, $3, $4::jsonb, $5::jsonb, $6)
      returning
        id,
        name,
        institution_id,
        body_template,
        variables_schema,
        default_values,
        active,
        created_at,
        updated_at
      `,
      [
        name,
        institutionId,
        bodyTemplate,
        JSON.stringify(variablesSchema),
        JSON.stringify(defaultValues),
        active,
      ]
    );

    return result.rows[0];
  }

  async updateTemplate(id: string, body: UpdateTemplateBody): Promise<TemplateRecord> {
    const existing = await this.getTemplateById(id);

    if (!existing) {
      throw new Error('template not found');
    }

    const name = body.name !== undefined ? body.name.trim() : existing.name;
    const institutionId =
      body.institutionId !== undefined ? body.institutionId : existing.institution_id;
    const bodyTemplate =
      body.bodyTemplate !== undefined ? body.bodyTemplate.trim() : existing.body_template;
    const variablesSchema =
      body.variablesSchema !== undefined ? body.variablesSchema : existing.variables_schema;
    const defaultValues =
      body.defaultValues !== undefined ? body.defaultValues : existing.default_values;
    const active = body.active !== undefined ? body.active : existing.active;

    if (!name) {
      throw new Error('name is required');
    }

    if (!bodyTemplate) {
      throw new Error('bodyTemplate is required');
    }

    if (!Array.isArray(variablesSchema)) {
      throw new Error('variablesSchema must be an array');
    }

    if (
      defaultValues === null ||
      Array.isArray(defaultValues) ||
      typeof defaultValues !== 'object'
    ) {
      throw new Error('defaultValues must be an object');
    }

    const result = await postgres.query<TemplateRecord>(
      `
      update templates
      set
        name = $2,
        institution_id = $3,
        body_template = $4,
        variables_schema = $5::jsonb,
        default_values = $6::jsonb,
        active = $7,
        updated_at = now()
      where id = $1
      returning
        id,
        name,
        institution_id,
        body_template,
        variables_schema,
        default_values,
        active,
        created_at,
        updated_at
      `,
      [
        id,
        name,
        institutionId,
        bodyTemplate,
        JSON.stringify(variablesSchema),
        JSON.stringify(defaultValues),
        active,
      ]
    );

    return result.rows[0];
  }
  async deleteTemplate(id: string) {
    const existing = await this.getTemplateById(id);

    if (!existing) {
      throw new Error('template not found');
    }

    const inUseResult = await postgres.query<{ count: string }>(
      `
      select count(*)::text as count
      from cases
      where template_id = $1
      `,
      [id]
    );

    const inUseCount = Number(inUseResult.rows[0]?.count ?? '0');

    if (inUseCount > 0) {
      throw new Error('template is used in cases');
    }

    await postgres.query(
      `
      delete from templates
      where id = $1
      `,
      [id]
    );

    return {
      id: existing.id,
      name: existing.name
    };
  }
}

export const templatesService = new TemplatesService();
