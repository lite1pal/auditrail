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
    <main className="page-shell">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Audit events</p>
          <h1>Event stream</h1>
        </div>
      </section>
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
    </main>
  );
}
