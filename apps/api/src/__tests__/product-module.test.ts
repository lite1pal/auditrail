import Fastify from "fastify";
import { describe, expect, it } from "vitest";

import {
  createApiProductRuntime,
  getProductApiOpenApiInfo,
  registerProductApiRoutes
} from "../product-module.js";

describe("API product module", () => {
  it("derives OpenAPI info from the product module", () => {
    expect(getProductApiOpenApiInfo()).toEqual({
      description:
        "Versioned audit event ingestion and query API. The canonical contract is /api/v1.",
      title: "AuditTrail API"
    });
  });

  it("registers the declared product API routes", async () => {
    const app = Fastify();

    await app.register(registerProductApiRoutes, {
      prefix: "/api/v1"
    });

    const paths = app
      .printRoutes()
      .split("\n")
      .filter((line) => line.includes("api/v1/events"));

    expect(paths.length).toBeGreaterThan(0);

    await app.close();
  });

  it("can describe and register multiple product modules through one runtime", async () => {
    const app = Fastify();
    const seenProductIds: string[] = [];
    const runtime = createApiProductRuntime(
      [
        {
          getRuntimeRegistrations() {
            return [
              {
                id: "alpha",
                surface: "api" as const,
                target: "alpha-routes"
              }
            ];
          },
          manifest: {
            id: "alpha-product",
            name: "Alpha Product"
          }
        },
        {
          getRuntimeRegistrations() {
            return [
              {
                id: "beta",
                surface: "api" as const,
                target: "beta-routes"
              }
            ];
          },
          manifest: {
            id: "beta-product",
            name: "Beta Product"
          }
        }
      ],
      {
        "alpha-routes": (targetApp, options) => {
          seenProductIds.push(options.productId);
          targetApp.get("/alpha", async () => ({ ok: true }));
        },
        "beta-routes": (targetApp, options) => {
          seenProductIds.push(options.productId);
          targetApp.get("/beta", async () => ({ ok: true }));
        }
      }
    );

    expect(runtime.listRegisteredProducts()).toEqual([
      {
        id: "alpha-product",
        name: "Alpha Product"
      },
      {
        id: "beta-product",
        name: "Beta Product"
      }
    ]);

    await runtime.registerProductApiRoutes(app, {
      prefix: "/api/v1"
    });

    expect(seenProductIds).toEqual(["alpha-product", "beta-product"]);
    expect(app.hasRoute({ method: "GET", url: "/alpha" })).toBe(true);
    expect(app.hasRoute({ method: "GET", url: "/beta" })).toBe(true);

    await app.close();
  });
});
