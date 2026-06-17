import { toEventListViewModel } from "../domain/presenters";
import type { EventListQuery } from "../domain/query";
import type { EventListResponse } from "../domain/types";
import { EventFilters } from "./event-filters";
import { EventsTable } from "./events-table";

interface AuditEventsScreenProps {
  initialEvents: EventListResponse;
  query: EventListQuery;
}

export function AuditEventsScreen({ initialEvents, query }: AuditEventsScreenProps) {
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
      <EventsTable rows={viewModel.rows} />
    </main>
  );
}
