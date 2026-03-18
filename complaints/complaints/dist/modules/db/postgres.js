"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postgres = exports.pg = void 0;
const pg_1 = require("pg");
const env_1 = require("../../config/env");
exports.pg = new pg_1.Pool({
    host: env_1.env.POSTGRES_HOST,
    port: env_1.env.POSTGRES_PORT,
    database: env_1.env.POSTGRES_DB,
    user: env_1.env.POSTGRES_USER,
    password: env_1.env.POSTGRES_PASSWORD,
    ssl: env_1.env.POSTGRES_SSL ? { rejectUnauthorized: false } : false,
});
exports.postgres = exports.pg;
