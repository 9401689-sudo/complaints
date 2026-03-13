"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerVariablesRoutes = registerVariablesRoutes;
const env_1 = require("../../config/env");
const variables_service_1 = require("./variables.service");
async function registerVariablesRoutes(app) {
    app.get(`${env_1.env.API_BASE_PATH}/cases/:id/variables`, async (request, reply) => {
        try {
            const variables = await variables_service_1.variablesService.getCaseVariables(request.params.id);
            return reply.send({
                ok: true,
                caseId: request.params.id,
                variables,
            });
        }
        catch (error) {
            request.log.error(error);
            const message = error instanceof Error ? error.message : 'internal error';
            const statusCode = message === 'case not found' ? 404 : 500;
            return reply.code(statusCode).send({
                ok: false,
                error: message,
            });
        }
    });
    app.put(`${env_1.env.API_BASE_PATH}/cases/:id/variables`, async (request, reply) => {
        try {
            const variables = await variables_service_1.variablesService.updateCaseVariables(request.params.id, request.body);
            return reply.send({
                ok: true,
                caseId: request.params.id,
                variables,
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
                        : message.includes('required') || message.includes('cannot be empty')
                            ? 400
                            : 500;
            return reply.code(statusCode).send({
                ok: false,
                error: message,
            });
        }
    });
}
