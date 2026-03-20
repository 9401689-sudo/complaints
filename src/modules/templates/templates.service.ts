import { AuthUser } from '../auth/auth.service';
import { postgres } from '../db/postgres';
import {
  CreateTemplateBody,
  TemplateRecord,
  UpdateTemplateBody,
} from './templates.types';

const ALLOWED_CATEGORIES = new Set(['authority', 'state_org']);
const ALLOWED_VISIBILITY = new Set(['public', 'private']);

function isAdminRole(role?: string | null): boolean {
  return role === 'admin_view' || role === 'admin_full';
}

function canManageDirectory(role?: string | null): boolean {
  return role === 'admin_full';
}

function normalizeVisibility(input?: string | null): 'public' | 'private' {
  return input === 'private' ? 'private' : 'public';
}

export class TemplatesService {
  async listTemplates(authUser?: AuthUser | null): Promise<TemplateRecord[]> {
    if (authUser && !isAdminRole(authUser.role)) {
      const result = await postgres.query<TemplateRecord>(
        `
        select
          t.id,
          t.name,
          t.category,
          t.visibility,
          t.owner_user_id,
          u.nickname as owner_nickname,
          t.institution_id,
          t.body_template,
          t.variables_schema,
          t.default_values,
          t.created_at,
          t.updated_at,
          (t.visibility = 'private' and t.owner_user_id = $1) as can_edit
        from templates t
        left join users u on u.id = t.owner_user_id
        where t.visibility = 'public' or t.owner_user_id = $1
        order by
          case when t.visibility = 'public' then 0 else 1 end,
          t.created_at desc
        `,
        [authUser.id]
      );

      return result.rows;
    }

    const result = await postgres.query<TemplateRecord>(
      `
      select
        t.id,
        t.name,
        t.category,
        t.visibility,
        t.owner_user_id,
        u.nickname as owner_nickname,
        t.institution_id,
        t.body_template,
        t.variables_schema,
        t.default_values,
        t.created_at,
        t.updated_at,
        ${canManageDirectory(authUser?.role) ? 'true' : "(t.visibility = 'private' and t.owner_user_id = $1)"} as can_edit
      from templates t
      left join users u on u.id = t.owner_user_id
      order by
        case when t.visibility = 'public' then 0 else 1 end,
        t.created_at desc
      `,
      canManageDirectory(authUser?.role) ? [] : [authUser?.id ?? null]
    );

    return result.rows;
  }

  async getTemplateById(id: string, authUser?: AuthUser | null): Promise<TemplateRecord | null> {
    if (authUser && !isAdminRole(authUser.role)) {
      const result = await postgres.query<TemplateRecord>(
        `
        select
          t.id,
          t.name,
          t.category,
          t.visibility,
          t.owner_user_id,
          u.nickname as owner_nickname,
          t.institution_id,
          t.body_template,
          t.variables_schema,
          t.default_values,
          t.created_at,
          t.updated_at,
          (t.visibility = 'private' and t.owner_user_id = $2) as can_edit
        from templates t
        left join users u on u.id = t.owner_user_id
        where t.id = $1
          and (t.visibility = 'public' or t.owner_user_id = $2)
        limit 1
        `,
        [id, authUser.id]
      );

      return result.rows[0] ?? null;
    }

    const result = await postgres.query<TemplateRecord>(
      `
      select
        t.id,
        t.name,
        t.category,
        t.visibility,
        t.owner_user_id,
        u.nickname as owner_nickname,
        t.institution_id,
        t.body_template,
        t.variables_schema,
        t.default_values,
        t.created_at,
        t.updated_at,
        ${canManageDirectory(authUser?.role) ? 'true' : "(t.visibility = 'private' and t.owner_user_id = $2)"} as can_edit
      from templates t
      left join users u on u.id = t.owner_user_id
      where t.id = $1
      limit 1
      `,
      canManageDirectory(authUser?.role) ? [id] : [id, authUser?.id ?? null]
    );

    return result.rows[0] ?? null;
  }

