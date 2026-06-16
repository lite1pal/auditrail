import { createDatabase } from "@auditrail/db";
import fp from "fastify-plugin";

import { loadConfig } from "../config.js";
import { loadEnvFiles } from "../env-files.js";

export type AppDatabase = ReturnType<typeof createDatabase>;

declare module "fastify" {
  interface FastifyInstance {
    db: AppDatabase;
  }
}

export const databasePlugin = fp(async (app) => {
  const config = loadConfig(loadEnvFiles());

  app.decorate("db", createDatabase(config.DATABASE_URL));
});
