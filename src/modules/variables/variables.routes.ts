import { FastifyInstance } from 'fastify';
import { env } from '../../config/env';
import { variablesService } from './variables.service';
import { UpdateCaseVariablesBody } from './variables.types';

export async function registerVariablesRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Params: { id: string } }>(
    `${env.API_BASE_PATH}/cases/:id/variables`,
    async (request, reply) => {
      try {
        const variables = await variablesService.getCaseVariables(request.params.id, request.authUser);

        return reply.send({
          ok: true,
          caseId: request.params.id,
          variables,
        });
      } catch (error) {
        request.log.error(error);

        const message = error instanceof Error ? error.message : 'internal error';
        const statusCode = message === 'case not found' ? 404 : 500;

        return reply.code(statusCode).send({
          ok: false,
          error: message,
        });
      }
    }
  );

  app.put<{ Params: { id: string }; Body: UpdateCaseVariablesBody }>(
    `${env.API_BASE_PATH}/cases/:id/variables`,
    async (request, reply) => {
      try {
        const variables = await variablesService.updateCaseVariables(
          request.params.id,
          request.body,
          request.authUser
        );

        return reply.send({
          ok: true,
          caseId: request.params.id,
          variables,
        });
      } catch (error) {
        request.log.error(error);

        const message = error instanceof Error ? error.message : 'internal error';

        const statusCode =
          message === 'case not found'
            ? 404
            : message === 'fsm not found'
              ? 404
              : message.startsWith('invalid fsm state')
                ? 409
            : message.includes('required') || message.includes('cannot be empty')
              ? 400
              : 500;

        return reply.code(statusCode).send({
          ok: false,
          error: message,
        });
      }
    }
  );
}
