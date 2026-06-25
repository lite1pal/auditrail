import { type IngestAuditEventInput } from "@auditrail/domain/audit-events";
import {
  getUtcMonthWindow,
  summarizePricingUsage
} from "@auditrail/domain/pricing";
import type {
  PricingPlanId,
  PricingUsageSummary
} from "@auditrail/domain/pricing";
import { randomUUID } from "node:crypto";

import { decodeAuditEventCursor } from "./cursor.js";

export interface AuditEventRecord {
  id: string;
  eventType: string;
  actorId?: string;
  targetId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

interface StoredAuditEventRecord extends AuditEventRecord {
  organizationId: string;
  projectId: string;
}

export interface AuditEventTenant {
  organizationId: string;
  projectId: string;
}

export interface AuditEventListFilters {
  limit: number;
  cursor?: string;
  eventTypes?: string[];
  actorIds?: string[];
  targetIds?: string[];
  from?: string;
  to?: string;
}

export interface AuditEventSummaryFilters {
  from?: string;
  to?: string;
  top: number;
}

export interface AuditEventSummary {
  totalEvents: number;
  topEventTypes: Array<{
    event: string;
    count: number;
  }>;
}

export interface AuditEventTimeseriesFilters {
  from: string;
  to: string;
  bucket: "hour" | "day";
}

export interface AuditEventTimeseriesPoint {
  bucketStart: string;
  count: number;
}

export interface InMemoryAuditEventRepoOptions {
  now?: () => string;
  planByOrganizationId?: Record<string, PricingPlanId>;
  usageByKey?: Record<string, number>;
}

export interface AuditEventRepo {
  append(
    tenant: AuditEventTenant,
    input: IngestAuditEventInput
  ): Promise<AuditEventRecord>;
  list(
    tenant: AuditEventTenant,
    filters: AuditEventListFilters
  ): Promise<AuditEventRecord[]>;
  summarize(
    tenant: AuditEventTenant,
    filters: AuditEventSummaryFilters
  ): Promise<AuditEventSummary>;
  timeseries(
    tenant: AuditEventTenant,
    filters: AuditEventTimeseriesFilters
  ): Promise<AuditEventTimeseriesPoint[]>;
}

export class EventQuotaExceededError extends Error {
  readonly plan: PricingUsageSummary;

