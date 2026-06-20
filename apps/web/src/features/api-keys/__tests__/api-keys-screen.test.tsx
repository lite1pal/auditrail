import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ApiKeysScreen } from "@/src/features/api-keys/components/api-keys-screen";

describe("ApiKeysScreen", () => {
  it("renders the dedicated api keys view with the requested table columns", () => {
    render(
      <ApiKeysScreen
        activeOrganizationId="org-1"
        activeProjectId="project-1"
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
        canManage
        createApiKeyAction={noopAction}
        currentUserEmail="user@example.com"
        newApiKey={{
          name: "Production ingest",
          projectId: "project-1",
          rawKey: "atlabc_secret"
        }}
        organizationName="Acme"
        projectName="Production"
        revokeApiKeyAction={noopRevokeAction}
      />
    );

    expect(screen.getByRole("heading", { name: "API Keys" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Create a new API key" }).getAttribute("href")).toBe(
      "#create-api-key"
    );
    for (const header of [
      "Name",
      "Status",
      "Tracking ID",
      "Secret Key",
      "Created",
      "Last used",
      "Created by",
      "Actions"
    ]) {
      expect(screen.getByRole("columnheader", { name: header })).toBeTruthy();
    }
    expect(screen.getByText("atlabc_secret")).toBeTruthy();
    expect(screen.getByText("user@example.com")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Revoke" })).toBeTruthy();
  });

  it("shows an empty state and disabled create flow without a selected project", () => {
    render(
      <ApiKeysScreen
        apiKeys={[]}
        createApiKeyAction={noopAction}
        currentUserEmail="user@example.com"
        revokeApiKeyAction={noopRevokeAction}
      />
    );

    expect(screen.getByText("No API keys yet for the selected project.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Generate key" }).getAttribute("disabled")).not.toBeNull();
    expect(screen.getByText("Create and select a project before generating a key.")).toBeTruthy();
  });

  it("hides privileged api key actions for non-admin roles", () => {
    render(
      <ApiKeysScreen
        activeOrganizationId="org-1"
        activeProjectId="project-1"
        apiKeys={[
          {
            createdAt: "2026-06-18T10:00:00.000Z",
            id: "key-1",
            keyPrefix: "atlabc",
            name: "Production ingest",
            projectId: "project-1",
            revoked: false
          }
        ]}
        canManage={false}
        createApiKeyAction={noopAction}
        currentUserEmail="user@example.com"
        organizationName="Acme"
        projectName="Production"
        revokeApiKeyAction={noopRevokeAction}
      />
    );

    expect(screen.queryByRole("link", { name: "Create a new API key" })).toBeNull();
    expect(screen.getByRole("button", { name: "Generate key" }).getAttribute("disabled")).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Revoke" })).toBeNull();
    expect(screen.getByText("Only organization owners and admins can create API keys.")).toBeTruthy();
    expect(screen.getByText("No actions")).toBeTruthy();
  });
});

async function noopAction() {}

async function noopRevokeAction() {}
