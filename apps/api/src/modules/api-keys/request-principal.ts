import type { FastifyRequest } from "fastify";

import type { ApiKeyPrincipal } from "./repo.js";

const anonymousPrincipal: ApiKeyPrincipal = {
  apiKeyId: "00000000-0000-0000-0000-000000000000",
  organizationId: "00000000-0000-0000-0000-000000000000",
  projectId: "00000000-0000-0000-0000-000000000000"
};

export function getRequestPrincipal(request: FastifyRequest): ApiKeyPrincipal {
  return request.apiKeyPrincipal ?? anonymousPrincipal;
}
