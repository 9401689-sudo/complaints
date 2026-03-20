import { FastifyInstance } from 'fastify';
import { authService } from './auth.service';
import { env } from '../../config/env';
import { extractBearerToken, requireAuthUser, ensureRole, sendAuthError } from './auth.utils';
import { casesService } from '../cases/cases.service';
import { institutionsService } from '../institutions/institutions.service';
import { templatesService } from '../templates/templates.service';
import { redis } from '../redis/redis';
import { adminBackupsService } from '../admin/admin-backups.service';

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: { nickname?: string; password?: string } }>(`${env.API_BASE_PATH}/auth/register`, async (request, reply) => {
    try {
      const payload = await authService.register(request.body || {});
      return reply.code(201).send({ ok: true, ...payload });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'internal error';
      const statusCode = message === 'nickname already exists' || message.includes('nickname') || message.includes('password') ? 400 : 500;
      return reply.code(statusCode).send({ ok: false, error: message });
    }
  });

  app.post<{ Body: { nickname?: string; password?: string } }>(`${env.API_BASE_PATH}/auth/login`, async (request, reply) => {
    try {
      const payload = await authService.login(request.body || {});
      return reply.send({ ok: true, ...payload });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'internal error';
      const statusCode = message === 'invalid credentials' || message.includes('nickname') || message.includes('password') ? 401 : 500;
      return reply.code(statusCode).send({ ok: false, error: message });
    }
  });

  app.get(`${env.API_BASE_PATH}/auth/me`, async (request, reply) => {
    try {
      const user = requireAuthUser(request);
      return reply.send({ ok: true, user });
    } catch (error) {
      return sendAuthError(reply, error);
    }
  });

  app.post(`${env.API_BASE_PATH}/auth/logout`, async (request, reply) => {
    try {
      const token = extractBearerToken(request);
      if (token) {
        await authService.logout(token);
      }
      return reply.send({ ok: true });
    } catch (error) {
      return sendAuthError(reply, error);
    }
  });

  app.get(`${env.API_BASE_PATH}/auth/users`, async (request, reply) => {
    try {
      const user = requireAuthUser(request);
      ensureRole(user, ['admin_view', 'admin_full']);
      const users = await authService.listUsers();
      return reply.send({ ok: true, users });
    } catch (error) {
      return sendAuthError(reply, error);
    }
  });

  app.patch<{ Params: { id: string }; Body: { role?: string } }>(`${env.API_BASE_PATH}/auth/users/:id/role`, async (request, reply) => {
    try {
      const user = requireAuthUser(request);
      ensureRole(user, ['admin_full']);
      const updated = await authService.setUserRole(request.params.id, request.body?.role || '');
      return reply.send({ ok: true, user: updated });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'internal error';
      if (message === 'user not found') {
        return reply.code(404).send({ ok: false, error: message });
      }
      return sendAuthError(reply, error);
    }
  });

  app.delete<{ Params: { id: string } }>(`${env.API_BASE_PATH}/auth/users/:id`, async (request, reply) => {
    try {
      const user = requireAuthUser(request);
      ensureRole(user, ['admin_full']);
      const deleted = await authService.deleteUser(request.params.id, user.id);
      return reply.send({ ok: true, user: deleted });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'internal error';
      const statusCode =
        message === 'user not found'
          ? 404
          : message === 'cannot delete self' || message === 'user has related entities'
            ? 400
            : 500;
      return reply.code(statusCode).send({ ok: false, error: message });
    }
  });

  app.post(`${env.API_BASE_PATH}/admin/purge-deleted`, async (request, reply) => {
    try {
      const user = requireAuthUser(request);
      ensureRole(user, ['admin_full']);

      const purgedCases = await casesService.purgeDeletedCases();
      if (purgedCases.ids.length) {
        await Promise.all(
          purgedCases.ids.map((id) => redis.del(`complaints:case:${id}:fsm`))
        );
      }
      const purgedInstitutions = await institutionsService.purgeDeletedInstitutions();
      const purgedTemplates = await templatesService.purgeDeletedTemplates();

      return reply.send({
        ok: true,
        result: {
          cases: purgedCases.count,
          institutions: purgedInstitutions.count,
          templates: purgedTemplates.count
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'internal error';
      const statusCode = message === 'forbidden' ? 403 : 500;
      return reply.code(statusCode).send({ ok: false, error: message });
    }
  });

  app.get(`${env.API_BASE_PATH}/admin/deleted`, async (request, reply) => {
    try {
      const user = requireAuthUser(request);
      ensureRole(user, ['admin_view', 'admin_full']);

      const [cases, institutions, templates] = await Promise.all([
        casesService.listDeletedCases(),
        institutionsService.listDeletedInstitutions(),
        templatesService.listDeletedTemplates()
      ]);

      return reply.send({
        ok: true,
        cases,
        institutions,
        templates
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'internal error';
      const statusCode = message === 'forbidden' ? 403 : 500;
      return reply.code(statusCode).send({ ok: false, error: message });
    }
  });

  app.post<{ Params: { id: string } }>(`${env.API_BASE_PATH}/admin/deleted/cases/:id/restore`, async (request, reply) => {
    try {
      const user = requireAuthUser(request);
      ensureRole(user, ['admin_full']);
      const restored = await casesService.restoreDeletedCase(request.params.id);
      return reply.send({ ok: true, case: restored });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'internal error';
      const statusCode = message === 'case not found' ? 404 : message === 'forbidden' ? 403 : 500;
      return reply.code(statusCode).send({ ok: false, error: message });
    }
  });

  app.post<{ Params: { id: string } }>(`${env.API_BASE_PATH}/admin/deleted/institutions/:id/restore`, async (request, reply) => {
    try {
      const user = requireAuthUser(request);
      ensureRole(user, ['admin_full']);
      const restored = await institutionsService.restoreDeletedInstitution(request.params.id);
      return reply.send({ ok: true, institution: restored });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'internal error';
      const statusCode = message === 'institution not found' ? 404 : message === 'forbidden' ? 403 : 500;
      return reply.code(statusCode).send({ ok: false, error: message });
    }
  });

  app.post<{ Params: { id: string } }>(`${env.API_BASE_PATH}/admin/deleted/templates/:id/restore`, async (request, reply) => {
    try {
      const user = requireAuthUser(request);
      ensureRole(user, ['admin_full']);
      const restored = await templatesService.restoreDeletedTemplate(request.params.id);
      return reply.send({ ok: true, template: restored });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'internal error';
      const statusCode = message === 'template not found' ? 404 : message === 'forbidden' ? 403 : 500;
      return reply.code(statusCode).send({ ok: false, error: message });
    }
  });

  app.get(`${env.API_BASE_PATH}/admin/backups`, async (request, reply) => {
    try {
      const user = requireAuthUser(request);
      ensureRole(user, ['admin_view', 'admin_full']);
      const backups = await adminBackupsService.listBackups();
      return reply.send({ ok: true, backups });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'internal error';
      const statusCode = message === 'forbidden' ? 403 : 500;
      return reply.code(statusCode).send({ ok: false, error: message });
    }
  });

  app.post(`${env.API_BASE_PATH}/admin/backups`, async (request, reply) => {
    try {
      const user = requireAuthUser(request);
      ensureRole(user, ['admin_full']);
      const backup = await adminBackupsService.createBackup();
      return reply.send({ ok: true, backup });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'internal error';
      const statusCode = message === 'forbidden' ? 403 : 500;
      return reply.code(statusCode).send({ ok: false, error: message });
    }
  });

  app.post<{ Body: { fileName?: string } }>(`${env.API_BASE_PATH}/admin/backups/restore`, async (request, reply) => {
    try {
      const user = requireAuthUser(request);
      ensureRole(user, ['admin_full']);
      const fileName = String(request.body?.fileName || '').trim();
      if (!fileName) {
        return reply.code(400).send({ ok: false, error: 'fileName is required' });
      }
      const backup = await adminBackupsService.restoreBackup(fileName);
      return reply.send({ ok: true, backup });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'internal error';
      const statusCode =
        message === 'forbidden'
          ? 403
          : message === 'backup not found'
            ? 404
            : 500;
      return reply.code(statusCode).send({ ok: false, error: message });
    }
  });

  app.delete<{ Body: { fileName?: string } }>(`${env.API_BASE_PATH}/admin/backups`, async (request, reply) => {
    try {
      const user = requireAuthUser(request);
      ensureRole(user, ['admin_full']);
      const fileName = String(request.body?.fileName || '').trim();
      if (!fileName) {
        return reply.code(400).send({ ok: false, error: 'fileName is required' });
      }
      const backup = await adminBackupsService.deleteBackup(fileName);
      return reply.send({ ok: true, backup });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'internal error';
      const statusCode =
        message === 'forbidden'
          ? 403
          : message === 'backup not found'
            ? 404
            : 500;
      return reply.code(statusCode).send({ ok: false, error: message });
    }
  });
}
