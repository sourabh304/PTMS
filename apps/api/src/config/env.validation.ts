import { z } from 'zod';

const booleanish = z
  .union([z.boolean(), z.string()])
  .transform((value) => (typeof value === 'boolean' ? value : ['true', '1', 'yes'].includes(value.toLowerCase())));

const durationPattern = /^\d+(ms|s|m|h|d)?$/;

/**
 * Single source of truth for every environment variable consumed by the API.
 * The process fails fast on boot when the environment is invalid.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_NAME: z.string().min(1),
  PORT: z.coerce.number().int().positive(),
  API_PREFIX: z.string().min(1),
  CORS_ORIGINS: z.string().default(''),
  SWAGGER_ENABLED: booleanish.default(false),

  DATABASE_URL: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().regex(durationPattern),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_REFRESH_EXPIRES_IN: z.string().regex(durationPattern),
  /** Session lifetime when the user ticks "Keep me signed in". */
  JWT_REFRESH_REMEMBER_EXPIRES_IN: z.string().regex(durationPattern),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(8).max(15),
  ACCESS_COOKIE_NAME: z.string().min(1),
  REFRESH_COOKIE_NAME: z.string().min(1),
  COOKIE_SECURE: booleanish.default(false),
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  COOKIE_DOMAIN: z.string().optional(),

  THROTTLE_TTL_MS: z.coerce.number().int().positive(),
  THROTTLE_LIMIT: z.coerce.number().int().positive(),
  AUTH_THROTTLE_LIMIT: z.coerce.number().int().positive(),

  DEFAULT_PAGE_SIZE: z.coerce.number().int().positive(),
  MAX_PAGE_SIZE: z.coerce.number().int().positive(),

});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const details = result.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }
  return result.data;
}
