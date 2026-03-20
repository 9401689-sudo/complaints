import { FastifyInstance } from 'fastify';
import { env } from '../../config/env';
import { templatesService } from './templates.service';
import {
  CreateTemplateBody,
  UpdateTemplateBody,
} from './templates.types';

export async function registerTemplatesRoutes(app: FastifyInstance): Promise<void> {
  app.get(`${env.API_BASE_PATH}/templates`, async (request, reply) => {
    try {
      const templates = await templatesService.listTemplates(request.authUser);

      return reply.send({
        ok: true,
        templates,
      });
    } catch (error) {
      request.log.error(error);

      return reply.code(500).send({
        ok: false,
        error: 'internal error',
      });
    }
  });

  app.delete<{ Params: { id: string } }>(
    `${env.API_BASE_PATH}/templates/:id`,
    async (request, reply) => {
      try {
        const deleted = await templatesService.deleteTemplate(request.params.id, request.authUser);

        return reply.send({
          ok: true,
          deleted,
        });
      } catch (error) {
        request.log.error(error);

        const message = error instanceof Error ? error.message : 'internal error';

        const statusCode =
          message === 'template not found'
            ? 404
            : message === 'template access denied'
              ? 403
            : message === 'template is used in cases'
              ? 409
              : 500;

        return reply.code(statusCode).send({
          ok: false,
          error: message,
        });
      }
    }
  );

  app.get<{ Params: { id: string } }>(
    `${env.API_BASE_PATH}/templates/:id`,
    async (request, reply) => {
      try {
        const template = await templatesService.getTemplateById(request.params.id, request.authUser);

        if (!template) {
          return reply.code(404).send({
            ok: false,
            error: 'template not found',
          });
        }

        return reply.send({
          ok: true,
          template,
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

  app.post<{ Body: CreateTemplateBody }>(
    `${env.API_BASE_PATH}/templates`,
    async (request, reply) => {
      try {
        const template = await templatesService.createTemplate(request.body, request.authUser);

        return reply.code(201).send({
          ok: true,
          template,
        });
      } catch (error) {
        request.log.error(error);

        const message = error instanceof Error ? error.message : 'internal error';
        const statusCode =
          message.includes('required') ||
          message.includes('must be') ||
          message.includes('visibility is invalid')
            ? 400
            : 500;

        return reply.code(statusCode).send({
          ok: false,
          error: message,
        });
      }
    }
  );

  app.patch<{ Params: { id: string }; Body: UpdateTemplateBody }>(
    `${env.API_BASE_PATH}/templates/:id`,
    async (request, reply) => {
      try {
        const template = await templatesService.updateTemplate(
          request.params.id,
          request.body,
          request.authUser
        );

        return reply.send({
          ok: true,
          template,
        });
      } catch (error) {
        request.log.error(error);

        const message = error instanceof Error ? error.message : 'internal error';

        const statusCode =
          message === 'template not found'
            ? 404
            : message === 'template access denied'
              ? 403
            : message.includes('required') || message.includes('must be') || message.includes('visibility is invalid')
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
