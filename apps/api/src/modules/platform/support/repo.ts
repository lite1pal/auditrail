import { organizationMemberships, organizations, users } from "@auditrail/db/schema";
import { and, desc, eq, ilike, or } from "drizzle-orm";

import type { AppDatabase } from "../../../plugins/database.js";

export interface SupportOrganizationRecord {
  createdAt: string;
  id: string;
  name: string;
}

export interface SupportOrganizationMemberRecord {
  email: string;
  id: string;
  name?: string;
  role: "admin" | "member" | "owner" | "viewer";
}

export interface PlatformSupportRepo {
  findOrganizationById(
    organizationId: string
  ): Promise<SupportOrganizationRecord | undefined>;
  listOrganizationMembers(
    organizationId: string
  ): Promise<SupportOrganizationMemberRecord[]>;
  searchOrganizations(input: {
    limit: number;
    query: string;
  }): Promise<SupportOrganizationRecord[]>;
}

export function createPostgresPlatformSupportRepo(
  db: AppDatabase
): PlatformSupportRepo {
  return {
    async findOrganizationById(organizationId) {
      const [record] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, organizationId))
        .limit(1);

      return record
        ? {
            createdAt: record.createdAt.toISOString(),
            id: record.id,
            name: record.name
          }
        : undefined;
    },
    async listOrganizationMembers(organizationId) {
      const records = await db
        .select({
          membership: organizationMemberships,
          user: users
        })
        .from(organizationMemberships)
        .innerJoin(users, eq(users.id, organizationMemberships.userId))
        .where(eq(organizationMemberships.organizationId, organizationId))
        .orderBy(desc(organizationMemberships.createdAt));

      return records.map((record) => ({
        email: record.user.email,
        id: record.user.id,
        name: record.user.name ?? undefined,
        role: record.membership.role as SupportOrganizationMemberRecord["role"]
      }));
    },
    async searchOrganizations(input) {
      const query = input.query.trim();
      const pattern = `%${query}%`;
      const [idMatches, nameMatches, emailMatches] = await Promise.all([
        db
          .select()
          .from(organizations)
          .where(eq(organizations.id, query))
          .limit(input.limit),
        db
          .select()
          .from(organizations)
          .where(ilike(organizations.name, pattern))
          .limit(input.limit),
        db
          .select({
            organization: organizations
          })
          .from(organizationMemberships)
          .innerJoin(organizations, eq(organizations.id, organizationMemberships.organizationId))
          .innerJoin(users, eq(users.id, organizationMemberships.userId))
          .where(
            and(
              or(
                eq(organizationMemberships.role, "owner"),
                eq(organizationMemberships.role, "admin")
              ),
              ilike(users.email, pattern)
            )
          )
          .limit(input.limit)
      ]);

      const results = new Map<string, SupportOrganizationRecord>();
      for (const record of [
        ...idMatches,
        ...nameMatches,
        ...emailMatches.map((row) => row.organization)
      ]) {
        results.set(record.id, {
          createdAt: record.createdAt.toISOString(),
          id: record.id,
          name: record.name
        });
      }

      return [...results.values()].slice(0, input.limit);
    }
  };
}
