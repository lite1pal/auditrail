import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WorkspaceSidebarSwitcher } from "@/src/features/organizations/components/workspace-sidebar-switcher";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/settings",
  useRouter: () => ({
    push
  })
}));

const memberships = [
  {
    organization: {
      id: "org-1",
      name: "Acme"
    },
    organizationId: "org-1",
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
    role: "owner" as const
  },
  {
    organization: {
      id: "org-2",
      name: "Beta"
    },
    organizationId: "org-2",
    projectIds: ["project-3"],
    projects: [
      {
        id: "project-3",
        name: "Warehouse",
        organizationId: "org-2"
      }
    ],
    role: "member" as const
  }
];

describe("WorkspaceSidebarSwitcher", () => {
  beforeEach(() => {
    push.mockReset();
  });

  it("pushes the current route immediately when the organization changes", async () => {
    const user = userEvent.setup();

    render(
      <WorkspaceSidebarSwitcher
        activeOrganizationId="org-1"
        activeProjectId="project-1"
        memberships={memberships}
      />
    );

    await user.selectOptions(screen.getByLabelText("Organization"), "org-2");

    expect(push).toHaveBeenCalledWith("/settings?organizationId=org-2&projectId=project-3");
  });

  it("uses a manually selected project in the pushed route", async () => {
    const user = userEvent.setup();

    render(
      <WorkspaceSidebarSwitcher
        activeOrganizationId="org-1"
        activeProjectId="project-1"
        memberships={memberships}
      />
    );

    await user.selectOptions(screen.getByLabelText("Project"), "project-2");

    expect(push).toHaveBeenCalledWith("/settings?organizationId=org-1&projectId=project-2");
  });

  it("syncs the visible selection when the active workspace props change", () => {
    const { rerender } = render(
      <WorkspaceSidebarSwitcher
        activeOrganizationId="org-1"
        activeProjectId="project-1"
        memberships={memberships}
      />
    );

    rerender(
      <WorkspaceSidebarSwitcher
        activeOrganizationId="org-2"
        activeProjectId="project-3"
        memberships={memberships}
      />
    );

    expect((screen.getByLabelText("Organization") as HTMLSelectElement).value).toBe("org-2");
    expect((screen.getByLabelText("Project") as HTMLSelectElement).value).toBe("project-3");
  });

  it("disables the controls when no organization can be selected", () => {
    render(
      <WorkspaceSidebarSwitcher
        activeOrganizationId=""
        activeProjectId=""
        memberships={[]}
      />
    );

    expect(screen.getByLabelText("Organization").getAttribute("disabled")).not.toBeNull();
    expect(screen.getByLabelText("Project").getAttribute("disabled")).not.toBeNull();
  });
});
