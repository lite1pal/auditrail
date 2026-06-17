import { describe, expect, it } from "vitest";

import { createPostgresPlatformRepo } from "../postgres-repo.js";

describe("createPostgresPlatformRepo", () => {
  it("creates platform records", async () => {
    const db = createFakeDb([
      { id: "org-1", name: "Acme" },
      { id: "project-1", name: "Production", organizationId: "org-1" },
      {
        id: "membership-1",
        organizationId: "org-1",
        role: "owner",
        userId: "user-1"
      },
      {
        acceptedAt: null,
        email: "user@example.com",
        expiresAt: new Date("2026-01-01T00:00:00.000Z"),
        id: "invitation-1",
        organizationId: "org-1",
        revokedAt: null,
        role: "admin"
      }
    ]);
    const repo = createPostgresPlatformRepo(db);

    await expect(repo.createOrganization({ name: "Acme" })).resolves.toEqual({
      id: "org-1",
      name: "Acme"
    });
    await expect(
      repo.createProject({ name: "Production", organizationId: "org-1" })
    ).resolves.toEqual({
      id: "project-1",
      name: "Production",
      organizationId: "org-1"
    });
    await expect(
      repo.createMembership({
        organizationId: "org-1",
        role: "owner",
        userId: "user-1"
      })
    ).resolves.toEqual({
      id: "membership-1",
      organizationId: "org-1",
      role: "owner",
      userId: "user-1"
    });
    await expect(
      repo.createInvitation({
        email: "user@example.com",
        expiresAt: "2026-01-01T00:00:00.000Z",
        organizationId: "org-1",
        role: "admin",
        tokenHash: "hash"
      })
    ).resolves.toEqual({
      acceptedAt: undefined,
      email: "user@example.com",
      expiresAt: "2026-01-01T00:00:00.000Z",
      id: "invitation-1",
      organizationId: "org-1",
      revokedAt: undefined,
      role: "admin"
    });
  });
});

function createFakeDb(insertResults: unknown[]) {
  const results = [...insertResults];

  return {
    insert() {
      return {
        values() {
          return {
            async returning() {
              return [results.shift()];
            }
          };
        }
      };
    }
  } as never;
}
