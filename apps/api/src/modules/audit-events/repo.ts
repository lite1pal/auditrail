import type { IngestAuditEventInput } from "@auditrail/domain/audit-events";
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

export interface InMemoryAuditEventRepoOptions {
  now?: () => string;
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
}

export function createInMemoryAuditEventRepo(
  options: InMemoryAuditEventRepoOptions = {}
): AuditEventRepo {
  const events: AuditEventRecord[] = [];
  const now = options.now ?? (() => new Date().toISOString());

  return {
    async append(_tenant, input) {
      const record = {
        id: randomUUID(),
        eventType: input.event,
        actorId: input.actor,
        targetId: input.target,
        metadata: input.metadata,
        createdAt: now()
      };

      events.push(record);

      return record;
    },
    async list(_tenant, filters) {
      return [...events]
        .filter((event) => {
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
        })
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
        .slice(0, filters.limit);
    }
  };
}

function compareAuditEventsDesc(left: AuditEventRecord, right: AuditEventRecord) {
  if (left.createdAt === right.createdAt) {
    return right.id.localeCompare(left.id);
  }

  return right.createdAt.localeCompare(left.createdAt);
}
