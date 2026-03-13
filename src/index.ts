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
