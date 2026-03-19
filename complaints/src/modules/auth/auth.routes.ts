import { FastifyInstance } from 'fastify';
import { authService } from './auth.service';
import { env } from '../../config/env';
import { extractBearerToken, requireAuthUser, ensureRole, sendAuthError } from './auth.utils';

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
}
