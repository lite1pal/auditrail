import { describe, expect, it } from "vitest";

import { API_BASE_PATH, API_VERSION_PREFIX } from "../src/api-version.js";
import { buildApp } from "../src/app.js";

describe("health route", () => {
  it("can register infrastructure plugins for runtime mode", async () => {
    const app = buildApp({
      useInfrastructure: true
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
});
