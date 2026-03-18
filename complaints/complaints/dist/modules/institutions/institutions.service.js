"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.institutionsService = exports.InstitutionsService = void 0;
const postgres_1 = require("../db/postgres");
class InstitutionsService {
    async listInstitutions() {
        const result = await postgres_1.postgres.query(`
      select
        id,
        name,
        submit_url,
        max_attachments,
        max_text_length,
        accepted_formats,
        active,
        created_at
      from institutions
      order by created_at desc
      `);
        return result.rows;
    }
    async getInstitutionById(id) {
        const result = await postgres_1.postgres.query(`
      select
        id,
        name,
        submit_url,
        max_attachments,
        max_text_length,
        accepted_formats,
        active,
        created_at
      from institutions
      where id = $1
      limit 1
      `, [id]);
        return result.rows[0] ?? null;
    }
    async createInstitution(body) {
        const name = body.name?.trim();
        const submitUrl = body.submitUrl?.trim();
        if (!name) {
            throw new Error('name is required');
        }
        if (!submitUrl) {
            throw new Error('submitUrl is required');
        }
        const maxAttachments = body.maxAttachments ?? 5;
        const maxTextLength = body.maxTextLength ?? 4000;
        const acceptedFormats = body.acceptedFormats ?? ['image/jpeg', 'image/png'];
        const active = body.active ?? true;
        if (!Number.isInteger(maxAttachments) || maxAttachments <= 0) {
            throw new Error('maxAttachments must be a positive integer');
        }
        if (!Number.isInteger(maxTextLength) || maxTextLength <= 0) {
            throw new Error('maxTextLength must be a positive integer');
        }
        if (!Array.isArray(acceptedFormats) || acceptedFormats.length === 0) {
            throw new Error('acceptedFormats must be a non-empty array');
        }
        const result = await postgres_1.postgres.query(`
      insert into institutions (
        name,
        submit_url,
        max_attachments,
        max_text_length,
        accepted_formats,
        active
      )
      values ($1, $2, $3, $4, $5::jsonb, $6)
      returning
        id,
        name,
        submit_url,
        max_attachments,
        max_text_length,
        accepted_formats,
        active,
        created_at
      `, [
            name,
            submitUrl,
            maxAttachments,
            maxTextLength,
            JSON.stringify(acceptedFormats),
            active,
        ]);
        return result.rows[0];
    }
    async updateInstitution(id, body) {
        const existing = await this.getInstitutionById(id);
        if (!existing) {
            throw new Error('institution not found');
        }
        const name = body.name !== undefined ? body.name.trim() : existing.name;
        const submitUrl = body.submitUrl !== undefined ? body.submitUrl.trim() : existing.submit_url;
        const maxAttachments = body.maxAttachments !== undefined ? body.maxAttachments : existing.max_attachments;
        const maxTextLength = body.maxTextLength !== undefined ? body.maxTextLength : existing.max_text_length;
        const acceptedFormats = body.acceptedFormats !== undefined ? body.acceptedFormats : existing.accepted_formats;
        const active = body.active !== undefined ? body.active : existing.active;
        if (!name) {
            throw new Error('name is required');
        }
        if (!submitUrl) {
            throw new Error('submitUrl is required');
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
        const result = await postgres_1.postgres.query(`
      update institutions
      set
        name = $2,
        submit_url = $3,
        max_attachments = $4,
        max_text_length = $5,
        accepted_formats = $6::jsonb,
        active = $7
      where id = $1
      returning
        id,
        name,
        submit_url,
        max_attachments,
        max_text_length,
        accepted_formats,
        active,
        created_at
      `, [
            id,
            name,
            submitUrl,
            maxAttachments,
            maxTextLength,
            JSON.stringify(acceptedFormats),
            active,
        ]);
        return result.rows[0];
    }
    async deleteInstitution(id) {
        const existing = await this.getInstitutionById(id);
        if (!existing) {
            throw new Error('institution not found');
        }
        const casesResult = await postgres_1.postgres.query(`
      select count(*)::text as count
      from cases
      where institution_id = $1
      `, [id]);
        const templatesResult = await postgres_1.postgres.query(`
      select count(*)::text as count
      from templates
      where institution_id = $1
      `, [id]);
        const casesCount = Number(casesResult.rows[0]?.count ?? '0');
        const templatesCount = Number(templatesResult.rows[0]?.count ?? '0');
        if (casesCount > 0 || templatesCount > 0) {
            throw new Error('institution is used in cases or templates');
        }
        await postgres_1.postgres.query(`
      delete from institutions
      where id = $1
      `, [id]);
        return {
            id: existing.id,
            name: existing.name
        };
    }
}
exports.InstitutionsService = InstitutionsService;
exports.institutionsService = new InstitutionsService();
