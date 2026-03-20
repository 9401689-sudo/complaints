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
          (t.visibility = 'private' and t.owner_user_id = $1) as can_edit,
          exists(
            select 1
            from template_favorites f
            where f.user_id = $1
              and f.template_id = t.id
          ) as is_favorite
        from templates t
        left join users u on u.id = t.owner_user_id
        where t.deleted_at is null
          and (t.visibility = 'public' or t.owner_user_id = $1)
        order by
          case when t.visibility = 'public' then 0 else 1 end,
          t.created_at desc
        `,
        [authUser.id]
      );

      return result.rows;
    }

    const favoriteSelect = authUser?.id
      ? `exists(
          select 1
          from template_favorites f
          where f.user_id = $1
            and f.template_id = t.id
        )`
      : 'false';
    const canEditSelect = canManageDirectory(authUser?.role)
      ? 'true'
      : "(t.visibility = 'private' and t.owner_user_id = $1)";
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
        ${canEditSelect} as can_edit,
        ${favoriteSelect} as is_favorite
      from templates t
      left join users u on u.id = t.owner_user_id
      where t.deleted_at is null
      order by
        case when t.visibility = 'public' then 0 else 1 end,
        t.created_at desc
      `,
      authUser?.id ? [authUser.id] : []
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
          (t.visibility = 'private' and t.owner_user_id = $2) as can_edit,
          exists(
            select 1
            from template_favorites f
            where f.user_id = $2
              and f.template_id = t.id
          ) as is_favorite
        from templates t
        left join users u on u.id = t.owner_user_id
        where t.id = $1
          and t.deleted_at is null
          and (t.visibility = 'public' or t.owner_user_id = $2)
        limit 1
        `,
        [id, authUser.id]
      );

      return result.rows[0] ?? null;
    }

    const favoriteSelect = authUser?.id
      ? `exists(
          select 1
          from template_favorites f
          where f.user_id = $2
            and f.template_id = t.id
        )`
      : 'false';
    const canEditSelect = canManageDirectory(authUser?.role)
      ? 'true'
      : "(t.visibility = 'private' and t.owner_user_id = $2)";
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
        ${canEditSelect} as can_edit,
        ${favoriteSelect} as is_favorite
      from templates t
      left join users u on u.id = t.owner_user_id
      where t.id = $1
        and t.deleted_at is null
      limit 1
      `,
      authUser?.id ? [id, authUser.id] : [id]
    );

    return result.rows[0] ?? null;
  }

  async createTemplate(body: CreateTemplateBody, authUser?: AuthUser | null): Promise<TemplateRecord> {
    const name = body.name?.trim();
    const category = body.category?.trim() || 'authority';
    const bodyTemplate = body.bodyTemplate?.trim() ?? '';
    const variablesSchema = body.variablesSchema ?? [];
    const defaultValues = body.defaultValues ?? {};
    const requestedVisibility = normalizeVisibility(body.visibility);
    const visibility = authUser && !canManageDirectory(authUser.role) ? 'private' : requestedVisibility;
    const ownerUserId = visibility === 'private' ? authUser?.id ?? null : authUser?.id ?? null;

    if (!name) {
      throw new Error('name is required');
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
      body.bodyTemplate !== undefined ? body.bodyTemplate.trim() : (existing.body_template || '');
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

    await postgres.query(
      `
      update templates
      set
        deleted_at = now(),
        deleted_by_user_id = $2
      where id = $1
      `,
      [id, authUser?.id ?? null]
    );

    return {
      id: existing.id,
      name: existing.name
    };
  }

  async purgeDeletedTemplates(): Promise<{ count: number }> {
    const deletedResult = await postgres.query<{ id: string }>(
      `
      select id
      from templates
      where deleted_at is not null
      `
    );

    if (!deletedResult.rows.length) {
      return { count: 0 };
    }

    const ids = deletedResult.rows.map((row) => row.id);

    await postgres.query('begin');

    try {
      await postgres.query(
        `
        update cases
        set
          template_id = null,
          updated_at = now()
        where template_id = any($1::uuid[])
        `,
        [ids]
      );

      await postgres.query(
        `
        delete from templates
        where id = any($1::uuid[])
        `,
        [ids]
      );

      await postgres.query('commit');
    } catch (error) {
      await postgres.query('rollback');
      throw error;
    }

    return { count: ids.length };
  }

  async addFavorite(id: string, authUser: AuthUser): Promise<TemplateRecord> {
    const existing = await this.getTemplateById(id, authUser);

    if (!existing) {
      throw new Error('template not found');
    }

    await postgres.query(
      `
      insert into template_favorites (user_id, template_id)
      values ($1, $2)
      on conflict (user_id, template_id) do nothing
      `,
      [authUser.id, id]
    );

    return (await this.getTemplateById(id, authUser)) ?? existing;
  }

  async removeFavorite(id: string, authUser: AuthUser): Promise<TemplateRecord> {
    const existing = await this.getTemplateById(id, authUser);

    if (!existing) {
      throw new Error('template not found');
    }

    await postgres.query(
      `
      delete from template_favorites
      where user_id = $1
        and template_id = $2
      `,
      [authUser.id, id]
    );

    return (await this.getTemplateById(id, authUser)) ?? existing;
  }
}

export const templatesService = new TemplatesService();
