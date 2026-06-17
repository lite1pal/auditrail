import type { IngestAuditEventInput } from "@auditrail/domain/audit-events";
import { z } from "zod";

import {
  decodeAuditEventCursor,
  encodeAuditEventCursor,
  type AuditEventCursor
} from "./cursor.js";
import type {
  AuditEventListFilters,
  AuditEventRecord,
  AuditEventSummaryFilters,
  AuditEventTimeseriesFilters
} from "./repo.js";

export const listEventsQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(25),
    cursor: z.string().min(1).optional(),
    event: z.string().trim().min(1).optional(),
    actor: z.string().trim().min(1).optional(),
    target: z.string().trim().min(1).optional(),
    events: z.string().trim().min(1).optional(),
    actors: z.string().trim().min(1).optional(),
    targets: z.string().trim().min(1).optional(),
    from: z.string().datetime({ offset: true }).optional(),
    to: z.string().datetime({ offset: true }).optional()
  })
  .refine(
    (query) => {
      if (!query.from || !query.to) {
        return true;
      }

      return query.from <= query.to;
    },
    {
      error: "from_must_be_before_or_equal_to_to",
      path: ["from"]
    }
  );

export const summarizeEventsQuerySchema = z
  .object({
    top: z.coerce.number().int().min(1).max(20).default(5),
    from: z.string().datetime({ offset: true }).optional(),
    to: z.string().datetime({ offset: true }).optional()
  })
  .refine(
    (query) => {
      if (!query.from || !query.to) {
        return true;
      }

      return query.from <= query.to;
    },
    {
      error: "from_must_be_before_or_equal_to_to",
      path: ["from"]
    }
  );

export const timeseriesEventsQuerySchema = z
  .object({
    from: z.string().datetime({ offset: true }),
    to: z.string().datetime({ offset: true }),
    bucket: z.enum(["hour", "day"]).default("hour")
  })
  .refine((query) => query.from <= query.to, {
    error: "from_must_be_before_or_equal_to_to",
    path: ["from"]
  });

export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;
export type SummarizeEventsQuery = z.infer<typeof summarizeEventsQuerySchema>;
export type TimeseriesEventsQuery = z.infer<typeof timeseriesEventsQuerySchema>;
type NormalizableIngestInput = Omit<IngestAuditEventInput, "metadata"> & {
  metadata?: IngestAuditEventInput["metadata"];
};

export function normalizeIngestInput(
  input: NormalizableIngestInput
): IngestAuditEventInput {
  return {
    ...input,
    metadata: input.metadata ?? {}
  };
}

export function assertValidCursor(
  cursor?: string | null
): AuditEventCursor | undefined {
  if (!cursor) {
    return undefined;
  }

  return decodeAuditEventCursor(cursor);
}

export function toListFilters(query: ListEventsQuery): AuditEventListFilters {
  return {
    limit: query.limit + 1,
    cursor: query.cursor,
    eventTypes: mergeFilterValues(query.event, query.events),
    actorIds: mergeFilterValues(query.actor, query.actors),
    targetIds: mergeFilterValues(query.target, query.targets),
    from: query.from,
    to: query.to
  };
}

export function toSummaryFilters(
  query: SummarizeEventsQuery
): AuditEventSummaryFilters {
  return query;
}

export function toTimeseriesFilters(
  query: TimeseriesEventsQuery
): AuditEventTimeseriesFilters {
  return query;
}

export function buildNextCursor(
  events: AuditEventRecord[],
  limit: number
): string | null {
  const hasMore = events.length > limit;
  const pageEvents = hasMore ? events.slice(0, limit) : events;
  const lastEvent = pageEvents.at(-1);

  if (!hasMore || !lastEvent) {
    return null;
  }

  return encodeAuditEventCursor({
    createdAt: lastEvent.createdAt,
    id: lastEvent.id
  });
}

export function slicePageEvents(events: AuditEventRecord[], limit: number) {
  return events.length > limit ? events.slice(0, limit) : events;
}

function splitFilterValues(value?: string): string[] | undefined {
  if (!value) {
    return undefined;
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function mergeFilterValues(
  singleValue?: string,
  multiValue?: string
): string[] | undefined {
  const values = [
    ...(singleValue ? [singleValue] : []),
    ...(splitFilterValues(multiValue) ?? [])
  ];

  if (values.length === 0) {
    return undefined;
  }

  return [...new Set(values)];
}
