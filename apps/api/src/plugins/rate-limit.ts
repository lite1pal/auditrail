import { API_VERSION_PREFIX } from "../api-version.js";
import rateLimit from "@fastify/rate-limit";
import fp from "fastify-plugin";

import { loadConfig } from "../config.js";
import { loadEnvFiles } from "../env-files.js";

export interface RateLimitPluginOptions {
  max?: number;
  timeWindow?: string;
}

export const rateLimitPlugin = fp<RateLimitPluginOptions>(async (app, options) => {
  const config = loadConfig(loadEnvFiles());

  await app.register(rateLimit, {
    global: true,
    max: options.max ?? config.RATE_LIMIT_MAX,
    timeWindow: options.timeWindow ?? config.RATE_LIMIT_WINDOW,
    skipOnError: false,
    hook: "preHandler",
    allowList(request) {
      return (
        request.routeOptions.url === "/health" ||
        request.routeOptions.url === `${API_VERSION_PREFIX}/health`
      );
    }
  });
});
