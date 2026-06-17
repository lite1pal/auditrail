import { describe, expect, it } from "vitest";

import { loadConfig } from "../config.js";

describe("api config", () => {
  it("parses required environment values", () => {
    expect(
      loadConfig({
        API_PORT: "4001",
        RATE_LIMIT_MAX: "10",
        RATE_LIMIT_WINDOW: "30 seconds",
        API_KEY_PEPPER: "test-api-key-pepper",
        DATABASE_URL: "postgres://auditrail:auditrail@localhost:5433/auditrail",
        REDIS_URL: "redis://localhost:6379"
      })
    ).toEqual({
      NODE_ENV: "development",
      API_HOST: "0.0.0.0",
      API_PORT: 4001,
      RATE_LIMIT_MAX: 10,
      RATE_LIMIT_WINDOW: "30 seconds",
      API_KEY_PEPPER: "test-api-key-pepper",
      AUTH_MAGIC_LINK_TTL_SECONDS: 900,
      AUTH_SESSION_COOKIE_NAME: "auditrail_session",
      AUTH_SESSION_COOKIE_SECURE: true,
      AUTH_SESSION_TTL_SECONDS: 2592000,
      DATABASE_URL: "postgres://auditrail:auditrail@localhost:5433/auditrail",
      REDIS_URL: "redis://localhost:6379"
    });
  });

  it("rejects missing service URLs", () => {
    expect(() => loadConfig({})).toThrow();
  });

  it("falls back to PORT when API_PORT is not set", () => {
    expect(
      loadConfig({
        PORT: "4010",
        API_KEY_PEPPER: "test-api-key-pepper",
        DATABASE_URL: "postgres://auditrail:auditrail@localhost:5433/auditrail",
        REDIS_URL: "redis://localhost:6379"
      }).API_PORT
    ).toBe(4010);
  });
});
