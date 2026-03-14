"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFilesRoutes = registerFilesRoutes;
const env_1 = require("../../config/env");
const files_service_1 = require("./files.service");
const cases_service_1 = require("../cases/cases.service");
const fsm_service_1 = require("../fsm/fsm.service");
const nextcloud_client_1 = require("../nextcloud/nextcloud.client");
async function registerFilesRoutes(app) {
    app.post(`${env_1.env.API_BASE_PATH}/cases/:id/sync-files`, async (request, reply) => {
        try {
            const result = await files_service_1.filesService.syncCaseFiles(request.params.id);
            return reply.send({
                ok: true,
                case: result.case,
                files: result.files,
                fsm: result.fsm,
            });
        }
        catch (error) {
            request.log.error(error);
            const message = error instanceof Error ? error.message : 'internal error';
            const statusCode = message === 'case not found'
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
    });
    app.patch(`${env_1.env.API_BASE_PATH}/cases/:id/files`, async (request, reply) => {
        try {
            const caseId = request.params.id;
            const result = await files_service_1.filesService.updateSelectedFiles(caseId, request.body);
            const caseRow = await cases_service_1.casesService.getCaseById(caseId);
            const fsm = await fsm_service_1.fsmService.getSnapshot(caseId);
            return reply.send({
                ok: true,
                case: caseRow,
                files: result.files,
                fsm,
            });
        }
        catch (error) {
            request.log.error(error);
            const message = error instanceof Error ? error.message : 'internal error';
            const statusCode = message === 'case not found'
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
    });
    app.get(`${env_1.env.API_BASE_PATH}/cases/:id/result-files`, async (request, reply) => {
        try {
            const files = await files_service_1.filesService.syncResultFiles(request.params.id);
            return reply.send({
                ok: true,
                files
            });
        }
        catch (error) {
            request.log.error(error);
            const message = error instanceof Error ? error.message : 'internal error';
            const statusCode = message === 'case not found'
                ? 404
                : message.startsWith('Nextcloud PROPFIND failed')
                    ? 502
                    : 500;
            return reply.code(statusCode).send({
                ok: false,
                error: message
            });
        }
    });
    app.get(`${env_1.env.API_BASE_PATH}/cases/:id/files/:fileId/preview`, async (request, reply) => {
        try {
            const caseId = request.params.id;
            const fileId = request.params.fileId;
            const file = await files_service_1.filesService.getCaseFileById(caseId, fileId);
            if (!file) {
                return reply.code(404).send({
                    ok: false,
                    error: 'file not found',
                });
            }
            const mimeType = file.mime_type || 'application/octet-stream';
            if (![
                'image/jpeg',
                'image/png',
                'image/webp',
                'video/mp4',
                'video/webm',
                'video/quicktime',
                'application/pdf'
            ].includes(mimeType)) {
                return reply.code(400).send({
                    ok: false,
                    error: 'preview is supported only for image, video and pdf files',
                });
            }
            const buffer = await nextcloud_client_1.nextcloudClient.downloadBinaryFile(file.file_path);
            reply.header('Content-Type', mimeType);
            reply.header('Content-Disposition', 'inline');
            reply.header('Cache-Control', 'private, max-age=60');
            return reply.send(buffer);
        }
        catch (error) {
            request.log.error(error);
            const message = error instanceof Error ? error.message : 'internal error';
            const statusCode = message === 'file not found'
                ? 404
                : message.startsWith('Nextcloud GET failed')
                    ? 404
                    : 500;
            return reply.code(statusCode).send({
                ok: false,
                error: message,
            });
        }
    });
    app.get(`${env_1.env.API_BASE_PATH}/cases/:id/files/:fileId/download`, async (request, reply) => {
        try {
            const caseId = request.params.id;
            const fileId = request.params.fileId;
            const file = await files_service_1.filesService.getCaseFileById(caseId, fileId);
            if (!file) {
                return reply.code(404).send({
                    ok: false,
                    error: 'file not found',
                });
            }
            const buffer = await nextcloud_client_1.nextcloudClient.downloadBinaryFile(file.file_path);
            const mimeType = file.mime_type || 'application/octet-stream';
            const encodedFilename = encodeURIComponent(file.file_name || 'download.bin');
            reply.header('Content-Type', mimeType);
            reply.header('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
            reply.header('Cache-Control', 'private, max-age=60');
            return reply.send(buffer);
        }
        catch (error) {
            request.log.error(error);
            const message = error instanceof Error ? error.message : 'internal error';
            const statusCode = message === 'file not found'
                ? 404
                : message.startsWith('Nextcloud GET failed')
                    ? 404
                    : 500;
            return reply.code(statusCode).send({
                ok: false,
                error: message,
            });
        }
    });
    app.get(`${env_1.env.API_BASE_PATH}/files/ping`, async () => {
        return { ok: true, module: 'files' };
    });
}
