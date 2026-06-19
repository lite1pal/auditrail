import Link from "next/link";

import { Button } from "@/src/components/ui/button";
import { EmptyState } from "@/src/components/ui/empty-state";
import { PageShell } from "@/src/components/ui/page-shell";
import { SectionHeader } from "@/src/components/ui/section-header";
import {
  toEventListViewModel,
  toEventStatsViewModel,
  toEventTimeseriesViewModel
} from "@/src/features/audit-events/domain/presenters";
import type {
  EventListQuery,
  EventListWorkspaceQuery
} from "@/src/features/audit-events/domain/query";
import type {
  EventListResponse,
  EventStatsResponse,
  EventTimeseriesResponse
} from "@/src/features/audit-events/domain/types";
import { EventDashboard } from "@/src/features/audit-events/components/event-dashboard";
import { EventInspectionWorkspace } from "@/src/features/audit-events/components/event-inspection-workspace";
import { EventFilters } from "@/src/features/audit-events/components/event-filters";

interface AuditEventsScreenProps {
  initialEvents: EventListResponse;
  query: EventListQuery;
  stats: EventStatsResponse;
  timeseries: EventTimeseriesResponse;
  workspace?: EventListWorkspaceQuery;
}

export function AuditEventsScreen({
  initialEvents,
  query,
  stats,
  timeseries,
  workspace
}: AuditEventsScreenProps) {
  const viewModel = toEventListViewModel(initialEvents);

  return (
    <PageShell>
      <SectionHeader eyebrow="Audit events" title="Event stream" />
      <EventFilters query={query} workspace={workspace} />
      <EventDashboard
        stats={toEventStatsViewModel(stats)}
        timeseries={toEventTimeseriesViewModel(timeseries)}
      />
      {viewModel.rows.length === 0 ? (
        <section className="grid gap-4">
          <EmptyState label="No audit events yet. Create a project key in Settings, send one test event, and come back to see the stream and metrics fill in." />
          <div>
            <Button asChild variant="secondary">
              <Link
                href={
                  workspace?.organizationId
                    ? `/settings?organizationId=${workspace.organizationId}${workspace.projectId ? `&projectId=${workspace.projectId}` : ""}`
                    : "/settings"
                }
              >
                Open settings
              </Link>
            </Button>
          </div>
        </section>
      ) : (
        <EventInspectionWorkspace
          hasMore={viewModel.hasMore}
          nextCursor={viewModel.nextCursor}
          query={query}
          rows={viewModel.rows}
          workspace={workspace}
        />
      )}
    </PageShell>
  );
}
