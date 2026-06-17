import { describe, expect, it } from "vitest";

import { createInMemoryAuditEventRepo } from "../src/modules/audit-events/repo.js";
import {
  assertValidCursor,
  buildNextCursor,
  normalizeIngestInput,
  slicePageEvents,
  toListFilters
} from "../src/modules/audit-events/query.js";

describe("audit event query helpers", () => {
  it("normalizes missing metadata to an empty object", () => {
    expect(
      normalizeIngestInput({
        event: "user.deleted"
      })
    ).toEqual({
      event: "user.deleted",
      metadata: {}
    });
  });

  it("builds merged list filters and expands the limit", () => {
    expect(
      toListFilters({
        limit: 2,
        cursor: undefined,
        event: "user.deleted",
        actor: undefined,
        target: undefined,
        events: "user.deleted,role.changed",
        actors: "admin_123,service_456",
        targets: undefined,
        from: undefined,
        to: undefined
      })
    ).toEqual({
      limit: 3,
      cursor: undefined,
      eventTypes: ["user.deleted", "role.changed"],
      actorIds: ["admin_123", "service_456"],
      targetIds: undefined,
      from: undefined,
      to: undefined
    });
  });

  it("slices page events and builds the next cursor", async () => {
    const repo = createInMemoryAuditEventRepo({
      now: sequentialNow([
        "2026-06-16T12:00:00.000Z",
        "2026-06-16T12:05:00.000Z",
        "2026-06-16T12:10:00.000Z"
      ])
    });
    const tenant = {
      organizationId: "org_1",
      projectId: "project_1"
    };

    await repo.append(tenant, { event: "a", metadata: {} });
    await repo.append(tenant, { event: "b", metadata: {} });
    await repo.append(tenant, { event: "c", metadata: {} });

    const events = await repo.list(tenant, { limit: 3 });

    expect(slicePageEvents(events, 2)).toHaveLength(2);
    expect(assertValidCursor(buildNextCursor(events, 2))).toMatchObject({
      createdAt: "2026-06-16T12:05:00.000Z"
    });
  });
});

function sequentialNow(values: string[]) {
  let index = 0;

  return () => values[index++] ?? values.at(-1) ?? "2026-06-16T00:00:00.000Z";
}
