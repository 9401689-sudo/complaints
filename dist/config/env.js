"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const booleanFromEnv = zod_1.z
    .string()
    .optional()
    .transform((value) => {
    if (value === undefined || value === '')
        return false;
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(normalized))
        return true;
    if (['0', 'false', 'no', 'off'].includes(normalized))
        return false;
    throw new Error(`Invalid boolean value: ${value}`);
});
const envSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().default(3017),
    POSTGRES_HOST: zod_1.z.string().min(1),
    POSTGRES_PORT: zod_1.z.coerce.number().default(5432),
    POSTGRES_DB: zod_1.z.string().min(1),
    POSTGRES_USER: zod_1.z.string().min(1),
    POSTGRES_PASSWORD: zod_1.z.string().min(1),
    POSTGRES_SSL: booleanFromEnv,
    REDIS_HOST: zod_1.z.string().min(1),
    REDIS_PORT: zod_1.z.coerce.number().default(6379),
    REDIS_DB: zod_1.z.coerce.number().default(0),
    REDIS_PASSWORD: zod_1.z.string().min(1),
    BASE_PUBLIC_URL: zod_1.z.string().min(1),
    API_BASE_PATH: zod_1.z.string().min(1),
    NEXTCLOUD_BASE_URL: zod_1.z.string().url().optional(),
    NEXTCLOUD_USERNAME: zod_1.z.string().min(1).optional(),
    NEXTCLOUD_PASSWORD: zod_1.z.string().min(1).optional(),
    NEXTCLOUD_ROOT_PATH: zod_1.z.string().min(1).optional()
});
exports.env = envSchema.parse(process.env);
