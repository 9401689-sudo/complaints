import { FastifyInstance } from 'fastify';
import { env } from '../../config/env';
import { packageService } from './package.service';

export async function registerPackageRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Params: { id: string } }>(
    `${env.API_BASE_PATH}/cases/:id/package`,
    async (request, reply) => {
      try {
        const result = await packageService.getCasePackage(request.params.id);

        return reply.send({
          ok: true,
          caseId: result.caseId,
          filePath: result.filePath,
          package: result.packagePayload,
        });
      } catch (error) {
        request.log.error(error);

        const message = error instanceof Error ? error.message : 'internal error';

        const statusCode =
          message === 'case not found'
            ? 404
            : message.startsWith('Nextcloud GET failed')
              ? 404
              : 500;

        return reply.code(statusCode).send({
          ok: false,
          error: message,
        });
      }
    }
  );
}
