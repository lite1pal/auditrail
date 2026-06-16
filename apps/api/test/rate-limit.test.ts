import { describe, expect, it } from "vitest";

import { buildApp } from "../src/app.js";

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
      url: "/v1/events"
    });
    const response = await app.inject({
      method: "GET",
      url: "/v1/events"
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
      url: "/health"
    });
    const response = await app.inject({
      method: "GET",
      url: "/health"
    });

    expect(response.statusCode).toBe(200);

    await app.close();
  });
});
