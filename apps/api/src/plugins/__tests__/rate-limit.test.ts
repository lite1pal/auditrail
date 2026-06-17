import { describe, expect, it } from "vitest";

import { API_VERSION_PREFIX } from "../../api-version.js";
import { buildApp } from "../../app.js";

describe("rate limiting", () => {
  it("limits API routes by default", async () => {
    const app = buildApp({
      rateLimit: {
        max: 1,
        timeWindow: "1 minute"
      }
    });

    await app.inject({
      method: "GET",
      url: `${API_VERSION_PREFIX}/events`
    });
    const response = await app.inject({
      method: "GET",
      url: `${API_VERSION_PREFIX}/events`
    });

    expect(response.statusCode).toBe(429);

    await app.close();
  });

  it("does not rate limit health checks", async () => {
    const app = buildApp({
      rateLimit: {
        max: 1,
        timeWindow: "1 minute"
      }
    });

    await app.inject({
      method: "GET",
      url: `${API_VERSION_PREFIX}/health`
    });
    const response = await app.inject({
      method: "GET",
      url: `${API_VERSION_PREFIX}/health`
    });

    expect(response.statusCode).toBe(200);

    await app.close();
  });
});
