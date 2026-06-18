import "server-only";

import { createServerApiClient } from "@/src/lib/api/server-api-client";
import { createAuditEventsClient } from "@/src/features/audit-events/api/audit-events-client";
import {
  type EventListQuery,
  toDashboardRange
} from "@/src/features/audit-events/domain/query";
import type {
  EventListResponse,
  EventStatsResponse,
  EventTimeseriesResponse
} from "@/src/features/audit-events/domain/types";
import { createAuditEventsService } from "@/src/features/audit-events/services/audit-events-service";
import type { AuditEventsService } from "@/src/features/audit-events/services/audit-events-service";

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
  workspace: {
    organizationId: string;
    projectId: string;
  },
  options: LoadAuditEventsPageOptions = {}
): Promise<AuditEventsPageData> {
  const service = options.service ?? createDefaultAuditEventsService(workspace);
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

function createDefaultAuditEventsService(workspace: {
  organizationId: string;
  projectId: string;
}) {
  return createAuditEventsService(
    createAuditEventsClient(createServerApiClient(), workspace)
  );
}
