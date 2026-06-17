import type { EventListQuery } from "../domain/query";
import { Button } from "../../../components/ui/button";

interface EventFiltersProps {
  query: EventListQuery;
}

export function EventFilters({ query }: EventFiltersProps) {
  return (
    <form aria-label="Event filters" className="filter-bar" method="get">
      <label>
        <span>Event</span>
        <input defaultValue={query.event} name="event" placeholder="user.created" />
      </label>
      <label>
        <span>Actor</span>
        <input defaultValue={query.actor} name="actor" placeholder="actor id" />
      </label>
      <label>
        <span>Target</span>
        <input defaultValue={query.target} name="target" placeholder="target id" />
      </label>
      <Button type="submit">Apply</Button>
    </form>
  );
}
