import { describe, expect, it } from "vitest";

import { ingestAuditEventSchema } from "../src/audit-events/index.js";

describe("audit event schemas", () => {
  it("accepts the MVP ingestion shape", () => {
    expect(
      ingestAuditEventSchema.parse({
        event: "user.deleted",
        actor: "admin_123",
        target: "user_456",
        metadata: {
          reason: "GDPR request"
        }
      })
    ).toEqual({
      event: "user.deleted",
      actor: "admin_123",
      target: "user_456",
      metadata: {
        reason: "GDPR request"
      }
    });
  });

  it("defaults metadata to an empty object", () => {
    expect(
      ingestAuditEventSchema.parse({
        event: "login.succeeded"
      })
    ).toEqual({
      event: "login.succeeded",
      metadata: {}
    });
  });

  it("rejects blank event names", () => {
    expect(() =>
      ingestAuditEventSchema.parse({
        event: " "
      })
    ).toThrow();
  });
});