  async createTemplate(body: CreateTemplateBody, authUser?: AuthUser | null): Promise<TemplateRecord> {
    const name = body.name?.trim();
    const category = body.category?.trim() || 'authority';
    const bodyTemplate = body.bodyTemplate?.trim();
    const variablesSchema = body.variablesSchema ?? [];
    const defaultValues = body.defaultValues ?? {};
    const requestedVisibility = normalizeVisibility(body.visibility);
    const visibility = authUser && !canManageDirectory(authUser.role) ? 'private' : requestedVisibility;
    const ownerUserId = visibility === 'private' ? authUser?.id ?? null : authUser?.id ?? null;

    if (!name) {
      throw new Error('name is required');
    }

    if (!bodyTemplate) {
      throw new Error('bodyTemplate is required');
    }

    if (!ALLOWED_CATEGORIES.has(category)) {
      throw new Error('category is invalid');
    }

    if (!ALLOWED_VISIBILITY.has(visibility)) {
      throw new Error('visibility is invalid');
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
        category,
        visibility,
        owner_user_id,
        institution_id,
        body_template,
        variables_schema,
        default_values
      )
      values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb)
      returning
        id,
        name,
        category,
        visibility,
        owner_user_id,
        institution_id,
        body_template,
        variables_schema,
        default_values,
        created_at,
        updated_at
      `,
      [
        name,
        category,
        visibility,
        ownerUserId,
        null,
        bodyTemplate,
        JSON.stringify(variablesSchema),
        JSON.stringify(defaultValues),
      ]
    );

    return (await this.getTemplateById(result.rows[0].id, authUser)) ?? result.rows[0];
  }

  async updateTemplate(id: string, body: UpdateTemplateBody, authUser?: AuthUser | null): Promise<TemplateRecord> {
    const existing = await this.getTemplateById(id, authUser);

    if (!existing) {
      throw new Error('template not found');
    }

    if (authUser && !canManageDirectory(authUser.role) && !(existing.visibility === 'private' && existing.owner_user_id === authUser.id)) {
      throw new Error('template access denied');
    }

    const name = body.name !== undefined ? body.name.trim() : existing.name;
    const category = body.category !== undefined ? body.category.trim() : existing.category;
    const bodyTemplate =
      body.bodyTemplate !== undefined ? body.bodyTemplate.trim() : existing.body_template;
    const variablesSchema =
      body.variablesSchema !== undefined ? body.variablesSchema : existing.variables_schema;
    const defaultValues =
      body.defaultValues !== undefined ? body.defaultValues : existing.default_values;
    const requestedVisibility =
      body.visibility !== undefined ? normalizeVisibility(body.visibility) : existing.visibility;
    const visibility =
      authUser && !canManageDirectory(authUser.role)
        ? 'private'
        : requestedVisibility;
    const ownerUserId =
      visibility === 'private'
        ? (existing.owner_user_id || authUser?.id || null)
        : existing.owner_user_id;

    if (!name) {
      throw new Error('name is required');
    }

    if (!bodyTemplate) {
      throw new Error('bodyTemplate is required');
    }

    if (!ALLOWED_CATEGORIES.has(category)) {
      throw new Error('category is invalid');
    }

    if (!ALLOWED_VISIBILITY.has(visibility)) {
      throw new Error('visibility is invalid');
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
        category = $3,
        visibility = $4,
        owner_user_id = $5,
        institution_id = $6,
        body_template = $7,
        variables_schema = $8::jsonb,
        default_values = $9::jsonb,
        updated_at = now()
      where id = $1
      returning
        id,
        name,
        category,
        visibility,
        owner_user_id,
        institution_id,
        body_template,
        variables_schema,
        default_values,
        created_at,
        updated_at
      `,
      [
        id,
        name,
        category,
        visibility,
        ownerUserId,
        existing.institution_id,
        bodyTemplate,
        JSON.stringify(variablesSchema),
        JSON.stringify(defaultValues),
      ]
    );

    return (await this.getTemplateById(result.rows[0].id, authUser)) ?? result.rows[0];
  }

  async deleteTemplate(id: string, authUser?: AuthUser | null) {
    const existing = await this.getTemplateById(id, authUser);

    if (!existing) {
      throw new Error('template not found');
    }

    if (authUser && !canManageDirectory(authUser.role) && !(existing.visibility === 'private' && existing.owner_user_id === authUser.id)) {
      throw new Error('template access denied');
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
