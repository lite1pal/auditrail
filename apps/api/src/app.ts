import cors from "@fastify/cors";
import Fastify from "fastify";

import {
  API_BASE_PATH,
  API_VERSION_PREFIX,
  getApiDescriptor
} from "./api-version.js";
import { registerEventRoutes } from "./modules/audit-events/routes.js";
import { authPlugin } from "./plugins/auth.js";
import { databasePlugin } from "./plugins/database.js";
import { rateLimitPlugin } from "./plugins/rate-limit.js";

export interface RateLimitOptions {
  max?: number;
  timeWindow?: string;
}

export interface InfrastructureOptions {
  databaseUrl?: string;
}

export interface BuildAppOptions {
  useInfrastructure?: boolean;
  useRateLimit?: boolean;
  rateLimit?: RateLimitOptions;
  infrastructure?: InfrastructureOptions;
}

export function buildApp(options: BuildAppOptions = {}) {
  const app = Fastify({
    logger: true
  });

  app.register(cors, {
    origin: true
  });
  if (options.useRateLimit ?? true) {
    if (options.rateLimit) {
      app.register(rateLimitPlugin, options.rateLimit);
    } else {
      app.register(rateLimitPlugin);
    }
  }

  app.get("/health", async () => {
    return {
      status: "ok"
    };
  });
  app.get(API_BASE_PATH, async () => getApiDescriptor());
  app.get(`${API_VERSION_PREFIX}/health`, async () => {
    return {
      status: "ok"
    };
  });

  if (options.useInfrastructure) {
    if (options.infrastructure) {
      app.register(databasePlugin, options.infrastructure);
    } else {
      app.register(databasePlugin);
    }
    app.register(authPlugin);
  }

  app.register(registerEventRoutes, {
    prefix: API_VERSION_PREFIX
  });

  return app;
}
