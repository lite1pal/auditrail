import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { registerApiErrorHandler } from "../http-errors.js";

describe("http error handler", () => {
  it("formats zod errors as invalid_event_query responses", async () => {
    const app = Fastify({ logger: false });
    registerApiErrorHandler(app);

    app.get("/zod", async () => {
      z
        .object({
          from: z.string().datetime({ offset: true })
        })
        .parse({
          from: "not-a-date"
        });
    });

    const response = await app.inject({
      method: "GET",
      url: "/zod"
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: "invalid_event_query"
    });

    await app.close();
  });

  it("formats missing-property validation errors with a field path", async () => {
    const app = Fastify({ logger: false });
    registerApiErrorHandler(app);

    app.post(
      "/required",
      {
        schema: {
          body: {
            type: "object",
            required: ["event"],
            properties: {
              event: { type: "string" }
            }
          }
        }
      },
      async () => ({ ok: true })
    );

    const response = await app.inject({
      method: "POST",
      url: "/required",
      payload: {}
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: "invalid_event_payload",
      issues: [
        {
          path: ["event"]
        }
      ]
    });

    await app.close();
  });

  it("formats synthetic validation errors without a path as an empty path", async () => {
    const app = Fastify({ logger: false });
    registerApiErrorHandler(app);

    app.get("/synthetic", async () => {
      throw {
        validationContext: "query",
        validation: [
          {
            keyword: "custom"
          }
        ]
      };
    });

    const response = await app.inject({
      method: "GET",
      url: "/synthetic"
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: "invalid_event_query",
      issues: [
        {
          path: [],
          message: "Invalid input",
          code: "custom"
        }
      ]
    });

    await app.close();
  });
});
