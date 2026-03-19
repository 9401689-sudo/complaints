import 'fastify';
import { AuthUser } from './auth.service';

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: AuthUser;
  }
}
