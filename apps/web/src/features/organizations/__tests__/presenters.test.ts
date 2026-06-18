import { describe, expect, it } from "vitest";

import { toWorkspaceViewModel } from "@/src/features/organizations/domain/presenters";

describe("toWorkspaceViewModel", () => {
  it("selects the first membership and project as active context", () => {
    const viewModel = toWorkspaceViewModel({
      memberships: [
        {
          organization: {
            id: "org-1",
            name: "Acme"
          },
          organizationId: "org-1",
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
      ],
      user: {
        email: "user@example.com",
        id: "user-1"
      }
    });

    expect(viewModel.activeOrganization?.name).toBe("Acme");
    expect(viewModel.activeProject?.name).toBe("Production");
    expect(viewModel.memberships).toHaveLength(1);
  });

  it("prefers the requested organization and project when present", () => {
    const viewModel = toWorkspaceViewModel(
      {
        memberships: [
          {
            organization: {
              id: "org-1",
              name: "Acme"
            },
            organizationId: "org-1",
            projectIds: ["project-1"],
            projects: [
              {
                id: "project-1",
                name: "Production",
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
            projectIds: ["project-2"],
            projects: [
              {
                id: "project-2",
                name: "Billing",
                organizationId: "org-2"
              }
            ],
            role: "member"
          }
        ],
        user: {
          email: "user@example.com",
          id: "user-1"
        }
      },
      {
        organizationId: "org-2",
        projectId: "project-2"
      }
    );

    expect(viewModel.activeOrganization?.name).toBe("Beta");
    expect(viewModel.activeProject?.name).toBe("Billing");
  });
});
