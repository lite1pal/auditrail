import { describe, expect, it } from "vitest";

import { productDefinitionSchema } from "../index.js";

describe("productDefinitionSchema", () => {
  it("accepts a generic product definition with reusable onboarding steps", () => {
    expect(
      productDefinitionSchema.parse({
        emptyStateCopy: {
          emptyStateDescription: "Start by connecting your first resource.",
          emptyStateTitle: "No data yet",
          primaryCtaHref: "/setup",
          primaryCtaLabel: "Get started"
        },
        id: "example-product",
        name: "Example Product",
        navItems: [
          {
            href: "/overview",
            id: "overview",
            label: "Overview"
          }
        ],
        onboardingSteps: [
          {
            id: "workspace_created",
            required: true
          }
        ],
        usageMeters: [
          {
            key: "events",
            label: "Events"
          }
        ]
      })
    ).toMatchObject({
      id: "example-product",
      onboardingSteps: [{ id: "workspace_created", required: true }]
    });
  });

  it("rejects blank identifiers in boundary-facing product config", () => {
    expect(() =>
      productDefinitionSchema.parse({
        emptyStateCopy: {
          emptyStateDescription: "Has description",
          emptyStateTitle: "Has title"
        },
        id: " ",
        name: "Example Product",
        navItems: [],
        onboardingSteps: [],
        usageMeters: []
      })
    ).toThrow();
  });
});
