"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCaseConfigRoutes = registerCaseConfigRoutes;
const env_1 = require("../../config/env");
const case_config_service_1 = require("./case-config.service");
async function registerCaseConfigRoutes(app) {
    app.patch(`${env_1.env.API_BASE_PATH}/cases/:id/config`, async (request, reply) => {
        try {
            const updatedCase = await case_config_service_1.caseConfigService.updateCaseConfig(request.params.id, request.body);
            return reply.send({
                ok: true,
                case: updatedCase,
            });
        }
        catch (error) {
            request.log.error(error);
            const message = error instanceof Error ? error.message : 'internal error';
            const statusCode = message === 'case not found'
                ? 404
                : message === 'institution not found'
                    ? 404
                    : message === 'template not found'
                        ? 404
                        : 500;
            return reply.code(statusCode).send({
                ok: false,
                error: message,
            });
        }
    });
}
