import type { FastifyInstance } from "fastify";
import { z } from "zod";

const organizationParamsSchema = z.object({
  organizationId: z.string().min(1)
});

export interface ProjectsProductRoutesOptions {
  platformService?: {
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
  };
  productAccess?: {
    assertProductInstalledForOrganization(input: {
      organizationId: string;
      productId: string;
    }): Promise<void>;
  };
  productId?: string;
}

export async function registerProjectsProductRoutes(
  app: FastifyInstance,
  options: ProjectsProductRoutesOptions = {}
) {
  app.get("/organizations/:organizationId/projects/workspace", async (request, reply) => {
    const user = request.sessionUser;
    const params = organizationParamsSchema.safeParse(request.params);

    if (!user) {
      return reply.code(401).send({ error: "missing_session" });
    }

    if (!params.success) {
      return reply.code(400).send({ error: "invalid_request" });
    }

    if (!options.platformService || !options.productAccess || !options.productId) {
      throw new Error("missing_projects_product_runtime");
    }

    try {
      await options.productAccess.assertProductInstalledForOrganization({
        organizationId: params.data.organizationId,
        productId: options.productId
      });

      const projects = await options.platformService.listProjectsForUser({
        organizationId: params.data.organizationId,
        userId: user.id
      });

      return {
        organizationId: params.data.organizationId,
        productId: options.productId,
        projectCount: projects.length,
        projects
      };
    } catch (error) {
      if (error instanceof Error && error.message === "forbidden") {
        return reply.code(403).send({ error: "forbidden" });
      }

      if (error instanceof Error && error.message === "product_not_installed") {
        return reply.code(403).send({ error: "product_not_installed" });
      }

      throw error;
    }
  });
}
