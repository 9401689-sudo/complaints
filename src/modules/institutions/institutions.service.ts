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
          (i.visibility = 'private' and i.owner_user_id = $1) as can_edit
        from institutions i
        left join users u on u.id = i.owner_user_id
        where i.visibility = 'public' or i.owner_user_id = $1
        order by
          case when i.visibility = 'public' then 0 else 1 end,
          i.created_at desc
        `,
        [authUser.id]
      );

      return result.rows;
    }

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
        ${canManageDirectory(authUser?.role) ? 'true' : "(i.visibility = 'private' and i.owner_user_id = $1)"} as can_edit
      from institutions i
      left join users u on u.id = i.owner_user_id
      order by
        case when i.visibility = 'public' then 0 else 1 end,
        i.created_at desc
      `,
      canManageDirectory(authUser?.role) ? [] : [authUser?.id ?? null]
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
          (i.visibility = 'private' and i.owner_user_id = $2) as can_edit
        from institutions i
        left join users u on u.id = i.owner_user_id
        where i.id = $1
          and (i.visibility = 'public' or i.owner_user_id = $2)
        limit 1
        `,
        [id, authUser.id]
      );

      return result.rows[0] ?? null;
    }

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
        ${canManageDirectory(authUser?.role) ? 'true' : "(i.visibility = 'private' and i.owner_user_id = $2)"} as can_edit
      from institutions i
      left join users u on u.id = i.owner_user_id
      where i.id = $1
      limit 1
      `,
      canManageDirectory(authUser?.role) ? [id] : [id, authUser?.id ?? null]
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

    const casesResult = await postgres.query<{ count: string }>(
      `
      select count(*)::text as count
      from cases
      where institution_id = $1
      `,
      [id]
    );

    const templatesResult = await postgres.query<{ count: string }>(
      `
      select count(*)::text as count
      from templates
      where institution_id = $1
      `,
      [id]
    );

    const casesCount = Number(casesResult.rows[0]?.count ?? '0');
    const templatesCount = Number(templatesResult.rows[0]?.count ?? '0');

    if (casesCount > 0 || templatesCount > 0) {
      throw new Error('institution is used in cases or templates');
    }

    await postgres.query(
      `
      delete from institutions
      where id = $1
      `,
      [id]
    );

    return {
      id: existing.id,
      name: existing.name,
    };
  }
}

export const institutionsService = new InstitutionsService();
