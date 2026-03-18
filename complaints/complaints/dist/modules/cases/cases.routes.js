"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCasesRoutes = registerCasesRoutes;
const env_1 = require("../../config/env");
const cases_service_1 = require("./cases.service");
const redis_1 = require("../redis/redis");
async function registerCasesRoutes(app) {
    app.get(`${env_1.env.API_BASE_PATH}/cases`, async (_request, reply) => {
        try {
            const cases = await cases_service_1.casesService.listCases();
            return reply.send({
                ok: true,
                cases
            });
        }
        catch (error) {
            return requestError(reply, error);
        }
    });
    app.post(`${env_1.env.API_BASE_PATH}/cases`, async (_request, reply) => {
        try {
            const payload = await cases_service_1.casesService.createCase();
            return reply.code(201).send(payload);
        }
        catch (error) {
            return requestError(reply, error);
        }
    });
    app.get(`${env_1.env.API_BASE_PATH}/cases/:id`, async (request, reply) => {
        try {
            const payload = await cases_service_1.casesService.getCase(request.params.id);
            return reply.send(payload);
        }
        catch (error) {
            return requestError(reply, error, 404);
        }
    });
    app.patch(`${env_1.env.API_BASE_PATH}/cases/:id/meta`, async (request, reply) => {
        try {
            const updated = await cases_service_1.casesService.updateCaseMeta(request.params.id, request.body);
            return reply.send({
                ok: true,
                case: updated
            });
        }
        catch (error) {
            return requestError(reply, error, 404);
        }
    });
    app.post(`${env_1.env.API_BASE_PATH}/cases/:id/generate-text`, async (request, reply) => {
        try {
            const payload = await cases_service_1.casesService.generateText(request.params.id);
            return reply.send({
                ok: true,
                case: payload.case,
                text: payload.text,
                artifactPath: payload.artifactPath,
                checksum: payload.checksum,
                fsm: payload.fsm
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            const statusCode = message === 'case not found'
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
    });
    app.post(`${env_1.env.API_BASE_PATH}/cases/:id/save-as-template`, async (request, reply) => {
        try {
            const template = await cases_service_1.casesService.saveCaseTextAsTemplate(request.params.id);
            return reply.send({
                ok: true,
                template
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            const statusCode = message === 'case not found'
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
    });
    app.post(`${env_1.env.API_BASE_PATH}/cases/:id/build-package`, async (request, reply) => {
        try {
            // Теперь request.params.id точно будет строкой
            const payload = await cases_service_1.casesService.buildPackage(request.params.id);
            return reply.send({
                ok: true,
                case: payload.case,
                artifactPath: payload.artifactPath,
                checksum: payload.checksum,
                package: payload.packagePayload,
                fsm: payload.fsm
            });
        }
        catch (error) {
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
    });
    app.delete(`${env_1.env.API_BASE_PATH}/cases/:id`, async (request, reply) => {
        try {
            const deleted = await cases_service_1.casesService.deleteCase(request.params.id);
            await redis_1.redis.del(`complaints:case:${request.params.id}:fsm`);
            return reply.send({
                ok: true,
                deleted
            });
        }
        catch (error) {
            return requestError(reply, error, 404);
        }
    });
    app.get(`${env_1.env.API_BASE_PATH}/cases/ping`, async () => {
        return { ok: true, module: 'cases' };
    });
}
function requestError(reply, error, code = 500) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return reply.code(code).send({
        ok: false,
        error: message
    });
}
