"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPackageRoutes = registerPackageRoutes;
const env_1 = require("../../config/env");
const package_service_1 = require("./package.service");
async function registerPackageRoutes(app) {
    app.get(`${env_1.env.API_BASE_PATH}/cases/:id/package`, async (request, reply) => {
        try {
            const result = await package_service_1.packageService.getCasePackage(request.params.id);
            return reply.send({
                ok: true,
                caseId: result.caseId,
                filePath: result.filePath,
                package: result.packagePayload,
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
}
