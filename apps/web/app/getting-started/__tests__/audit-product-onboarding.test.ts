import { describe, expect, it } from "vitest";

import {
  buildAuditTrailOnboardingStepViews,
  getAuditTrailOnboardingScreenCopy
} from "@/app/getting-started/audit-product-onboarding";

describe("audit product onboarding adapter", () => {
  it("builds screen copy from the audit-owned product definition", () => {
    expect(getAuditTrailOnboardingScreenCopy()).toMatchObject({
      title: "Getting started",
      eyebrow: "Workspace setup",
      emptyStatePrimaryCtaHref: "/settings",
      emptyStatePrimaryCtaLabel: "Open settings"
    });
  });

  it("builds project-aware step views and fallback CTA targets", () => {
    expect(
      buildAuditTrailOnboardingStepViews({
        activeOnboarding: {
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
        },
        activeOrganizationId: "org-1",
        activeProjectId: "project-1"
      })
    ).toMatchObject([
      {
        ctaHref: "/settings?organizationId=org-1#project-settings",
        ctaLabel: "Create first project",
        title: "Create a project"
      },
      {
        ctaHref: "/api-keys?organizationId=org-1&projectId=project-1",
        ctaLabel: "Create first API key",
        title: "Create an API key"
      },
      {
        ctaHref: "/settings?organizationId=org-1&projectId=project-1",
        ctaLabel: "Send first event",
        showsIngestCommand: true,
        title: "Send the first event"
      },
      {
        ctaHref: "/settings?organizationId=org-1#access-settings",
        ctaLabel: "Invite teammate",
        title: "Invite a teammate"
      }
    ]);

    expect(
      buildAuditTrailOnboardingStepViews({
        activeOnboarding: {
          completedRequiredSteps: 0,
          isComplete: false,
          isDismissed: false,
          steps: [
            {
              id: "api_key_created",
              required: true,
              status: "pending"
            },
            {
              id: "first_event_ingested",
              required: true,
              status: "pending"
            }
          ],
          totalRequiredSteps: 2
        },
        activeOrganizationId: "org-1"
      })
    ).toMatchObject([
      {
        ctaHref: "/settings?organizationId=org-1#project-settings",
        ctaLabel: "Create a project first"
      },
      {
        ctaHref: "/settings?organizationId=org-1#project-settings",
        ctaLabel: "Create a project first"
      }
    ]);
  });
});
