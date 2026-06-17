import { PageShell } from "../../../components/ui/page-shell";
import { SectionHeader } from "../../../components/ui/section-header";
import {
  toEventListViewModel,
  toEventStatsViewModel,
  toEventTimeseriesViewModel
} from "../domain/presenters";
import type { EventListQuery } from "../domain/query";
import type {
  EventListResponse,
  EventStatsResponse,
  EventTimeseriesResponse
} from "../domain/types";
import { EventDashboard } from "./event-dashboard";
import { EventFilters } from "./event-filters";
import { EventsTable } from "./events-table";

interface AuditEventsScreenProps {
  initialEvents: EventListResponse;
  query: EventListQuery;
  stats: EventStatsResponse;
  timeseries: EventTimeseriesResponse;
}

export function AuditEventsScreen({
  initialEvents,
  query,
  stats,
  timeseries
}: AuditEventsScreenProps) {
  const viewModel = toEventListViewModel(initialEvents);

  return (
    <PageShell>
      <SectionHeader eyebrow="Audit events" title="Event stream" />
      <EventFilters query={query} />
      <EventDashboard
        stats={toEventStatsViewModel(stats)}
        timeseries={toEventTimeseriesViewModel(timeseries)}
      />
      <EventsTable
        hasMore={viewModel.hasMore}
        nextCursor={viewModel.nextCursor}
        query={query}
        rows={viewModel.rows}
      />
    </PageShell>
  );
}
