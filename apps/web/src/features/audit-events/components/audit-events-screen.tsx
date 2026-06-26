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
import { getAuditEventsCopy } from "@/src/features/audit-events/product/audit-product-copy";

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
  const copy = getAuditEventsCopy();

  return (
    <PageShell>
      <SectionHeader
        description={copy.listDescription}
        eyebrow={copy.listEyebrow}
        title={copy.listTitle}
      />
      <EventFilters query={query} workspace={workspace} />
      <EventDashboard
        stats={toEventStatsViewModel(stats)}
        timeseries={toEventTimeseriesViewModel(timeseries)}
      />
      {viewModel.rows.length === 0 ? (
        <section className="grid gap-4">
          <EmptyState label={copy.emptyStateLabel} />
          <div>
            <Button asChild variant="secondary">
              <a
                href={
                  workspace?.organizationId
                    ? `/getting-started?organizationId=${workspace.organizationId}${workspace.projectId ? `&projectId=${workspace.projectId}` : ""}`
                    : "/getting-started"
                }
              >
                {copy.emptyStateCtaLabel}
              </a>
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
