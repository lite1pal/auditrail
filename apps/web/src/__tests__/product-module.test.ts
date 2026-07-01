import { describe, expect, it } from "vitest";

import {
  buildOnboardingStepViews,
  createWebProductRuntime,
  getOnboardingScreenCopy,
  getProductErrorHeading,
  getProductLoadingLabel,
  getProductMetadata,
  getShellProductConfig,
  getWorkspaceSettingsProductCopy
} from "@/app/product-module";

describe("app product module", () => {
  it("exposes metadata and chrome copy from the AuditTrail product module", () => {
    expect(getProductMetadata()).toEqual({
      description: "AuditTrail event monitoring workspace",
      title: "AuditTrail"
    });
    expect(getProductLoadingLabel()).toBe("Loading AuditTrail...");
    expect(getProductErrorHeading()).toBe("Unable to load AuditTrail");
    expect(getProductMetadata("projects")).toEqual({
      description: "Projects workspace for teams building inside Elioric",
      title: "Projects"
    });
  });

  it("builds shell navigation and onboarding views from one product boundary", () => {
    expect(
      getShellProductConfig({
        activeOrganizationId: "org-1",
        activeProjectId: "project-1",
        installedProducts: [
          {
            enabled: true,
            productId: "audit-events"
          }
        ],
        preferredProductId: "audit-events"
      })
    ).toEqual({
      activeProductId: "audit-events",
      availableProducts: [
        {
          href: "/?organizationId=org-1&projectId=project-1",
          id: "audit-events",
          isActive: true,
          label: "AuditTrail"
        }
      ],
      navItems: [
        {
          href: "/?organizationId=org-1&projectId=project-1",
          id: "events",
          label: "Events"
        }
      ],
      productName: "AuditTrail"
    });

    expect(getOnboardingScreenCopy()).toMatchObject({
      title: "Getting started",
      eyebrow: "Workspace setup"
    });

    expect(
      buildOnboardingStepViews({
        activeOnboarding: {
          completedRequiredSteps: 0,
          isComplete: false,
          isDismissed: false,
          steps: [
            {
              id: "api_key_created",
              required: true,
              status: "pending"
            }
          ],
          totalRequiredSteps: 1
        },
        activeOrganizationId: "org-1"
      })
    ).toMatchObject([
      {
        ctaHref: "/settings?organizationId=org-1#project-settings",
        ctaLabel: "Create a project first"
      }
    ]);
  });

  it("exposes workspace settings copy from the same product boundary", () => {
    expect(getWorkspaceSettingsProductCopy()).toMatchObject({
      planUsage: {
        navLabel: "Plan & usage",
        sectionTitle: "Plan & usage"
      }
    });
    expect(getWorkspaceSettingsProductCopy("projects")).toMatchObject({
      planUsage: {
        navLabel: "Projects usage",
        sectionTitle: "Projects plan & usage"
      }
    });
  });

  it("can resolve the built-in projects product when it is installed", () => {
    expect(
      getShellProductConfig({
        activeOrganizationId: "org-1",
        installedProducts: [
          {
            enabled: true,
            productId: "audit-events"
          },
          {
            enabled: true,
            productId: "projects"
          }
        ],
        preferredProductId: "projects"
      })
    ).toEqual({
      activeProductId: "projects",
      availableProducts: [
        {
          href: "/?organizationId=org-1",
          id: "audit-events",
          isActive: false,
          label: "AuditTrail"
        },
        {
          href: "/projects?organizationId=org-1",
          id: "projects",
          isActive: true,
          label: "Projects"
        }
      ],
      navItems: [
        {
          href: "/projects?organizationId=org-1",
          id: "projects-home",
          label: "Projects"
        }
      ],
      productName: "Projects"
    });
    expect(
      buildOnboardingStepViews({
        activeOnboarding: {
          completedRequiredSteps: 0,
          isComplete: true,
          isDismissed: false,
          steps: [],
          totalRequiredSteps: 0
        },
        activeOrganizationId: "org-1",
        productId: "projects"
      })
    ).toEqual([]);
  });

  it("can resolve multiple installed products through the shell runtime", () => {
    const runtime = createWebProductRuntime([
      {
        buildOnboardingStepViews() {
          return [];
        },
        getChrome() {
          return {
            errorHeading: "Alpha error",
            loadingLabel: "Loading Alpha...",
            metadataDescription: "Alpha desc",
            metadataTitle: "Alpha"
          };
        },
        getOnboardingScreenCopy() {
          return {
            completeSummaryDescription: "done",
            dismissFromSidebarLabel: "dismiss",
            emptyStateDescription: "empty",
            emptyStatePrimaryCtaHref: "/alpha",
            emptyStatePrimaryCtaLabel: "Open Alpha",
            eyebrow: "Alpha",
            incompleteSummaryDescription: "todo",
            showInSidebarLabel: "show",
            title: "Alpha setup"
          };
        },
        getRuntimeRegistrations() {
          return [];
        },
        getShellProductConfig(input) {
          const suffix = input.activeOrganizationId
            ? `?organizationId=${input.activeOrganizationId}`
            : "";

          return {
            navItems: [
              {
                href: `/alpha${suffix}`,
                id: "alpha-home",
                label: "Alpha Home"
              }
            ],
            productName: "Alpha Product"
          };
        },
        getWorkspaceSettingsCopy() {
          return {
            planUsage: {
              emptyStateDescription: "Alpha empty",
              metrics: {
                currentPlan: "Current plan",
                includedUnits: "Included",
                remainingUnits: "Remaining",
                usedThisMonth: "Used"
              },
              navDescription: "Alpha nav",
              navLabel: "Alpha usage",
              noPermissionDescription: "No permission",
              resetDatePrefix: "Resets",
              sectionTitle: "Alpha usage",
              selectedPlanSuffix: "selected",
              sectionDescription: "Alpha section",
              switchToPlanPrefix: "Switch to",
              usageWindowPrefix: "Usage window"
            }
          };
        },
        manifest: {
          ...createTestManifest("alpha-product", "Alpha Product")
        }
      },
      {
        buildOnboardingStepViews() {
          return [];
        },
        getChrome() {
          return {
            errorHeading: "Beta error",
            loadingLabel: "Loading Beta...",
            metadataDescription: "Beta desc",
            metadataTitle: "Beta"
          };
        },
        getOnboardingScreenCopy() {
          return {
            completeSummaryDescription: "done",
            dismissFromSidebarLabel: "dismiss",
            emptyStateDescription: "empty",
            emptyStatePrimaryCtaHref: "/beta",
            emptyStatePrimaryCtaLabel: "Open Beta",
            eyebrow: "Beta",
            incompleteSummaryDescription: "todo",
            showInSidebarLabel: "show",
            title: "Beta setup"
          };
        },
        getRuntimeRegistrations() {
          return [];
        },
        getShellProductConfig(input) {
          const suffix = input.activeOrganizationId
            ? `?organizationId=${input.activeOrganizationId}`
            : "";

          return {
            navItems: [
              {
                href: `/beta${suffix}`,
                id: "beta-home",
                label: "Beta Home"
              }
            ],
            productName: "Beta Product"
          };
        },
        getWorkspaceSettingsCopy() {
          return {
            planUsage: {
              emptyStateDescription: "Beta empty",
              metrics: {
                currentPlan: "Current plan",
                includedUnits: "Included",
                remainingUnits: "Remaining",
                usedThisMonth: "Used"
              },
              navDescription: "Beta nav",
              navLabel: "Beta usage",
              noPermissionDescription: "No permission",
              resetDatePrefix: "Resets",
              sectionTitle: "Beta usage",
              selectedPlanSuffix: "selected",
              sectionDescription: "Beta section",
              switchToPlanPrefix: "Switch to",
              usageWindowPrefix: "Usage window"
            }
          };
        },
        manifest: {
          ...createTestManifest("beta-product", "Beta Product")
        }
      }
    ]);

    expect(
      runtime.getShellProductConfig({
        activeOrganizationId: "org-1",
        installedProducts: [
          {
            enabled: true,
            productId: "alpha-product"
          },
          {
            enabled: true,
            productId: "beta-product"
          }
        ],
        preferredProductId: "beta-product"
      })
    ).toEqual({
      activeProductId: "beta-product",
      availableProducts: [
        {
          href: "/alpha?organizationId=org-1",
          id: "alpha-product",
          isActive: false,
          label: "Alpha Product"
        },
        {
          href: "/beta?organizationId=org-1",
          id: "beta-product",
          isActive: true,
          label: "Beta Product"
        }
      ],
      navItems: [
        {
          href: "/beta?organizationId=org-1",
          id: "beta-home",
          label: "Beta Home"
        }
      ],
      productName: "Beta Product"
    });
  });
});

function createTestManifest(id: string, name: string) {
  return {
    capabilities: [],
    emptyStateCopy: {
      emptyStateDescription: `${name} empty`,
      emptyStateTitle: `${name} title`
    },
    id,
    name,
    navItems: [],
    onboardingContent: {
      completeSummaryDescription: "done",
      dismissFromSidebarLabel: "dismiss",
      eyebrow: "Setup",
      incompleteSummaryDescription: "todo",
      showInSidebarLabel: "show",
      stepContent: [],
      title: `${name} setup`
    },
    onboardingSteps: [],
    resources: [],
    runtime: {
      registrations: []
    },
    usageMeters: []
  } as const;
}
