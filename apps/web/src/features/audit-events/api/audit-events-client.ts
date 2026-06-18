import type { ApiClient } from "@/src/lib/api/api-client";
import type { EventListQuery } from "@/src/features/audit-events/domain/query";
import { toApiEventListQuery } from "@/src/features/audit-events/domain/query";
import {
  eventListResponseSchema,
  eventStatsResponseSchema,
  eventTimeseriesResponseSchema
} from "@/src/features/audit-events/domain/schemas";
import type {
  EventListResponse,
  EventStatsResponse,
  EventTimeseriesResponse
} from "@/src/features/audit-events/domain/types";

export interface AuditEventsClient {
  list(query: EventListQuery): Promise<EventListResponse>;
  stats(query: {
    from?: string;
    to?: string;
    top?: number;
  }): Promise<EventStatsResponse>;
  timeseries(query: {
    bucket?: "hour" | "day";
    from: string;
    to: string;
  }): Promise<EventTimeseriesResponse>;
}

export function createAuditEventsClient(
  apiClient: ApiClient,
  workspace: {
    organizationId: string;
    projectId: string;
  }
): AuditEventsClient {
  return {
    list(query) {
      return listAuditEvents(apiClient, workspace, query);
    },
    stats(query) {
      return getAuditEventStats(apiClient, workspace, query);
    },
    timeseries(query) {
      return getAuditEventTimeseries(apiClient, workspace, query);
    }
  };
}

export async function listAuditEvents(
  apiClient: ApiClient,
  workspace: {
    organizationId: string;
    projectId: string;
  },
  query: EventListQuery
) {
  return eventListResponseSchema.parse(
    await apiClient.request({
      path: `/api/v1/organizations/${workspace.organizationId}/projects/${workspace.projectId}/events`,
      query: toApiEventListQuery(query)
    })
  );
}

export async function getAuditEventStats(
  apiClient: ApiClient,
  workspace: {
    organizationId: string;
    projectId: string;
  },
  query: { from?: string; to?: string; top?: number }
) {
  return eventStatsResponseSchema.parse(
    await apiClient.request({
      path: `/api/v1/organizations/${workspace.organizationId}/projects/${workspace.projectId}/events/stats`,
      query
    })
  );
}

export async function getAuditEventTimeseries(
  apiClient: ApiClient,
  workspace: {
    organizationId: string;
    projectId: string;
  },
  query: { bucket?: "hour" | "day"; from: string; to: string }
) {
  return eventTimeseriesResponseSchema.parse(
    await apiClient.request({
      path: `/api/v1/organizations/${workspace.organizationId}/projects/${workspace.projectId}/events/timeseries`,
      query
    })
  );
}
