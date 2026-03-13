"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTextRoutes = registerTextRoutes;
const env_1 = require("../../config/env");
const text_service_1 = require("./text.service");
async function registerTextRoutes(app) {
    app.get(`${env_1.env.API_BASE_PATH}/cases/:id/text`, async (request, reply) => {
        try {
            const result = await text_service_1.textService.getCaseText(request.params.id);
            return reply.send({
                ok: true,
                caseId: result.caseId,
                filePath: result.filePath,
                content: result.content,
            });
        }
        catch (error) {
            request.log.error(error);
            const message = error instanceof Error ? error.message : 'internal error';
            const statusCode = message === 'case not found'
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
    app.put(`${env_1.env.API_BASE_PATH}/cases/:id/text`, async (request, reply) => {
        try {
            const result = await text_service_1.textService.saveCaseText(request.params.id, request.body);
            return reply.send({
                ok: true,
                caseId: result.caseId,
                filePath: result.filePath,
                content: result.content,
            });
        }
        catch (error) {
            request.log.error(error);
            const message = error instanceof Error ? error.message : 'internal error';
            const statusCode = message === 'case not found'
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
    });
}
