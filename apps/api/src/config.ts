import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  API_HOST: z.string().default("0.0.0.0"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url()
});

export type ApiConfig = z.infer<typeof environmentSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  return environmentSchema.parse(env);
}
