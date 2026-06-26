import { describe, expect, it, vi } from "vitest";

import {
  createInMemoryAuditEventRepo,
  type AuditEventTenant
} from "../repo.js";

const tenant: AuditEventTenant = {
  organizationId: "org_1",
  projectId: "project_1"
};

describe("in-memory audit event repo", () => {
  it("enqueues audit-event.created jobs after a successful ingest", async () => {
    const enqueuedJobs: Array<{
      name: string;
      payload: unknown;
    }> = [];
    const repo = createInMemoryAuditEventRepo({
      enqueueJob(job) {
        enqueuedJobs.push(job);
      },
      now: sequentialNow(["2026-06-16T12:00:00.000Z"])
    });

    const record = await repo.append(tenant, {
      event: "user.deleted",
      metadata: {}
    });

    expect(enqueuedJobs).toEqual([
      {
        name: "audit-event.created",
        payload: {
          createdAt: record.createdAt,
          eventId: record.id,
          organizationId: tenant.organizationId,
          projectId: tenant.projectId
        }
      }
    ]);
  });

  it("does not persist an event when the enqueue step fails", async () => {
    const repo = createInMemoryAuditEventRepo({
      enqueueJob() {
        throw new Error("enqueue_failed");
      },
      now: sequentialNow(["2026-06-16T12:00:00.000Z"])
    });

    await expect(
      repo.append(tenant, { event: "user.deleted", metadata: {} })
    ).rejects.toThrow("enqueue_failed");
    await expect(
      repo.list(tenant, {
        limit: 10
      })
    ).resolves.toEqual([]);
  });

  it("summarizes top event types with stable tie ordering", async () => {
    const repo = createInMemoryAuditEventRepo({
      now: sequentialNow([
        "2026-06-16T12:00:00.000Z",
        "2026-06-16T12:01:00.000Z",
        "2026-06-16T12:02:00.000Z",
        "2026-06-16T12:03:00.000Z"
      ])
    });

    await repo.append(tenant, { event: "role.changed", metadata: {} });
    await repo.append(tenant, { event: "user.deleted", metadata: {} });
    await repo.append(tenant, { event: "user.deleted", metadata: {} });
    await repo.append(tenant, { event: "user.created", metadata: {} });

    await expect(
      repo.summarize(tenant, {
        top: 2
      })
    ).resolves.toEqual({
      totalEvents: 4,
      topEventTypes: [
        {
          event: "user.deleted",
          count: 2
        },
        {
          event: "role.changed",
          count: 1
        }
      ]
    });
  });

  it("builds hourly and daily timeseries buckets", async () => {
    const repo = createInMemoryAuditEventRepo({
      now: sequentialNow([
        "2026-06-16T12:05:00.000Z",
        "2026-06-16T12:35:00.000Z",
        "2026-06-17T00:10:00.000Z"
      ])
    });

    await repo.append(tenant, { event: "user.created", metadata: {} });
    await repo.append(tenant, { event: "user.deleted", metadata: {} });
    await repo.append(tenant, { event: "role.changed", metadata: {} });

    await expect(
      repo.timeseries(tenant, {
        from: "2026-06-16T00:00:00.000Z",
        to: "2026-06-18T00:00:00.000Z",
        bucket: "hour"
      })
    ).resolves.toEqual([
      {
        bucketStart: "2026-06-16T12:00:00.000Z",
        count: 2
      },
      {
        bucketStart: "2026-06-17T00:00:00.000Z",
        count: 1
      }
    ]);

    await expect(
      repo.timeseries(tenant, {
        from: "2026-06-16T00:00:00.000Z",
        to: "2026-06-18T00:00:00.000Z",
        bucket: "day"
      })
    ).resolves.toEqual([
      {
        bucketStart: "2026-06-16T00:00:00.000Z",
        count: 2
      },
      {
        bucketStart: "2026-06-17T00:00:00.000Z",
        count: 1
      }
    ]);
  });

  it("rolls usage over on a new UTC month", async () => {
    const repo = createInMemoryAuditEventRepo({
      now: sequentialNow([
        "2026-06-30T23:59:59.000Z",
        "2026-07-01T00:00:00.000Z"
      ]),
      planByOrganizationId: {
        [tenant.organizationId]: "starter"
      }
    });

    await expect(
      repo.append(tenant, { event: "user.created", metadata: {} })
    ).resolves.toMatchObject({
      eventType: "user.created"
    });
    await expect(
      repo.append(tenant, { event: "user.deleted", metadata: {} })
    ).resolves.toMatchObject({
      eventType: "user.deleted"
    });
  });

  it("rejects ingests once the plan quota is exhausted", async () => {
    const monthKey = `${tenant.organizationId}:2026-06-01T00:00:00.000Z`;
    const enqueueJob = vi.fn();
    const repo = createInMemoryAuditEventRepo({
      enqueueJob,
      now: sequentialNow(["2026-06-16T12:00:00.000Z"]),
      planByOrganizationId: {
        [tenant.organizationId]: "starter"
      },
      usageByKey: {
        [monthKey]: 100_000
      }
    });

    await expect(
      repo.append(tenant, { event: "user.deleted", metadata: {} })
    ).rejects.toMatchObject({
      message: "event_quota_exceeded",
      plan: expect.objectContaining({
        id: "starter",
        includedEvents: 100_000,
        remainingEvents: 0,
        usedEvents: 100_000
      })
    });
    expect(enqueueJob).not.toHaveBeenCalled();
  });
});

function sequentialNow(values: string[]) {
  let index = 0;

  return () => values[index++] ?? values.at(-1) ?? "2026-06-16T00:00:00.000Z";
}
