import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  API_HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().optional(),
  API_PORT: z.coerce.number().int().positive().default(4000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW: z.string().default("1 minute"),
  API_KEY_PEPPER: z.string().min(16),
  AUTH_TOKEN_SECRET: z.string().min(32).optional(),
  AUTH_MAGIC_LINK_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  AUTH_SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(2592000),
  AUTH_SESSION_COOKIE_NAME: z.string().default("auditrail_session"),
  AUTH_SESSION_COOKIE_SECURE: z.coerce.boolean().default(true),
  WEB_PUBLIC_URL: z.string().url().optional(),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url()
});

export type ApiConfig = z.infer<typeof environmentSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  return environmentSchema.parse(normalizeEnvironment(env));
}

function normalizeEnvironment(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  if (!env.API_PORT && env.PORT) {
    return {
      ...env,
      API_PORT: env.PORT
    };
  }

  return env;
}
