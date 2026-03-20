import { AuthUser } from '../auth/auth.service';
import { postgres } from '../db/postgres';
import {
  CreateInstitutionBody,
  InstitutionRecord,
  UpdateInstitutionBody,
} from './institutions.types';

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

export class InstitutionsService {
  async listInstitutions(authUser?: AuthUser | null): Promise<InstitutionRecord[]> {
    if (authUser && !isAdminRole(authUser.role)) {
      const result = await postgres.query<InstitutionRecord>(
        `
        select
          i.id,
          i.name,
          i.category,
          i.visibility,
          i.owner_user_id,
          u.nickname as owner_nickname,
          i.submit_url,
          i.max_attachments,
          i.max_text_length,
          i.accepted_formats,
          i.created_at,
          (i.visibility = 'private' and i.owner_user_id = $1) as can_edit,
          exists(
            select 1
            from institution_favorites f
            where f.user_id = $1
              and f.institution_id = i.id
          ) as is_favorite
        from institutions i
        left join users u on u.id = i.owner_user_id
        where i.deleted_at is null
          and (i.visibility = 'public' or i.owner_user_id = $1)
        order by
          case when i.visibility = 'public' then 0 else 1 end,
          i.created_at desc
        `,
        [authUser.id]
      );

      return result.rows;
    }

    const favoriteSelect = authUser?.id
      ? `exists(
          select 1
          from institution_favorites f
          where f.user_id = $1
            and f.institution_id = i.id
        )`
      : 'false';
    const canEditSelect = canManageDirectory(authUser?.role)
      ? 'true'
      : "(i.visibility = 'private' and i.owner_user_id = $1)";
    const result = await postgres.query<InstitutionRecord>(
      `
      select
        i.id,
        i.name,
        i.category,
        i.visibility,
        i.owner_user_id,
        u.nickname as owner_nickname,
        i.submit_url,
        i.max_attachments,
        i.max_text_length,
        i.accepted_formats,
        i.created_at,
        ${canEditSelect} as can_edit,
        ${favoriteSelect} as is_favorite
      from institutions i
      left join users u on u.id = i.owner_user_id
      where i.deleted_at is null
      order by
        case when i.visibility = 'public' then 0 else 1 end,
        i.created_at desc
      `,
      authUser?.id ? [authUser.id] : []
    );

    return result.rows;
  }

  async getInstitutionById(id: string, authUser?: AuthUser | null): Promise<InstitutionRecord | null> {
    if (authUser && !isAdminRole(authUser.role)) {
      const result = await postgres.query<InstitutionRecord>(
        `
        select
          i.id,
          i.name,
          i.category,
          i.visibility,
          i.owner_user_id,
          u.nickname as owner_nickname,
          i.submit_url,
          i.max_attachments,
          i.max_text_length,
          i.accepted_formats,
          i.created_at,
          (i.visibility = 'private' and i.owner_user_id = $2) as can_edit,
          exists(
            select 1
            from institution_favorites f
            where f.user_id = $2
              and f.institution_id = i.id
          ) as is_favorite
        from institutions i
        left join users u on u.id = i.owner_user_id
        where i.id = $1
          and i.deleted_at is null
          and (i.visibility = 'public' or i.owner_user_id = $2)
        limit 1
        `,
        [id, authUser.id]
      );

      return result.rows[0] ?? null;
    }

    const favoriteSelect = authUser?.id
      ? `exists(
          select 1
          from institution_favorites f
          where f.user_id = $2
            and f.institution_id = i.id
        )`
      : 'false';
    const canEditSelect = canManageDirectory(authUser?.role)
      ? 'true'
      : "(i.visibility = 'private' and i.owner_user_id = $2)";
    const result = await postgres.query<InstitutionRecord>(
      `
      select
        i.id,
        i.name,
        i.category,
        i.visibility,
        i.owner_user_id,
        u.nickname as owner_nickname,
        i.submit_url,
        i.max_attachments,
        i.max_text_length,
        i.accepted_formats,
        i.created_at,
        ${canEditSelect} as can_edit,
        ${favoriteSelect} as is_favorite
      from institutions i
      left join users u on u.id = i.owner_user_id
      where i.id = $1
        and i.deleted_at is null
      limit 1
      `,
      authUser?.id ? [id, authUser.id] : [id]
    );

    return result.rows[0] ?? null;
  }

  async createInstitution(body: CreateInstitutionBody, authUser?: AuthUser | null): Promise<InstitutionRecord> {
    const name = body.name?.trim();
    const category = body.category?.trim() || 'authority';
    const submitUrl = body.submitUrl?.trim() ?? '';
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

    const maxAttachments = body.maxAttachments ?? 5;
    const maxTextLength = body.maxTextLength ?? 4000;
    const acceptedFormats = body.acceptedFormats ?? ['image/jpeg', 'image/png'];

    if (!Number.isInteger(maxAttachments) || maxAttachments <= 0) {
      throw new Error('maxAttachments must be a positive integer');
    }

    if (!Number.isInteger(maxTextLength) || maxTextLength <= 0) {
      throw new Error('maxTextLength must be a positive integer');
    }

    if (!Array.isArray(acceptedFormats) || acceptedFormats.length === 0) {
      throw new Error('acceptedFormats must be a non-empty array');
    }

    const result = await postgres.query<InstitutionRecord>(
      `
      insert into institutions (
        name,
        category,
        visibility,
        owner_user_id,
        submit_url,
        max_attachments,
        max_text_length,
        accepted_formats
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
      returning
        id,
        name,
        category,
        visibility,
        owner_user_id,
        submit_url,
        max_attachments,
        max_text_length,
        accepted_formats,
        created_at
      `,
      [
        name,
        category,
        visibility,
        ownerUserId,
        submitUrl,
        maxAttachments,
        maxTextLength,
        JSON.stringify(acceptedFormats),
      ]
    );

    return (await this.getInstitutionById(result.rows[0].id, authUser)) ?? result.rows[0];
  }

