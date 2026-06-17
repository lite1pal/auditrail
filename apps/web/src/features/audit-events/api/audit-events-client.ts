import type { ApiClient } from "../../../lib/api/api-client";
import type { EventListQuery } from "../domain/query";
import { toApiEventListQuery } from "../domain/query";
import {
  eventListResponseSchema,
  eventStatsResponseSchema,
  eventTimeseriesResponseSchema
} from "../domain/schemas";

export interface AuditEventsClient {
  list(query: EventListQuery): Promise<unknown>;
  stats(query: { from?: string; to?: string; top?: number }): Promise<unknown>;
  timeseries(query: {
    bucket?: "hour" | "day";
    from: string;
    to: string;
  }): Promise<unknown>;
}

export function createAuditEventsClient(apiClient: ApiClient): AuditEventsClient {
  return {
    list(query) {
      return apiClient.request({
        path: "/api/v1/events",
        query: toApiEventListQuery(query)
      });
    },
    stats(query) {
      return apiClient.request({
        path: "/api/v1/events/stats",
        query
      });
    },
    timeseries(query) {
      return apiClient.request({
        path: "/api/v1/events/timeseries",
        query
      });
    }
  };
}

export async function listAuditEvents(
  client: AuditEventsClient,
  query: EventListQuery
) {
  return eventListResponseSchema.parse(await client.list(query));
}

export async function getAuditEventStats(
  client: AuditEventsClient,
  query: { from?: string; to?: string; top?: number }
) {
  return eventStatsResponseSchema.parse(await client.stats(query));
}

export async function getAuditEventTimeseries(
  client: AuditEventsClient,
  query: { bucket?: "hour" | "day"; from: string; to: string }
) {
  return eventTimeseriesResponseSchema.parse(await client.timeseries(query));
}
