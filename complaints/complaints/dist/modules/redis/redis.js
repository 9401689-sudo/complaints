"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("../../config/env");
exports.redis = new ioredis_1.default({
    host: env_1.env.REDIS_HOST,
    port: env_1.env.REDIS_PORT,
    db: env_1.env.REDIS_DB,
    password: env_1.env.REDIS_PASSWORD,
    maxRetriesPerRequest: 3,
    lazyConnect: false
});
