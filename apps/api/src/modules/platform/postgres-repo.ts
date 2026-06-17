import {
  organizationInvitations,
  organizationMemberships,
  organizations,
  projects
} from "@auditrail/db/schema";

import type { AppDatabase } from "../../plugins/database.js";
import type {
  Invitation,
  Membership,
  Organization,
  PlatformRepo,
  Project
} from "./service.js";

export function createPostgresPlatformRepo(db: AppDatabase): PlatformRepo {
  return {
    async createInvitation(input) {
      const [record] = await db
        .insert(organizationInvitations)
        .values({
          email: input.email,
          expiresAt: new Date(input.expiresAt),
          organizationId: input.organizationId,
          role: input.role,
          tokenHash: input.tokenHash
        })
        .returning();

      return toInvitation(record);
    },
    async createMembership(input) {
      const [record] = await db
        .insert(organizationMemberships)
        .values(input)
        .returning();

      return toMembership(record);
    },
    async createOrganization(input) {
      const [record] = await db.insert(organizations).values(input).returning();

      return toOrganization(record);
    },
    async createProject(input) {
      const [record] = await db.insert(projects).values(input).returning();

      return toProject(record);
    }
  };
}

function toInvitation(
  record: typeof organizationInvitations.$inferSelect
): Invitation {
  return {
    acceptedAt: record.acceptedAt?.toISOString(),
    email: record.email,
    expiresAt: record.expiresAt.toISOString(),
    id: record.id,
    organizationId: record.organizationId,
    revokedAt: record.revokedAt?.toISOString(),
    role: record.role as Invitation["role"]
  };
}

function toMembership(
  record: typeof organizationMemberships.$inferSelect
): Membership {
  return {
    id: record.id,
    organizationId: record.organizationId,
    role: record.role as Membership["role"],
    userId: record.userId
  };
}

function toOrganization(record: typeof organizations.$inferSelect): Organization {
  return {
    id: record.id,
    name: record.name
  };
}

function toProject(record: typeof projects.$inferSelect): Project {
  return {
    id: record.id,
    name: record.name,
    organizationId: record.organizationId
  };
}
