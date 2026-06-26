import type { ProductDefinition } from "../product/index.js";

import { auditOnboardingSteps } from "./onboarding.js";

export const auditTrailProduct = {
  emptyStateCopy: {
    emptyStateDescription:
      "AuditTrail-specific empty-state copy will move here in a later task.",
    emptyStateTitle: "AuditTrail product definition placeholder"
  },
  id: "audit-events",
  name: "AuditTrail",
  navItems: [],
  onboardingSteps: auditOnboardingSteps,
  usageMeters: [
    {
      key: "events",
      label: "Events"
    }
  ]
} satisfies ProductDefinition;
