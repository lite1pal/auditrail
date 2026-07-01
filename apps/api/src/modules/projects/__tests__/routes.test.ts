import Fastify from "fastify";
import { describe, expect, it } from "vitest";

import { registerProjectsProductRoutes } from "../routes.js";

describe("registerProjectsProductRoutes", () => {
  it("requires a session", async () => {
    const app = buildTestApp({}, { session: false });

    const response = await app.inject({
      method: "GET",
      url: "/organizations/org-1/projects/workspace"
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ error: "missing_session" });

    await app.close();
  });

  it("returns a workspace summary for installed product organizations", async () => {
    const app = buildTestApp({
      async listProjectsForUser(input) {
        expect(input).toEqual({
          organizationId: "org-1",
          userId: "user-1"
        });

        return [
          {
            id: "project-1",
            name: "Roadmap",
            organizationId: "org-1"
          }
        ];
      }
    });

    const response = await app.inject({
      method: "GET",
      url: "/organizations/org-1/projects/workspace"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      organizationId: "org-1",
      productId: "projects",
      projectCount: 1,
      projects: [
        {
          id: "project-1",
          name: "Roadmap",
          organizationId: "org-1"
        }
      ]
    });

    await app.close();
  });

  it("returns product_not_installed when the organization does not have the product", async () => {
    const app = buildTestApp(
      {},
      {
        productAccessError: new Error("product_not_installed")
      }
    );

    const response = await app.inject({
      method: "GET",
      url: "/organizations/org-1/projects/workspace"
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({ error: "product_not_installed" });

    await app.close();
  });
});

function buildTestApp(
  platformOverrides: Partial<{
    listProjectsForUser(input: {
      organizationId: string;
      userId: string;
    }): Promise<
      readonly {
        id: string;
        name: string;
        organizationId: string;
      }[]
    >;
  }> = {},
  options: {
    productAccessError?: Error;
    session?: boolean;
  } = {}
) {
  const app = Fastify();
  const useSession = options.session ?? true;

  app.decorateRequest("sessionUser");
  app.addHook("preHandler", async (request) => {
    request.sessionUser = useSession
      ? {
          email: "user@example.com",
          id: "user-1"
        }
      : undefined;
  });

  app.register(registerProjectsProductRoutes, {
    platformService: {
      async listProjectsForUser() {
        return [];
      },
      ...platformOverrides
    },
    productAccess: {
      async assertProductInstalledForOrganization() {
        if (options.productAccessError) {
          throw options.productAccessError;
        }
      }
    },
    productId: "projects"
  });

  return app;
}
