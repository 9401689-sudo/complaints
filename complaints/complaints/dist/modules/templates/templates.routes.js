"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTemplatesRoutes = registerTemplatesRoutes;
const env_1 = require("../../config/env");
const templates_service_1 = require("./templates.service");
async function registerTemplatesRoutes(app) {
    app.get(`${env_1.env.API_BASE_PATH}/templates`, async (request, reply) => {
        try {
            const templates = await templates_service_1.templatesService.listTemplates();
            return reply.send({
                ok: true,
                templates,
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
    app.delete(`${env_1.env.API_BASE_PATH}/templates/:id`, async (request, reply) => {
        try {
            const deleted = await templates_service_1.templatesService.deleteTemplate(request.params.id);
            return reply.send({
                ok: true,
                deleted,
            });
        }
        catch (error) {
            request.log.error(error);
            const message = error instanceof Error ? error.message : 'internal error';
            const statusCode = message === 'template not found'
                ? 404
                : message === 'template is used in cases'
                    ? 409
                    : 500;
            return reply.code(statusCode).send({
                ok: false,
                error: message,
            });
        }
    });
    app.get(`${env_1.env.API_BASE_PATH}/templates/:id`, async (request, reply) => {
        try {
            const template = await templates_service_1.templatesService.getTemplateById(request.params.id);
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
        }
        catch (error) {
            request.log.error(error);
            return reply.code(500).send({
                ok: false,
                error: 'internal error',
            });
        }
    });
    app.post(`${env_1.env.API_BASE_PATH}/templates`, async (request, reply) => {
        try {
            const template = await templates_service_1.templatesService.createTemplate(request.body);
            return reply.code(201).send({
                ok: true,
                template,
            });
        }
        catch (error) {
            request.log.error(error);
            const message = error instanceof Error ? error.message : 'internal error';
            const statusCode = message.includes('required') ||
                message.includes('must be')
                ? 400
                : 500;
            return reply.code(statusCode).send({
                ok: false,
                error: message,
            });
        }
    });
    app.patch(`${env_1.env.API_BASE_PATH}/templates/:id`, async (request, reply) => {
        try {
            const template = await templates_service_1.templatesService.updateTemplate(request.params.id, request.body);
            return reply.send({
                ok: true,
                template,
            });
        }
        catch (error) {
            request.log.error(error);
            const message = error instanceof Error ? error.message : 'internal error';
            const statusCode = message === 'template not found'
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
