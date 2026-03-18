import { FastifyRequest, FastifyReply } from 'fastify';
import { FastifyInstance } from 'fastify';
import { env } from '../../config/env';
import { casesService } from './cases.service';
import { redis } from '../redis/redis';

export async function registerCasesRoutes(app: FastifyInstance): Promise<void> {
  app.get(`${env.API_BASE_PATH}/cases`, async (_request, reply) => {
    try {
      const cases = await casesService.listCases();

      return reply.send({
        ok: true,
        cases
      });
    } catch (error) {
      return requestError(reply, error);
    }
  });

  app.post<{ Body: { parentCaseId?: string | null } }>(`${env.API_BASE_PATH}/cases`, async (request, reply) => {
    try {
      const payload = await casesService.createCase(request.body);
      return reply.code(201).send(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return requestError(reply, error, message === 'parent case not found' ? 404 : 500);
    }
  });

  app.get<{ Params: { id: string } }>(`${env.API_BASE_PATH}/cases/:id`, async (request, reply) => {
    try {
      const payload = await casesService.getCase(request.params.id);
      return reply.send(payload);
    } catch (error) {
      return requestError(reply, error, 404);
    }
  });

  app.patch<{
    Params: { id: string };
    Body: {
      title?: string | null;
      description?: string | null;
      caseDate?: string | null;
      registrationDate?: string | null;
      submissionNumber?: string | null;
    };
  }>(
    `${env.API_BASE_PATH}/cases/:id/meta`,
    async (request, reply) => {
      try {
        const updated = await casesService.updateCaseMeta(request.params.id, request.body);

        return reply.send({
          ok: true,
          case: updated
        });
      } catch (error) {
        return requestError(reply, error, 404);
      }
    }
  );

  app.post<{ Params: { id: string } }>(
    `${env.API_BASE_PATH}/cases/:id/generate-text`,
    async (request, reply) => {
      try {
        const payload = await casesService.generateText(request.params.id);
        return reply.send({
          ok: true,
          case: payload.case,
          text: payload.text,
          artifactPath: payload.artifactPath,
          checksum: payload.checksum,
          fsm: payload.fsm
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';

        const statusCode =
          message === 'case not found'
            ? 404
            : message === 'fsm not found'
            ? 404
            : message === 'template not found'
            ? 404
            : message === 'template is not selected'
            ? 400
            : message === 'generated text is empty'
            ? 400
            : message.startsWith('invalid fsm state')
            ? 409
            : 500;

        return requestError(reply, error, statusCode);
      }
    }
  );

  app.post<{ Params: { id: string } }>(
    `${env.API_BASE_PATH}/cases/:id/save-as-template`,
    async (request, reply) => {
      try {
        const template = await casesService.saveCaseTextAsTemplate(request.params.id);

        return reply.send({
          ok: true,
          template
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';

        const statusCode =
          message === 'case not found'
            ? 404
            : message === 'fsm not found'
            ? 404
            : message === 'case text is empty'
            ? 400
            : message.startsWith('invalid fsm state')
            ? 409
            : message.startsWith('Nextcloud GET failed')
            ? 404
            : 500;

        return requestError(reply, error, statusCode);
      }
    }
  );

app.post<{ Params: { id: string } }>(
  `${env.API_BASE_PATH}/cases/:id/build-package`,
  async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      // Теперь request.params.id точно будет строкой
      const payload = await casesService.buildPackage(request.params.id);
      return reply.send({
        ok: true,
        case: payload.case,
        artifactPath: payload.artifactPath,
        checksum: payload.checksum,
        package: payload.packagePayload,
        fsm: payload.fsm
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const statusCode = message === 'case not found'
        ? 404
        : message === 'fsm not found'
          ? 404
          : message === 'generated text artifact not found'
            ? 404
            : message === 'no files selected'
              ? 400
              : message.startsWith('invalid fsm state')
                ? 409
                : 500;

      return requestError(reply, error, statusCode);
    }
  }
);

  app.post<{ Params: { id: string } }>(
    `${env.API_BASE_PATH}/cases/:id/submit-prepare`,
    async (request, reply) => {
      try {
        const payload = await casesService.prepareSubmit(request.params.id);

        return reply.send({
          ok: true,
          case: payload.case,
          text: payload.text,
          submitUrl: payload.submitUrl,
          files: payload.files,
          fsm: payload.fsm
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        const statusCode =
          message === 'case not found'
            ? 404
            : message === 'fsm not found'
              ? 404
              : message === 'institution not found'
                ? 404
                : message === 'generated text artifact not found'
                  ? 404
                  : message === 'no files selected'
                    ? 400
                    : message.startsWith('invalid fsm state')
                      ? 409
                      : message.startsWith('Nextcloud MOVE failed')
                        ? 502
                        : message.startsWith('Nextcloud GET failed')
                          ? 404
                          : 500;

        return requestError(reply, error, statusCode);
      }
    }
  );

  app.delete<{ Params: { id: string } }>(`${env.API_BASE_PATH}/cases/:id`, async (request, reply) => {
    try {
      const deleted = await casesService.deleteCase(request.params.id);

      await redis.del(`complaints:case:${request.params.id}:fsm`);

      return reply.send({
        ok: true,
        deleted
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const statusCode =
        message === 'case not found'
          ? 404
          : message.startsWith('Nextcloud DELETE failed')
            ? 502
            : 500;

      return requestError(reply, error, statusCode);
    }
  });

  app.get(`${env.API_BASE_PATH}/cases/ping`, async () => {
    return { ok: true, module: 'cases' };
  });
}

function requestError(
  reply: { code: (n: number) => { send: (payload: unknown) => unknown } },
  error: unknown,
  code = 500
) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  return reply.code(code).send({
    ok: false,
    error: message
  });
}
