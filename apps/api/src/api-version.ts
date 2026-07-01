export const API_BASE_PATH = "/api";
export const API_VERSION = "v1";
export const API_VERSION_PREFIX = `${API_BASE_PATH}/${API_VERSION}`;
export const EVENTS_ROUTE_PREFIX = "/events";

export function isProtectedApiRoute(routeUrl?: string) {
  if (!routeUrl) {
    return false;
  }

  return routeUrl.startsWith(`${API_VERSION_PREFIX}${EVENTS_ROUTE_PREFIX}`);
}

export function getApiDescriptor(
  products: ReadonlyArray<{
    id: string;
    name: string;
  }> = []
) {
  return {
    basePath: API_BASE_PATH,
    latestVersion: API_VERSION,
    defaultVersion: API_VERSION,
    products,
    versions: [
      {
        version: API_VERSION,
        path: API_VERSION_PREFIX
      }
    ]
  };
}
