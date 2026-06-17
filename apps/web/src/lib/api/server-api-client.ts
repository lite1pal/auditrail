import "server-only";

import { loadServerConfig } from "../../config/env";
import { createApiClient, type ApiClient } from "./api-client";

export function createServerApiClient(): ApiClient {
  const config = loadServerConfig();

  return createApiClient({
    baseUrl: config.WEB_API_BASE_URL,
    getAccessToken: async () => config.WEB_API_KEY
  });
}
