import { apiKeys, projects } from "@auditrail/db/schema";
import { and, eq } from "drizzle-orm";

import type { AppDatabase } from "../../plugins/database.js";

export interface ApiKeyPrincipal {
  apiKeyId: string;
  organizationId: string;
  projectId: string;
}

export interface ApiKeyRepo {
  findActiveByHash(prefix: string, hash: string): Promise<ApiKeyPrincipal | null>;
}

export function createPostgresApiKeyRepo(db: AppDatabase): ApiKeyRepo {
  return {
    async findActiveByHash(prefix, hash) {
      const [record] = await db
        .select({
          apiKeyId: apiKeys.id,
          organizationId: projects.organizationId,
          projectId: apiKeys.projectId
        })
        .from(apiKeys)
        .innerJoin(projects, eq(projects.id, apiKeys.projectId))
        .where(
          and(
            eq(apiKeys.keyPrefix, prefix),
            eq(apiKeys.keyHash, hash),
            eq(apiKeys.revoked, false)
          )
        )
        .limit(1);

      return record ?? null;
    }
  };
}
