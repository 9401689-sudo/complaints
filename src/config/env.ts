import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const booleanFromEnv = z
  .string()
  .optional()
  .transform((value) => {
    if (value === undefined || value === '') return false;

    const normalized = value.trim().toLowerCase();

    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false;

    throw new Error(`Invalid boolean value: ${value}`);
  });

const envSchema = z.object({
  PORT: z.coerce.number().default(3017),

  POSTGRES_HOST: z.string().min(1),
  POSTGRES_PORT: z.coerce.number().default(5432),
  POSTGRES_DB: z.string().min(1),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  POSTGRES_SSL: booleanFromEnv,

  REDIS_HOST: z.string().min(1),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_DB: z.coerce.number().default(0),
  REDIS_PASSWORD: z.string().min(1),

  BASE_PUBLIC_URL: z.string().min(1),
  API_BASE_PATH: z.string().min(1),

  NEXTCLOUD_BASE_URL: z.string().url().optional(),
  NEXTCLOUD_USERNAME: z.string().min(1).optional(),
  NEXTCLOUD_PASSWORD: z.string().min(1).optional(),
  NEXTCLOUD_ROOT_PATH: z.string().min(1).optional()
});

export const env = envSchema.parse(process.env);
