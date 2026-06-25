import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OnboardingScreen } from "@/src/features/onboarding/components/onboarding-screen";

describe("OnboardingScreen", () => {
  it("renders the no-organization state", () => {
    render(<OnboardingScreen updateOnboardingStateAction={noopAction} />);

    expect(screen.getByRole("heading", { name: "Getting started" })).toBeTruthy();
    expect(screen.getByText(/No organization is available yet/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Open settings" }).getAttribute("href")).toBe(
      "/settings"
    );
  });

  it("renders checklist items, cta links, and the ingest command", () => {
    render(
      <OnboardingScreen
        activeOnboarding={{
          completedRequiredSteps: 1,
          isComplete: false,
          isDismissed: false,
          steps: [
            {
              completedAt: "2026-06-25T10:00:00.000Z",
              id: "project_created",
              required: true,
              status: "complete"
            },
            {
              id: "api_key_created",
              required: true,
              status: "pending"
            },
            {
              id: "first_event_ingested",
              required: true,
              status: "pending"
            },
            {
              id: "member_invited",
              required: false,
              status: "pending"
            }
          ],
          totalRequiredSteps: 3
        }}
        activeOrganizationId="org-1"
        activeOrganizationName="Acme"
        activeProjectId="project-1"
        activeProjectName="Production"
        ingestCommand={"curl https://api.example.com"}
        updateOnboardingStateAction={noopAction}
      />
    );

    expect(screen.getByText("1 / 3 required")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Create first project" }).getAttribute("href")).toBe(
      "/settings?organizationId=org-1#project-settings"
    );
    expect(screen.getByRole("link", { name: "Create first API key" }).getAttribute("href")).toBe(
      "/api-keys?organizationId=org-1&projectId=project-1"
    );
    expect(screen.getByRole("link", { name: "Send first event" }).getAttribute("href")).toBe(
      "/settings?organizationId=org-1&projectId=project-1"
    );
    expect(screen.getByRole("link", { name: "Invite teammate" }).getAttribute("href")).toBe(
      "/settings?organizationId=org-1#access-settings"
    );
    expect(screen.getByText("curl https://api.example.com")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Dismiss from sidebar" })).toBeTruthy();
  });
});

async function noopAction() {}
