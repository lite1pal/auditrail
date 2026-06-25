import { describe, expect, it } from "vitest";

import {
  apiKeys,
  auditEvents,
  organizationMonthlyUsage,
  organizations,
  projects
} from "../index.js";

describe("database schema exports", () => {
  it("exports initial tenant and audit tables", () => {
    expect(organizations).toBeDefined();
    expect(projects).toBeDefined();
    expect(apiKeys).toBeDefined();
    expect(auditEvents).toBeDefined();
    expect(organizationMonthlyUsage).toBeDefined();
  });
});
