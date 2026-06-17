import { describe, expect, it } from "vitest";

import { createCurrentUserContextService } from "../context.js";

describe("createCurrentUserContextService", () => {
  it("loads memberships for the current user", async () => {
    const service = createCurrentUserContextService({
      async listUserMembershipContexts(userId) {
        expect(userId).toBe("user-1");

        return [
          {
            membership: {
              id: "membership-1",
              organizationId: "org-1",
              role: "owner",
              userId
            },
            organization: {
              id: "org-1",
              name: "Acme"
            },
            projects: [
              {
                id: "project-1",
                name: "Production",
                organizationId: "org-1"
              }
            ]
          }
        ];
      }
    });

    await expect(
      service.getCurrentUserContext({
        email: "user@example.com",
        id: "user-1"
      })
    ).resolves.toMatchObject({
      memberships: [
        {
          organization: {
            name: "Acme"
          }
        }
      ]
    });
  });
});