  constructor(plan: PricingUsageSummary) {
    super("event_quota_exceeded");
    this.name = "EventQuotaExceededError";
    this.plan = plan;
  }
}

export function createInMemoryAuditEventRepo(
  options: InMemoryAuditEventRepoOptions = {}
): AuditEventRepo {
  const events: StoredAuditEventRecord[] = [];
  const now = options.now ?? (() => new Date().toISOString());
  const organizationPlans = new Map<string, PricingPlanId>(
    Object.entries(options.planByOrganizationId ?? {})
  );
  const monthlyUsage = new Map<string, number>(Object.entries(options.usageByKey ?? {}));

  return {
    async append(tenant, input) {
      const currentTime = new Date(now());
      const window = getUtcMonthWindow(currentTime);
      const usageKey = `${tenant.organizationId}:${window.periodStart}`;
      const usedEvents = monthlyUsage.get(usageKey) ?? 0;
      const plan = summarizePricingUsage({
        now: currentTime,
        planId: organizationPlans.get(tenant.organizationId) ?? "starter",
        usedEvents
      });

      if (plan.remainingEvents <= 0) {
        throw new EventQuotaExceededError(plan);
      }

      const record = {
        id: randomUUID(),
        organizationId: tenant.organizationId,
        projectId: tenant.projectId,
        eventType: input.event,
        actorId: input.actor,
        targetId: input.target,
        metadata: input.metadata,
        createdAt: currentTime.toISOString()
      };

      events.push(record);
      monthlyUsage.set(usageKey, usedEvents + 1);

      return record;
    },
    async list(tenant, filters) {
      return [...events]
        .filter((event) => matchesTenant(event, tenant))
        .filter((event) => matchesEventFilters(event, filters))
        .sort(compareAuditEventsDesc)
        .filter((event) => {
          if (!filters.cursor) {
            return true;
          }

          const cursor = decodeAuditEventCursor(filters.cursor);

          if (event.createdAt < cursor.createdAt) {
            return true;
          }

          if (event.createdAt > cursor.createdAt) {
            return false;
          }

          return event.id < cursor.id;
        })
        .slice(0, filters.limit)
        .map(toAuditEventRecord);
    },
    async summarize(tenant, filters) {
      const filteredEvents = events
        .filter((event) => matchesTenant(event, tenant))
        .filter((event) => matchesEventFilters(event, filters));
      const eventCounts = new Map<string, number>();

      for (const event of filteredEvents) {
        eventCounts.set(event.eventType, (eventCounts.get(event.eventType) ?? 0) + 1);
      }

      return {
        totalEvents: filteredEvents.length,
        topEventTypes: [...eventCounts.entries()]
          .map(([event, count]) => ({
            event,
            count
          }))
          .sort((left, right) => {
            if (left.count === right.count) {
              return left.event.localeCompare(right.event);
            }

            return right.count - left.count;
          })
          .slice(0, filters.top)
      };
    },
    async timeseries(tenant, filters) {
      const filteredEvents = events
        .filter((event) => matchesTenant(event, tenant))
        .filter((event) => matchesEventFilters(event, filters));
      const counts = new Map<string, number>();

      for (const event of filteredEvents) {
        const bucketStart = truncateIsoDate(event.createdAt, filters.bucket);
        counts.set(bucketStart, (counts.get(bucketStart) ?? 0) + 1);
      }

      return [...counts.entries()]
        .map(([bucketStart, count]) => ({
          bucketStart,
          count
        }))
        .sort((left, right) => left.bucketStart.localeCompare(right.bucketStart));
    }
  };
}

function compareAuditEventsDesc(left: AuditEventRecord, right: AuditEventRecord) {
  if (left.createdAt === right.createdAt) {
    return right.id.localeCompare(left.id);
  }

  return right.createdAt.localeCompare(left.createdAt);
}

function toAuditEventRecord(event: StoredAuditEventRecord): AuditEventRecord {
  return {
    actorId: event.actorId,
    createdAt: event.createdAt,
    eventType: event.eventType,
    id: event.id,
    metadata: event.metadata,
    targetId: event.targetId
  };
}

function matchesTenant(
  event: StoredAuditEventRecord,
  tenant: AuditEventTenant
) {
  return (
    event.organizationId === tenant.organizationId &&
    event.projectId === tenant.projectId
  );
}

function matchesEventFilters(
  event: AuditEventRecord,
  filters: {
    eventTypes?: string[];
    actorIds?: string[];
    targetIds?: string[];
    from?: string;
    to?: string;
  }
) {
  if (
    filters.eventTypes &&
    filters.eventTypes.length > 0 &&
    !filters.eventTypes.includes(event.eventType)
  ) {
    return false;
  }

  if (
    filters.actorIds &&
    filters.actorIds.length > 0 &&
    !filters.actorIds.includes(event.actorId ?? "")
  ) {
    return false;
  }

  if (
    filters.targetIds &&
    filters.targetIds.length > 0 &&
    !filters.targetIds.includes(event.targetId ?? "")
  ) {
    return false;
  }

  if (filters.from && event.createdAt < filters.from) {
    return false;
  }

  if (filters.to && event.createdAt > filters.to) {
    return false;
  }

  return true;
}

function truncateIsoDate(
  isoDate: string,
  bucket: AuditEventTimeseriesFilters["bucket"]
) {
  const date = new Date(isoDate);

  if (bucket === "day") {
    date.setUTCHours(0, 0, 0, 0);
  } else {
    date.setUTCMinutes(0, 0, 0);
  }

  return date.toISOString();
}
