import { describe, expect, it } from "vitest";

import {
  apiKeys,
  auditEvents,
  jobOutbox,
  organizationMonthlyUsage,
  userOrganizationOnboardingStates,
  organizations,
  projects
} from "../index.js";

describe("database schema exports", () => {
  it("exports initial tenant and audit tables", () => {
    expect(organizations).toBeDefined();
    expect(projects).toBeDefined();
    expect(apiKeys).toBeDefined();
    expect(auditEvents).toBeDefined();
    expect(jobOutbox).toBeDefined();
    expect(organizationMonthlyUsage).toBeDefined();
    expect(userOrganizationOnboardingStates).toBeDefined();
  });
});
