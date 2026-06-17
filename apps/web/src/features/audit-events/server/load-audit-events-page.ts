import "server-only";

import { createServerApiClient } from "../../../lib/api/server-api-client";
import { createAuditEventsClient } from "../api/audit-events-client";
import {
  type EventListQuery,
  toDashboardRange
} from "../domain/query";
import type {
  EventListResponse,
  EventStatsResponse,
  EventTimeseriesResponse
} from "../domain/types";
import { createAuditEventsService } from "../services/audit-events-service";
import type { AuditEventsService } from "../services/audit-events-service";

export interface AuditEventsPageData {
  events: EventListResponse;
  stats: EventStatsResponse;
  timeseries: EventTimeseriesResponse;
}

export interface LoadAuditEventsPageOptions {
  service?: AuditEventsService;
}

export async function loadAuditEventsPage(
  query: EventListQuery,
  options: LoadAuditEventsPageOptions = {}
): Promise<AuditEventsPageData> {
  const service = options.service ?? createDefaultAuditEventsService();
  const dashboardRange = toDashboardRange(query);
  const [events, stats, timeseries] = await Promise.all([
    service.list(query),
    service.stats({
      from: dashboardRange.from,
      to: dashboardRange.to,
      top: 5
    }),
    service.timeseries(dashboardRange)
  ]);

  return {
    events,
    stats,
    timeseries
  };
}

function createDefaultAuditEventsService() {
  return createAuditEventsService(createAuditEventsClient(createServerApiClient()));
}
