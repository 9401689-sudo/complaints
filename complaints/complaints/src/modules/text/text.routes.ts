import { FastifyInstance } from 'fastify';
import { env } from '../../config/env';
import { textService } from './text.service';
import { UpdateCaseTextBody } from './text.types';

export async function registerTextRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Params: { id: string } }>(
    `${env.API_BASE_PATH}/cases/:id/text`,
    async (request, reply) => {
      try {
        const result = await textService.getCaseText(request.params.id);

        return reply.send({
          ok: true,
          caseId: result.caseId,
          filePath: result.filePath,
          content: result.content,
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

  app.put<{ Params: { id: string }; Body: UpdateCaseTextBody }>(
    `${env.API_BASE_PATH}/cases/:id/text`,
    async (request, reply) => {
      try {
        const result = await textService.saveCaseText(request.params.id, request.body);

        return reply.send({
          ok: true,
          caseId: result.caseId,
          filePath: result.filePath,
          content: result.content,
        });
      } catch (error) {
        request.log.error(error);

        const message = error instanceof Error ? error.message : 'internal error';

        const statusCode =
          message === 'case not found'
            ? 404
            : message === 'fsm not found'
              ? 404
              : message.includes('required')
                ? 400
                : message.startsWith('invalid fsm state')
                  ? 409
                  : 500;

        return reply.code(statusCode).send({
          ok: false,
          error: message,
        });
      }
    }
  );
}
