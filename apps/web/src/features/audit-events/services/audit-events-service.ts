import {
  getAuditEventStats,
  getAuditEventTimeseries,
  listAuditEvents,
  type AuditEventsClient
} from "../api/audit-events-client";
import type { EventListQuery } from "../domain/query";

export interface AuditEventsService {
  list(query: EventListQuery): ReturnType<typeof listAuditEvents>;
  stats(query: { from?: string; to?: string; top?: number }): ReturnType<
    typeof getAuditEventStats
  >;
  timeseries(query: {
    bucket?: "hour" | "day";
    from: string;
    to: string;
  }): ReturnType<typeof getAuditEventTimeseries>;
}

export function createAuditEventsService(
  client: AuditEventsClient
): AuditEventsService {
  return {
    list(query) {
      return listAuditEvents(client, query);
    },
    stats(query) {
      return getAuditEventStats(client, query);
    },
    timeseries(query) {
      return getAuditEventTimeseries(client, query);
    }
  };
}
