import { isProtectedApiRoute } from "../api-version.js";
import fp from "fastify-plugin";

import { loadConfig } from "../config.js";
import { loadEnvFiles } from "../env-files.js";
import {
  createPostgresApiKeyRepo,
  type ApiKeyPrincipal
} from "../modules/api-keys/repo.js";
import { parseApiKey } from "../modules/api-keys/keys.js";

declare module "fastify" {
  interface FastifyRequest {
    apiKeyPrincipal?: ApiKeyPrincipal;
  }
}

export const authPlugin = fp(async (app) => {
  const config = loadConfig(loadEnvFiles());
  const repo = createPostgresApiKeyRepo(app.db);

  app.decorateRequest("apiKeyPrincipal");

  app.addHook("preHandler", async (request, reply) => {
    const routeUrl = request.routeOptions.url;

    if (!isProtectedApiRoute(routeUrl)) {
      return;
    }

    const authorization = request.headers.authorization;
    const apiKey = authorization?.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length)
      : undefined;

    if (!apiKey) {
      return reply.code(401).send({
        error: "missing_api_key"
      });
    }

    const parsedApiKey = parseApiKey(apiKey, config.API_KEY_PEPPER);
    const principal = await repo.findActiveByHash(
      parsedApiKey.prefix,
      parsedApiKey.hash
    );

    if (!principal) {
      return reply.code(401).send({
        error: "invalid_api_key"
      });
    }

    request.apiKeyPrincipal = principal;
  });
});
