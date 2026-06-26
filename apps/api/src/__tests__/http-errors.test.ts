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

  it("returns a generic internal error response in production", async () => {
    const app = Fastify({ logger: false });
    registerApiErrorHandler(app, {
      nodeEnv: "production"
    });

    app.get("/boom", async () => {
      throw new Error("sql error: password=secret");
    });

    const response = await app.inject({
      method: "GET",
      url: "/boom"
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      error: "internal_server_error"
    });

    await app.close();
  });

  it("returns a deterministic debug message outside production", async () => {
    const app = Fastify({ logger: false });
    registerApiErrorHandler(app, {
      nodeEnv: "test"
    });

    app.get("/boom", async () => {
      throw new Error("sql error");
    });

    const response = await app.inject({
      method: "GET",
      url: "/boom"
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      error: "internal_server_error",
      message: "sql error"
    });

    await app.close();
  });

  it("does not expose thrown non-error values", async () => {
    const app = Fastify({ logger: false });
    registerApiErrorHandler(app, {
      nodeEnv: "production"
    });

    app.get("/non-error", async () => {
      throw "token=secret";
    });

    const response = await app.inject({
      method: "GET",
      url: "/non-error"
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      error: "internal_server_error"
    });
    expect(response.body).not.toContain("token=secret");

    await app.close();
  });

  it("falls back to development-style debug messages for unknown NODE_ENV values", async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "staging";

    try {
      const app = Fastify({ logger: false });
      registerApiErrorHandler(app);

      app.get("/boom", async () => {
        throw new Error("debug me");
      });

      const response = await app.inject({
        method: "GET",
        url: "/boom"
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual({
        error: "internal_server_error",
        message: "debug me"
      });

      await app.close();
    } finally {
      process.env.NODE_ENV = previousNodeEnv;
    }
  });

  it("uses a generic debug message for non-error thrown values outside production", async () => {
    const app = Fastify({ logger: false });
    registerApiErrorHandler(app, {
      nodeEnv: "test"
    });

    app.get("/non-error", async () => {
      throw [];
    });

    const response = await app.inject({
      method: "GET",
      url: "/non-error"
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      error: "internal_server_error",
      message: "Unexpected error"
    });

    await app.close();
  });
});
