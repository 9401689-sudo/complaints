import { FastifyInstance } from 'fastify';
import { env } from '../../config/env';
import { filesService } from './files.service';
import { casesService } from '../cases/cases.service';
import { fsmService } from '../fsm/fsm.service';
import { UpdateCaseFilesBody } from './files.types';
import { nextcloudClient } from '../nextcloud/nextcloud.client';

export async function registerFilesRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Params: { id: string } }>(
    `${env.API_BASE_PATH}/cases/:id/sync-files`,
    async (request, reply) => {
      try {
        const result = await filesService.syncCaseFiles(request.params.id);

        return reply.send({
          ok: true,
          case: result.case,
          files: result.files,
          fsm: result.fsm,
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
                : 500;

        return reply.code(statusCode).send({
          ok: false,
          error: message,
        });
      }
    }
  );

  app.patch<{ Params: { id: string }; Body: UpdateCaseFilesBody }>(
    `${env.API_BASE_PATH}/cases/:id/files`,
    async (request, reply) => {
      try {
        const caseId = request.params.id;

        const result = await filesService.updateSelectedFiles(caseId, request.body);
        const caseRow = await casesService.getCaseById(caseId);
        const fsm = await fsmService.getSnapshot(caseId);

        return reply.send({
          ok: true,
          case: caseRow,
          files: result.files,
          fsm,
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
                : message.includes('required') ||
                    message.includes('invalid') ||
                    message.includes('does not belong')
                  ? 400
                  : 500;

        return reply.code(statusCode).send({
          ok: false,
          error: message,
        });
      }
    }
  );
  app.get<{ Params: { id: string; fileId: string } }>(
    `${env.API_BASE_PATH}/cases/:id/files/:fileId/preview`,
    async (request, reply) => {
      try {
        const caseId = request.params.id;
        const fileId = request.params.fileId;

        const file = await filesService.getCaseFileById(caseId, fileId);

        if (!file) {
          return reply.code(404).send({
            ok: false,
            error: 'file not found',
          });
        }

        const mimeType = file.mime_type || 'application/octet-stream';

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
          return reply.code(400).send({
            ok: false,
            error: 'preview is supported only for images',
          });
        }

        const buffer = await nextcloudClient.downloadBinaryFile(file.file_path);

        reply.header('Content-Type', mimeType);
        reply.header('Cache-Control', 'private, max-age=60');
        return reply.send(buffer);
      } catch (error) {
        request.log.error(error);

        const message = error instanceof Error ? error.message : 'internal error';

        const statusCode =
          message === 'file not found'
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

  app.get(`${env.API_BASE_PATH}/files/ping`, async () => {
    return { ok: true, module: 'files' };
  });
}
