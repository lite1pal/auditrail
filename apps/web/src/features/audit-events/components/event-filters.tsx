import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import type {
  EventListQuery,
  EventListWorkspaceQuery
} from "@/src/features/audit-events/domain/query";

interface EventFiltersProps {
  query: EventListQuery;
  workspace?: EventListWorkspaceQuery;
}

export function EventFilters({ query, workspace }: EventFiltersProps) {
  return (
    <form
      aria-label="Event filters"
      className="grid gap-4 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5 md:grid-cols-[repeat(3,minmax(0,1fr))_auto]"
      method="get"
    >
      <div className="grid gap-1 md:col-span-4">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
          Filters
        </p>
        <p className="text-sm text-[var(--muted)]">
          Narrow the current project by event, actor, or target.
        </p>
      </div>
      <input
        name="organizationId"
        type="hidden"
        value={workspace?.organizationId ?? ""}
      />
      <input name="projectId" type="hidden" value={workspace?.projectId ?? ""} />
      <Label>
        <span>Event</span>
        <Input defaultValue={query.event} name="event" placeholder="user.created" />
      </Label>
      <Label>
        <span>Actor</span>
        <Input defaultValue={query.actor} name="actor" placeholder="actor id" />
      </Label>
      <Label>
        <span>Target</span>
        <Input defaultValue={query.target} name="target" placeholder="target id" />
      </Label>
      <Button className="self-end" type="submit">
        Apply filters
      </Button>
    </form>
  );
}
