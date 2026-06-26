import type {
  EventStatsViewModel,
  EventTimeseriesViewModel
} from "@/src/features/audit-events/domain/types";
import { MetricCard } from "@/src/components/ui/metric-card";
import { EventTimeseriesChart } from "@/src/features/audit-events/components/event-timeseries-chart";
import { getAuditEventsCopy } from "@/src/features/audit-events/product/audit-product-copy";

interface EventDashboardProps {
  stats: EventStatsViewModel;
  timeseries: EventTimeseriesViewModel;
}

export function EventDashboard({ stats, timeseries }: EventDashboardProps) {
  const copy = getAuditEventsCopy();

  return (
    <section
      aria-label="Event dashboard"
      className="grid gap-4 lg:grid-cols-[220px_280px_minmax(0,1fr)]"
    >
      <MetricCard label={copy.totalEventsLabel} value={stats.totalEvents} />
      <MetricCard label={copy.topEventTypesLabel}>
        <ul className="m-0 grid list-none gap-2 p-0">
          {stats.topEventTypes.map((eventType) => (
            <li className="flex items-center justify-between gap-3" key={eventType.event}>
              <span className="font-mono text-xs text-[var(--muted)]">{eventType.event}</span>
              <strong className="text-base">{eventType.count}</strong>
            </li>
          ))}
        </ul>
      </MetricCard>
      <EventTimeseriesChart points={timeseries.points} />
    </section>
  );
}
