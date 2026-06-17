"use client";

import { loadPublicConfig } from "../../config/env";
import { createApiClient, type ApiClient } from "./api-client";

export function createBrowserApiClient(
  getAccessToken?: () => Promise<string | undefined>
): ApiClient {
  const config = loadPublicConfig();

  return createApiClient({
    baseUrl: config.NEXT_PUBLIC_API_BASE_URL,
    getAccessToken
  });
}
