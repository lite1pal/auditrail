import { describe, expect, it } from "vitest";

import { API_BASE_PATH, API_VERSION_PREFIX } from "../api-version.js";
import { buildApp } from "../app.js";

describe("health route", () => {
  it("can register infrastructure plugins for runtime mode", async () => {
    const app = buildApp({
      useInfrastructure: true
    });

    expect(app).toBeDefined();

    await app.close();
  });

  it("can register infrastructure plugins with explicit overrides", async () => {
    const app = buildApp({
      useInfrastructure: true,
      infrastructure: {
        databaseUrl: "postgres://auditrail:auditrail@localhost:5433/auditrail"
      }
    });

    expect(app).toBeDefined();

    await app.close();
  });

  it("returns ok", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/health"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: "ok"
    });

    await app.close();
  });

  it("returns API version metadata", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "GET",
      url: API_BASE_PATH
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      basePath: "/api",
      latestVersion: "v1",
      defaultVersion: "v1",
      versions: [
        {
          version: "v1",
          path: "/api/v1"
        }
      ]
    });

    await app.close();
  });

  it("returns ok on the versioned health route", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "GET",
      url: `${API_VERSION_PREFIX}/health`
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: "ok"
    });

    await app.close();
  });

  it("returns an OpenAPI document for the current version", async () => {
    const app = buildApp({
      useRateLimit: false
    });

    const response = await app.inject({
      method: "GET",
      url: `${API_VERSION_PREFIX}/openapi.json`
    });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.openapi).toBe("3.0.3");
    expect(body.info).toMatchObject({
      title: "AuditTrail API",
      version: "v1"
    });
    expect(body.paths).toHaveProperty(`${API_VERSION_PREFIX}/events`);
    expect(body.paths).toHaveProperty(`${API_VERSION_PREFIX}/events/stats`);
    expect(body.paths).toHaveProperty(`${API_VERSION_PREFIX}/events/timeseries`);

    await app.close();
  });
});
