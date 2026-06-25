import { describe, expect, it } from "vitest";

import {
  loadOrganizationMembersPage,
  loadWorkspacePage
} from "@/src/features/organizations/server/organizations-server";

describe("loadWorkspacePage", () => {
  it("loads the selected project API keys and onboarding command", async () => {
    const result = await loadWorkspacePage(
      {
        organizationId: "org-1",
        projectId: "project-2"
      },
      {
        currentUser: createCurrentUser({
          memberships: [
            {
              organization: {
                id: "org-1",
                name: "Acme"
              },
              organizationId: "org-1",
              plan: starterPlan(),
              projectIds: ["project-1", "project-2"],
              projects: [
                {
                  id: "project-1",
                  name: "Production",
                  organizationId: "org-1"
                },
                {
                  id: "project-2",
                  name: "Billing",
                  organizationId: "org-1"
                }
              ],
              role: "owner"
            }
          ]
        }),
        apiKeysClient: {
          async createApiKey() {
            throw new Error("not used");
          },
          async listApiKeys() {
            return {
              apiKeys: [
                {
                  createdAt: "2026-06-18T10:00:00.000Z",
                  id: "key-1",
                  keyPrefix: "atlabc",
                  name: "Production ingest",
                  projectId: "project-2",
                  revoked: false
                }
              ]
            };
          },
          async revokeApiKey() {
            throw new Error("not used");
          }
        },
        config: {
          AUTH_SESSION_COOKIE_NAME: "auditrail_session",
          WEB_API_BASE_URL: "http://localhost:4000"
        },
        cookieStore: {
          delete() {},
          get() {
            return {
              value: JSON.stringify({
                name: "Production ingest",
                organizationId: "org-1",
                projectId: "project-2",
                rawKey: "atlabc_secret"
              })
            };
          }
        } as {
          delete(name: string): void;
          get(name: string): { value: string } | undefined;
        },
        requestHeaders: new Headers({
          host: "localhost:3000"
        })
      }
    );

    expect(result.activeProjectId).toBe("project-2");
    expect(result.activeOrganizationPlan?.id).toBe("starter");
    expect(result.apiKeys).toHaveLength(1);
    expect(result.newApiKey?.rawKey).toBe("atlabc_secret");
    expect(result.ingestCommand).toContain("authorization: Bearer atlabc_secret");
    expect(result.ingestCommand).toContain('"event":"billing.tested"');
  });

  it("ignores a flashed api key from a different organization", async () => {
    const result = await loadWorkspacePage(
      {
        organizationId: "org-2"
      },
      {
        currentUser: createCurrentUser({
          memberships: [
            {
              organization: {
                id: "org-1",
                name: "Acme"
              },
              organizationId: "org-1",
              plan: starterPlan(),
              projectIds: ["project-1", "project-2"],
              projects: [
                {
                  id: "project-1",
                  name: "Production",
                  organizationId: "org-1"
                },
                {
                  id: "project-2",
                  name: "Billing",
                  organizationId: "org-1"
                }
              ],
              role: "owner"
            },
            {
              organization: {
                id: "org-2",
                name: "Beta"
              },
              organizationId: "org-2",
              plan: growthPlan(),
              projectIds: ["project-9"],
              projects: [
                {
                  id: "project-9",
                  name: "Sandbox",
                  organizationId: "org-2"
                }
              ],
              role: "member"
            }
          ]
        }),
        apiKeysClient: {
          async createApiKey() {
            throw new Error("not used");
          },
          async listApiKeys() {
            return {
              apiKeys: []
            };
          },
          async revokeApiKey() {
            throw new Error("not used");
          }
        },
        config: {
          AUTH_SESSION_COOKIE_NAME: "auditrail_session",
          WEB_API_BASE_URL: "http://localhost:4000"
        },
        cookieStore: {
          delete() {},
          get() {
            return {
              value: JSON.stringify({
                name: "Production ingest",
                organizationId: "org-1",
                projectId: "project-2",
                rawKey: "atlabc_secret"
              })
            };
          }
        } as {
          delete(name: string): void;
          get(name: string): { value: string } | undefined;
        },
        requestHeaders: new Headers({
          host: "localhost:3000"
        })
      }
    );

    expect(result.activeOrganizationId).toBe("org-2");
    expect(result.ingestCommand).toContain("authorization: Bearer <YOUR_API_KEY>");
  });
});

describe("loadOrganizationMembersPage", () => {
  it("loads members for the active organization", async () => {
    const result = await loadOrganizationMembersPage(
      {
        organizationId: "org-1"
      },
      {
        currentUser: createCurrentUser({
          memberships: [
            {
              organization: {
                id: "org-1",
                name: "Acme"
              },
              organizationId: "org-1",
              plan: starterPlan(),
              projectIds: ["project-1"],
              projects: [
                {
                  id: "project-1",
                  name: "Production",
                  organizationId: "org-1"
                }
              ],
              role: "owner"
            }
          ]
        }),
        organizationsClient: {
          async changePlan() {
            throw new Error("not used");
          },
          async createOrganization() {
            throw new Error("not used");
          },
          async createProject() {
            throw new Error("not used");
          },
          async listMembers() {
            return {
              members: [
                {
                  email: "user@example.com",
                  id: "user-1",
                  name: "Casey",
                  role: "owner"
                }
              ]
            };
          },
          async listOrganizations() {
            throw new Error("not used");
          },
          async listProjects() {
            throw new Error("not used");
          }
        }
      }
    );

    expect(result.activeOrganizationId).toBe("org-1");
    expect(result.members).toEqual([
      {
        email: "user@example.com",
        id: "user-1",
        name: "Casey",
        role: "owner"
      }
    ]);
  });
});

function createCurrentUser(
  overrides: Partial<{
    memberships: Array<{
      organization: {
        id: string;
        name: string;
      };
      organizationId: string;
      plan: {
        id: "starter" | "growth" | "scale";
        includedEvents: number;
        name: string;
        periodEnd: string;
        periodStart: string;
        remainingEvents: number;
        usedEvents: number;
      };
      projectIds: string[];
      projects: Array<{
        id: string;
        name: string;
        organizationId: string;
      }>;
      role: "owner" | "admin" | "member" | "viewer";
    }>;
  }> = {}
) {
  return {
    memberships: overrides.memberships ?? [],
    user: {
      email: "user@example.com",
      id: "user-1"
    }
  };
}

function starterPlan() {
  return {
    id: "starter" as const,
    includedEvents: 100000,
    name: "Starter",
    periodEnd: "2026-07-01T00:00:00.000Z",
    periodStart: "2026-06-01T00:00:00.000Z",
    remainingEvents: 99999,
    usedEvents: 1
  };
}

function growthPlan() {
  return {
    id: "growth" as const,
    includedEvents: 1000000,
    name: "Growth",
    periodEnd: "2026-07-01T00:00:00.000Z",
    periodStart: "2026-06-01T00:00:00.000Z",
    remainingEvents: 999000,
    usedEvents: 1000
  };
}
