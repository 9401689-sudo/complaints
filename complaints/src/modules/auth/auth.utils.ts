import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthUser, UserRole } from './auth.service';

export function extractBearerToken(request: FastifyRequest): string | null {
  const authorization = request.headers.authorization;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return null;
  }

  return authorization.slice('Bearer '.length).trim() || null;
}

export function requireAuthUser(request: FastifyRequest): AuthUser {
  if (!request.authUser) {
    throw new Error('unauthorized');
  }

  return request.authUser;
}

export function ensureRole(user: AuthUser, allowedRoles: UserRole[]): void {
  if (!allowedRoles.includes(user.role)) {
    throw new Error('forbidden');
  }
}

export function sendAuthError(reply: FastifyReply, error: unknown) {
  const message = error instanceof Error ? error.message : 'unauthorized';
  const code = message === 'forbidden' ? 403 : 401;

  return reply.code(code).send({
    ok: false,
    error: message
  });
}