  async updateInstitution(id: string, body: UpdateInstitutionBody, authUser?: AuthUser | null): Promise<InstitutionRecord> {
    const existing = await this.getInstitutionById(id, authUser);

    if (!existing) {
      throw new Error('institution not found');
    }

    if (authUser && !canManageDirectory(authUser.role) && !(existing.visibility === 'private' && existing.owner_user_id === authUser.id)) {
      throw new Error('institution access denied');
    }

    const name = body.name !== undefined ? body.name.trim() : existing.name;
    const category = body.category !== undefined ? body.category.trim() : existing.category;
    const submitUrl =
      body.submitUrl !== undefined ? body.submitUrl.trim() : (existing.submit_url || '');
    const maxAttachments =
      body.maxAttachments !== undefined ? body.maxAttachments : existing.max_attachments;
    const maxTextLength =
      body.maxTextLength !== undefined ? body.maxTextLength : existing.max_text_length;
    const acceptedFormats =
      body.acceptedFormats !== undefined ? body.acceptedFormats : existing.accepted_formats;
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

    if (!Number.isInteger(maxAttachments) || maxAttachments <= 0) {
      throw new Error('maxAttachments must be a positive integer');
    }

    if (!Number.isInteger(maxTextLength) || maxTextLength <= 0) {
      throw new Error('maxTextLength must be a positive integer');
    }

    if (!Array.isArray(acceptedFormats) || acceptedFormats.length === 0) {
      throw new Error('acceptedFormats must be a non-empty array');
    }

    const result = await postgres.query<InstitutionRecord>(
      `
      update institutions
      set
        name = $2,
        category = $3,
        visibility = $4,
        owner_user_id = $5,
        submit_url = $6,
        max_attachments = $7,
        max_text_length = $8,
        accepted_formats = $9::jsonb
      where id = $1
      returning
        id,
        name,
        category,
        visibility,
        owner_user_id,
        submit_url,
        max_attachments,
        max_text_length,
        accepted_formats,
        created_at
      `,
      [
        id,
        name,
        category,
        visibility,
        ownerUserId,
        submitUrl,
        maxAttachments,
        maxTextLength,
        JSON.stringify(acceptedFormats),
      ]
    );

    return (await this.getInstitutionById(result.rows[0].id, authUser)) ?? result.rows[0];
  }

  async deleteInstitution(id: string, authUser?: AuthUser | null) {
    const existing = await this.getInstitutionById(id, authUser);

    if (!existing) {
      throw new Error('institution not found');
    }

    if (authUser && !canManageDirectory(authUser.role) && !(existing.visibility === 'private' && existing.owner_user_id === authUser.id)) {
      throw new Error('institution access denied');
    }

    await postgres.query(
      `
      update institutions
      set
        deleted_at = now(),
        deleted_by_user_id = $2
      where id = $1
      `,
      [id, authUser?.id ?? null]
    );

    return {
      id: existing.id,
      name: existing.name,
    };
  }

  async purgeDeletedInstitutions(): Promise<{ count: number }> {
    const deletedResult = await postgres.query<{ id: string }>(
      `
      select id
      from institutions
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
          institution_id = null,
          updated_at = now()
        where institution_id = any($1::uuid[])
        `,
        [ids]
      );

      await postgres.query(
        `
        update templates
        set
          institution_id = null,
          updated_at = now()
        where institution_id = any($1::uuid[])
        `,
        [ids]
      );

      await postgres.query(
        `
        delete from institutions
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

  async addFavorite(id: string, authUser: AuthUser): Promise<InstitutionRecord> {
    const existing = await this.getInstitutionById(id, authUser);

    if (!existing) {
      throw new Error('institution not found');
    }

    await postgres.query(
      `
      insert into institution_favorites (user_id, institution_id)
      values ($1, $2)
      on conflict (user_id, institution_id) do nothing
      `,
      [authUser.id, id]
    );

    return (await this.getInstitutionById(id, authUser)) ?? existing;
  }

  async removeFavorite(id: string, authUser: AuthUser): Promise<InstitutionRecord> {
    const existing = await this.getInstitutionById(id, authUser);

    if (!existing) {
      throw new Error('institution not found');
    }

    await postgres.query(
      `
      delete from institution_favorites
      where user_id = $1
        and institution_id = $2
      `,
      [authUser.id, id]
    );

    return (await this.getInstitutionById(id, authUser)) ?? existing;
  }
}

export const institutionsService = new InstitutionsService();
