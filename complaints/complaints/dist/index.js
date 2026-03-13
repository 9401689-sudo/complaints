"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const formbody_1 = __importDefault(require("@fastify/formbody"));
const env_1 = require("./config/env");
const cases_routes_1 = require("./modules/cases/cases.routes");
const files_routes_1 = require("./modules/files/files.routes");
const postgres_health_1 = require("./modules/db/postgres.health");
const redis_1 = require("./modules/redis/redis");
const institutions_routes_1 = require("./modules/institutions/institutions.routes");
const templates_routes_1 = require("./modules/templates/templates.routes");
const variables_routes_1 = require("./modules/variables/variables.routes");
const text_routes_1 = require("./modules/text/text.routes");
const case_config_routes_1 = require("./modules/case-config/case-config.routes");
const package_routes_1 = require("./modules/package/package.routes");
async function bootstrap() {
    const app = (0, fastify_1.default)({
        logger: true
    });
    await app.register(cors_1.default, {
        origin: true
    });
    await app.register(formbody_1.default);
    app.get('/health', async () => {
        return { ok: true };
    });
    app.get(`${env_1.env.API_BASE_PATH}/health`, async () => {
        return {
            ok: true,
            apiBasePath: env_1.env.API_BASE_PATH,
            basePublicUrl: env_1.env.BASE_PUBLIC_URL
        };
    });
    app.get(`${env_1.env.API_BASE_PATH}/health/db`, async () => {
        return (0, postgres_health_1.checkPostgresHealth)();
    });
    await (0, cases_routes_1.registerCasesRoutes)(app);
    await (0, files_routes_1.registerFilesRoutes)(app);
    await (0, institutions_routes_1.registerInstitutionsRoutes)(app);
    await (0, templates_routes_1.registerTemplatesRoutes)(app);
    await (0, variables_routes_1.registerVariablesRoutes)(app);
    await (0, text_routes_1.registerTextRoutes)(app);
    await (0, case_config_routes_1.registerCaseConfigRoutes)(app);
    await (0, package_routes_1.registerPackageRoutes)(app);
    console.log(app.printRoutes());
    redis_1.redis.on('error', (err) => {
        app.log.error({ err }, 'Redis error');
    });
    await app.listen({
        port: env_1.env.PORT,
        host: '0.0.0.0'
    });
    app.log.info(`Server started on port ${env_1.env.PORT}`);
}
bootstrap().catch((err) => {
    console.error(err);
    process.exit(1);
});
