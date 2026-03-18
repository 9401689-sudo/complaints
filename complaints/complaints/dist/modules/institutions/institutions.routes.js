"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerInstitutionsRoutes = registerInstitutionsRoutes;
const env_1 = require("../../config/env");
const institutions_service_1 = require("./institutions.service");
async function registerInstitutionsRoutes(app) {
    app.get(`${env_1.env.API_BASE_PATH}/institutions`, async (request, reply) => {
        try {
            const institutions = await institutions_service_1.institutionsService.listInstitutions();
            return reply.send({
                ok: true,
                institutions,
            });
        }
        catch (error) {
            request.log.error(error);
            return reply.code(500).send({
                ok: false,
                error: 'internal error',
            });
        }
    });
    app.get(`${env_1.env.API_BASE_PATH}/institutions/:id`, async (request, reply) => {
        try {
            const institution = await institutions_service_1.institutionsService.getInstitutionById(request.params.id);
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
        }
        catch (error) {
            request.log.error(error);
            return reply.code(500).send({
                ok: false,
                error: 'internal error',
            });
        }
    });
    app.delete(`${env_1.env.API_BASE_PATH}/institutions/:id`, async (request, reply) => {
        try {
            const deleted = await institutions_service_1.institutionsService.deleteInstitution(request.params.id);
            return reply.send({
                ok: true,
                deleted,
            });
        }
        catch (error) {
            request.log.error(error);
            const message = error instanceof Error ? error.message : 'internal error';
            const statusCode = message === 'institution not found'
                ? 404
                : message === 'institution is used in cases or templates'
                    ? 409
                    : 500;
            return reply.code(statusCode).send({
                ok: false,
                error: message,
            });
        }
    });
    app.post(`${env_1.env.API_BASE_PATH}/institutions`, async (request, reply) => {
        try {
            const institution = await institutions_service_1.institutionsService.createInstitution(request.body);
            return reply.code(201).send({
                ok: true,
                institution,
            });
        }
        catch (error) {
            request.log.error(error);
            const message = error instanceof Error ? error.message : 'internal error';
            const statusCode = message.includes('required') || message.includes('must be') ? 400 : 500;
            return reply.code(statusCode).send({
                ok: false,
                error: message,
            });
        }
    });
    app.patch(`${env_1.env.API_BASE_PATH}/institutions/:id`, async (request, reply) => {
        try {
            const institution = await institutions_service_1.institutionsService.updateInstitution(request.params.id, request.body);
            return reply.send({
                ok: true,
                institution,
            });
        }
        catch (error) {
            request.log.error(error);
            const message = error instanceof Error ? error.message : 'internal error';
            const statusCode = message === 'institution not found'
                ? 404
                : message.includes('required') || message.includes('must be')
                    ? 400
                    : 500;
            return reply.code(statusCode).send({
                ok: false,
                error: message,
            });
        }
    });
}
