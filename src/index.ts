import Fastify from 'fastify';
import cors from '@fastify/cors';
import formbody from '@fastify/formbody';

import { env } from './config/env';
import { registerCasesRoutes } from './modules/cases/cases.routes';
import { registerFilesRoutes } from './modules/files/files.routes';
import { checkPostgresHealth } from './modules/db/postgres.health';
import { redis } from './modules/redis/redis';
import { registerInstitutionsRoutes } from './modules/institutions/institutions.routes';
import { registerTemplatesRoutes } from './modules/templates/templates.routes';
import { registerVariablesRoutes } from './modules/variables/variables.routes';
import { registerTextRoutes } from './modules/text/text.routes';
import { registerCaseConfigRoutes } from './modules/case-config/case-config.routes';
import { registerPackageRoutes } from './modules/package/package.routes';
import { registerAuthRoutes } from './modules/auth/auth.routes';
import { authService } from './modules/auth/auth.service';
import { extractBearerToken } from './modules/auth/auth.utils';

async function bootstrap(): Promise<void> {
  const app = Fastify({
    logger: true
  });

  await app.register(cors, {
    origin: true
  });

  await app.register(formbody);

  app.get('/health', async () => {
    return { ok: true };
  });

  app.get(`${env.API_BASE_PATH}/health`, async () => {
    return {
      ok: true,
      apiBasePath: env.API_BASE_PATH,
      basePublicUrl: env.BASE_PUBLIC_URL
    };
  });

  app.get(`${env.API_BASE_PATH}/health/db`, async () => {
    return checkPostgresHealth();
  });

  await registerAuthRoutes(app);

  app.addHook('onRequest', async (request, reply) => {
    const path = request.raw.url?.split('?')[0] || '';
    const isGetRequest = request.method === 'GET';
    const publicPaths = new Set([
      '/health',
      `${env.API_BASE_PATH}/health`,
      `${env.API_BASE_PATH}/health/db`,
      `${env.API_BASE_PATH}/auth/register`,
      `${env.API_BASE_PATH}/auth/login`
    ]);
    const publicGetPrefixes = [
      `${env.API_BASE_PATH}/cases`,
      `${env.API_BASE_PATH}/institutions`,
      `${env.API_BASE_PATH}/templates`
    ];
    const isPublicGetRoute =
      isGetRequest &&
      publicGetPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

    if (request.method === 'OPTIONS' || publicPaths.has(path) || isPublicGetRoute) {
      return;
    }

    const token = extractBearerToken(request);

    if (!token) {
      return reply.code(401).send({ ok: false, error: 'unauthorized' });
    }

    const user = await authService.getUserByToken(token);

    if (!user) {
      return reply.code(401).send({ ok: false, error: 'unauthorized' });
    }

    request.authUser = user;
  });

  await registerCasesRoutes(app);
  await registerFilesRoutes(app);
  await registerInstitutionsRoutes(app);
  await registerTemplatesRoutes(app);
  await registerVariablesRoutes(app);
  await registerTextRoutes(app);
  await registerCaseConfigRoutes(app);
  await registerPackageRoutes(app);

  console.log(app.printRoutes());

  redis.on('error', (err) => {
    app.log.error({ err }, 'Redis error');
  });

  await app.listen({
    port: env.PORT,
    host: '0.0.0.0'
  });

  app.log.info(`Server started on port ${env.PORT}`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});

