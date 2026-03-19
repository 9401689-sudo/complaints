import { FastifyInstance } from 'fastify';
import { env } from '../../config/env';
import { institutionsService } from './institutions.service';
import {
  CreateInstitutionBody,
  UpdateInstitutionBody,
} from './institutions.types';

export async function registerInstitutionsRoutes(app: FastifyInstance): Promise<void> {
  app.get(`${env.API_BASE_PATH}/institutions`, async (request, reply) => {
    try {
      const institutions = await institutionsService.listInstitutions();

      return reply.send({
        ok: true,
        institutions,
      });
    } catch (error) {
      request.log.error(error);

      return reply.code(500).send({
        ok: false,
        error: 'internal error',
      });
    }
  });

  app.get<{ Params: { id: string } }>(
    `${env.API_BASE_PATH}/institutions/:id`,
    async (request, reply) => {
      try {
        const institution = await institutionsService.getInstitutionById(
          request.params.id
        );

        if (!institution) {
          return reply.code(404).send({
            ok: false,
            error: 'institution not found',
          });
        }

        return reply.send({
          ok: true,
          institution,
        });
      } catch (error) {
        request.log.error(error);

        return reply.code(500).send({
          ok: false,
          error: 'internal error',
        });
      }
    }
  );

  app.delete<{ Params: { id: string } }>(
    `${env.API_BASE_PATH}/institutions/:id`,
    async (request, reply) => {
      try {
        const deleted = await institutionsService.deleteInstitution(request.params.id);

        return reply.send({
          ok: true,
          deleted,
        });
      } catch (error) {
        request.log.error(error);

        const message = error instanceof Error ? error.message : 'internal error';

        const statusCode =
          message === 'institution not found'
            ? 404
            : message === 'institution is used in cases or templates'
              ? 409
              : 500;

        return reply.code(statusCode).send({
          ok: false,
          error: message,
        });
      }
    }
  );

  app.post<{ Body: CreateInstitutionBody }>(
    `${env.API_BASE_PATH}/institutions`,
    async (request, reply) => {
      try {
        const institution = await institutionsService.createInstitution(request.body);

        return reply.code(201).send({
          ok: true,
          institution,
        });
      } catch (error) {
        request.log.error(error);

        const message = error instanceof Error ? error.message : 'internal error';
        const statusCode =
          message.includes('required') || message.includes('must be') ? 400 : 500;

        return reply.code(statusCode).send({
          ok: false,
          error: message,
        });
      }
    }
  );

  app.patch<{ Params: { id: string }; Body: UpdateInstitutionBody }>(
    `${env.API_BASE_PATH}/institutions/:id`,
    async (request, reply) => {
      try {
        const institution = await institutionsService.updateInstitution(
          request.params.id,
          request.body
        );

        return reply.send({
          ok: true,
          institution,
        });
      } catch (error) {
        request.log.error(error);

        const message = error instanceof Error ? error.message : 'internal error';

        const statusCode =
          message === 'institution not found'
            ? 404
            : message.includes('required') || message.includes('must be')
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
