import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WorkspaceSettingsScreen } from "@/src/features/organizations/components/workspace-settings-screen";

describe("WorkspaceSettingsScreen", () => {
  it("surfaces the current workspace and a clear next step", () => {
    render(
      <WorkspaceSettingsScreen
        acceptInvitationAction={noopAction}
        activeOrganizationId="org-1"
        activeOrganizationPlan={starterPlan()}
        activeOrganizationRole="owner"
        activeProjectId="project-1"
        changeOrganizationPlanAction={noopAction}
        apiKeys={[
          {
            createdAt: "2026-06-18T10:00:00.000Z",
            id: "key-1",
            keyPrefix: "atlabc",
            lastUsedAt: "2026-06-18T11:00:00.000Z",
            name: "Production ingest",
            projectId: "project-1",
            revoked: false
          }
        ]}
        createApiKeyAction={noopAction}
        createOrganizationAction={noopAction}
        createProjectAction={noopAction}
        ingestCommand="curl -i http://localhost:4000/api/v1/events"
        invitationUrl="http://localhost:3000/settings?invitationToken=invite-1"
        inviteMemberAction={noopAction}
        newApiKey={{
          name: "Production ingest",
          projectId: "project-1",
          rawKey: "atlabc_secret"
        }}
        organizations={[
          {
            id: "org-1",
            name: "Acme"
          }
        ]}
        projects={[
          {
            id: "project-1",
            name: "Production",
            organizationId: "org-1"
          }
        ]}
        revokeApiKeyAction={noopAction}
      />
    );

    expect(
      screen.getByText("Manage organizations, projects, and ingest keys from one place.")
    ).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Settings sections" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Workspace/i }).getAttribute("href")).toBe(
      "#workspace-settings"
    );
    expect(screen.getByRole("link", { name: /Plan & usage/i }).getAttribute("href")).toBe(
      "#plan-settings"
    );
    expect(screen.getByRole("link", { name: /Access/i }).getAttribute("href")).toBe(
      "#access-settings"
    );
    expect(screen.getByRole("link", { name: /Projects/i }).getAttribute("href")).toBe(
      "#project-settings"
    );
    expect(screen.getByText("Workspace snapshot")).toBeTruthy();
    expect(screen.getByText("Selected project: Production")).toBeTruthy();
    expect(screen.getByText("Used this month")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Starter selected" })).toBeTruthy();
    expect(screen.getByText("Invitation link")).toBeTruthy();
    expect(screen.getByText("Selected")).toBeTruthy();
  });

  it("shows empty-state guidance when no project is selected", () => {
    render(
      <WorkspaceSettingsScreen
        acceptInvitationAction={noopAction}
        activeOrganizationId="org-1"
        activeOrganizationPlan={starterPlan()}
        activeOrganizationRole="owner"
        apiKeys={[]}
        changeOrganizationPlanAction={noopAction}
        createApiKeyAction={noopAction}
        createOrganizationAction={noopAction}
        createProjectAction={noopAction}
        inviteMemberAction={noopAction}
        organizations={[
          {
            id: "org-1",
            name: "Acme"
          }
        ]}
        projects={[]}
        revokeApiKeyAction={noopAction}
      />
    );

    expect(screen.getByText("No projects yet. Create one to generate keys and start collecting events.")).toBeTruthy();
    expect(
      screen.getByText("Create an invitation to generate a shareable join link for this organization.")
    ).toBeTruthy();
    expect(screen.getByText("Needs a project")).toBeTruthy();
  });

  it("hides restricted settings actions behind disabled forms for non-admin roles", () => {
    render(
      <WorkspaceSettingsScreen
        acceptInvitationAction={noopAction}
        activeOrganizationId="org-1"
        activeOrganizationPlan={starterPlan()}
        activeOrganizationRole="viewer"
        apiKeys={[]}
        changeOrganizationPlanAction={noopAction}
        createApiKeyAction={noopAction}
        createOrganizationAction={noopAction}
        createProjectAction={noopAction}
        inviteMemberAction={noopAction}
        organizations={[
          {
            id: "org-1",
            name: "Acme"
          }
        ]}
        projects={[]}
        revokeApiKeyAction={noopAction}
      />
    );

    expect(screen.getByRole("button", { name: "Create project" }).getAttribute("disabled")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Create invitation" }).getAttribute("disabled")).not.toBeNull();
    expect(screen.getByText("Only organization owners and admins can create projects.")).toBeTruthy();
    expect(screen.getByText("Only organization owners and admins can invite members.")).toBeTruthy();
    expect(screen.getByText("Only organization owners and admins can change plans.")).toBeTruthy();
  });

  it("falls back to the root dashboard link when no organization is selected", () => {
    render(
      <WorkspaceSettingsScreen
        acceptInvitationAction={noopAction}
        apiKeys={[]}
        changeOrganizationPlanAction={noopAction}
        createApiKeyAction={noopAction}
        createOrganizationAction={noopAction}
        createProjectAction={noopAction}
        inviteMemberAction={noopAction}
        organizations={[]}
        projects={[]}
        revokeApiKeyAction={noopAction}
      />
    );

    expect(screen.getByRole("link", { name: "Open dashboard" }).getAttribute("href")).toBe("/");
    expect(screen.getByText("No organization selected")).toBeTruthy();
    expect(
      screen.getByText("Select an organization to review its current plan and monthly event usage.")
    ).toBeTruthy();
  });
});

async function noopAction() {}

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
