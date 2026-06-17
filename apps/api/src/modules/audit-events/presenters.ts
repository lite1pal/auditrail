import type {
  AuditEventRecord,
  AuditEventSummary,
  AuditEventTimeseriesPoint
} from "./repo.js";
import { buildNextCursor, slicePageEvents } from "./query.js";

export function toAcceptedResponse(event: AuditEventRecord) {
  return {
    id: event.id,
    event: event.eventType,
    accepted: true
  };
}

export function toEventListResponse(events: AuditEventRecord[], limit: number) {
  const pageEvents = slicePageEvents(events, limit);

  return {
    events: pageEvents.map((event) => ({
      id: event.id,
      event: event.eventType,
      actor: event.actorId,
      target: event.targetId,
      metadata: event.metadata,
      createdAt: event.createdAt
    })),
    pageInfo: {
      hasMore: events.length > limit,
      nextCursor: buildNextCursor(events, limit)
    }
  };
}

export function toEventStatsResponse(summary: AuditEventSummary) {
  return summary;
}

export function toEventTimeseriesResponse(points: AuditEventTimeseriesPoint[]) {
  return {
    points
  };
}
