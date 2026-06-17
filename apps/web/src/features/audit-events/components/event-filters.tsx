import type { EventListQuery } from "../domain/query";

interface EventFiltersProps {
  query: EventListQuery;
}

export function EventFilters({ query }: EventFiltersProps) {
  return (
    <section aria-label="Event filters" className="filter-bar">
      <div>
        <span>Event</span>
        <strong>{query.event ?? "All"}</strong>
      </div>
      <div>
        <span>Actor</span>
        <strong>{query.actor ?? "All"}</strong>
      </div>
      <div>
        <span>Target</span>
        <strong>{query.target ?? "All"}</strong>
      </div>
    </section>
  );
}
