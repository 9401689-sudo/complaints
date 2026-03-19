import { FastifyInstance } from 'fastify';
import { env } from '../../config/env';
import { filesService } from './files.service';
import { casesService } from '../cases/cases.service';
import { fsmService } from '../fsm/fsm.service';
import { UpdateCaseFilesBody } from './files.types';
import { UploadResultFilesBody } from './files.types';
import { nextcloudClient } from '../nextcloud/nextcloud.client';

export async function registerFilesRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Params: { id: string } }>(
    `${env.API_BASE_PATH}/cases/:id/sync-files`,
    async (request, reply) => {
      try {
        const result = await filesService.syncCaseFiles(request.params.id, request.authUser);

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

        const result = await filesService.updateSelectedFiles(caseId, request.body, request.authUser);
        const caseRow = await casesService.getCaseById(caseId, request.authUser);
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

  app.get<{ Params: { id: string } }>(
    `${env.API_BASE_PATH}/cases/:id/result-files`,
    async (request, reply) => {
      try {
        const files = await filesService.syncResultFiles(request.params.id, request.authUser);

        return reply.send({
          ok: true,
          files
        });
      } catch (error) {
        request.log.error(error);

        const message = error instanceof Error ? error.message : 'internal error';
        const statusCode =
          message === 'case not found'
            ? 404
            : message.startsWith('Nextcloud PROPFIND failed')
              ? 502
              : 500;

        return reply.code(statusCode).send({
          ok: false,
          error: message
        });
      }
    }
  );

  app.post<{ Params: { id: string }; Body: UploadResultFilesBody }>(
    `${env.API_BASE_PATH}/cases/:id/result-files/upload`,
    async (request, reply) => {
      try {
        const files = await filesService.uploadResultFiles(request.params.id, request.body, request.authUser);

        return reply.send({
          ok: true,
          files
        });
      } catch (error) {
        request.log.error(error);

        const message = error instanceof Error ? error.message : 'internal error';
        const statusCode =
          message === 'case not found'
            ? 404
            : message.includes('required')
              ? 400
              : message.startsWith('Nextcloud PUT failed')
                ? 502
                : 500;

        return reply.code(statusCode).send({
          ok: false,
          error: message
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

        const file = await filesService.getCaseFileById(caseId, fileId, request.authUser);

        if (!file) {
          return reply.code(404).send({
            ok: false,
            error: 'file not found',
          });
        }

        const mimeType = file.mime_type || 'application/octet-stream';

        if (
          ![
            'image/jpeg',
            'image/png',
            'image/webp',
            'video/mp4',
            'video/webm',
            'video/quicktime',
            'application/pdf'
          ].includes(mimeType)
        ) {
          return reply.code(400).send({
            ok: false,
            error: 'preview is supported only for image, video and pdf files',
          });
        }

        const buffer = await nextcloudClient.downloadBinaryFile(file.file_path);

        reply.header('Content-Type', mimeType);
        reply.header('Content-Disposition', 'inline');
        reply.header('Cache-Control', 'private, max-age=60');
        return reply.send(buffer);
      } catch (error) {
        request.log.error(error);

        const message = error instanceof Error ? error.message : 'internal error';

        const statusCode =
          message === 'file not found'
            ? 404
            : message === 'case not found'
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

  app.get<{ Params: { id: string; fileId: string } }>(
    `${env.API_BASE_PATH}/cases/:id/files/:fileId/download`,
    async (request, reply) => {
      try {
        const caseId = request.params.id;
        const fileId = request.params.fileId;

        const file = await filesService.getCaseFileById(caseId, fileId, request.authUser);

        if (!file) {
          return reply.code(404).send({
            ok: false,
            error: 'file not found',
          });
        }

        const buffer = await nextcloudClient.downloadBinaryFile(file.file_path);
        const mimeType = file.mime_type || 'application/octet-stream';
        const encodedFilename = encodeURIComponent(file.file_name || 'download.bin');

        reply.header('Content-Type', mimeType);
        reply.header('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
        reply.header('Cache-Control', 'private, max-age=60');
        return reply.send(buffer);
      } catch (error) {
        request.log.error(error);

        const message = error instanceof Error ? error.message : 'internal error';

        const statusCode =
          message === 'file not found'
            ? 404
            : message === 'case not found'
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
