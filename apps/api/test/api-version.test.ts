import { describe, expect, it } from "vitest";

import {
  API_BASE_PATH,
  API_VERSION,
  API_VERSION_PREFIX,
  EVENTS_ROUTE_PREFIX,
  getApiDescriptor,
  isProtectedApiRoute
} from "../src/api-version.js";

describe("api version helpers", () => {
  it("identifies protected versioned event routes", () => {
    expect(isProtectedApiRoute(`${API_VERSION_PREFIX}${EVENTS_ROUTE_PREFIX}`)).toBe(
      true
    );
    expect(
      isProtectedApiRoute(`${API_VERSION_PREFIX}${EVENTS_ROUTE_PREFIX}/stats`)
    ).toBe(true);
    expect(isProtectedApiRoute("/health")).toBe(false);
    expect(isProtectedApiRoute(undefined)).toBe(false);
  });

  it("returns the current API descriptor", () => {
    expect(getApiDescriptor()).toEqual({
      basePath: API_BASE_PATH,
      latestVersion: API_VERSION,
      defaultVersion: API_VERSION,
      versions: [
        {
          version: API_VERSION,
          path: API_VERSION_PREFIX
        }
      ]
    });
  });
});
