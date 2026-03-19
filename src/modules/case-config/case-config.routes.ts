import { FastifyInstance } from 'fastify';
import { env } from '../../config/env';
import { caseConfigService } from './case-config.service';
import { UpdateCaseConfigBody } from './case-config.types';

export async function registerCaseConfigRoutes(app: FastifyInstance): Promise<void> {
  app.patch<{ Params: { id: string }; Body: UpdateCaseConfigBody }>(
    `${env.API_BASE_PATH}/cases/:id/config`,
    async (request, reply) => {
      try {
        const updatedCase = await caseConfigService.updateCaseConfig(
          request.params.id,
          request.body,
          request.authUser
        );

        return reply.send({
          ok: true,
          case: updatedCase,
        });
      } catch (error) {
        request.log.error(error);

        const message = error instanceof Error ? error.message : 'internal error';

        const statusCode =
          message === 'case not found'
            ? 404
            : message === 'institution not found'
              ? 404
              : message === 'template not found'
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
