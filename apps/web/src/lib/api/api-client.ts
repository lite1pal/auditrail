import { toApiError } from "./api-errors";
import type { paths } from "./generated/schema";

export type ApiPath = keyof paths & string;

export interface ApiClientOptions {
  baseUrl: string;
  getAccessToken?: () => Promise<string | undefined>;
  fetcher?: typeof fetch;
}

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: ApiPath;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  signal?: AbortSignal;
}

export interface ApiClient {
  request<TResponse>(options: ApiRequestOptions): Promise<TResponse>;
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const fetcher = options.fetcher ?? fetch;

  return {
    async request<TResponse>(requestOptions: ApiRequestOptions) {
      const accessToken = await options.getAccessToken?.();
      const response = await fetcher(buildUrl(options.baseUrl, requestOptions), {
        body: requestOptions.body ? JSON.stringify(requestOptions.body) : undefined,
        headers: buildHeaders(accessToken, requestOptions.body),
        method: requestOptions.method ?? "GET",
        signal: requestOptions.signal
      });

      if (!response.ok) {
        throw await toApiError(response);
      }

      return (await response.json()) as TResponse;
    }
  };
}

function buildUrl(baseUrl: string, options: ApiRequestOptions) {
  const url = new URL(options.path, baseUrl);

  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

function buildHeaders(accessToken: string | undefined, body: unknown) {
  const headers = new Headers({
    accept: "application/json"
  });

  if (body) {
    headers.set("content-type", "application/json");
  }

  if (accessToken) {
    headers.set("authorization", `Bearer ${accessToken}`);
  }

  return headers;
}
