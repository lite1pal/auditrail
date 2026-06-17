import type {
  EventStatsViewModel,
  EventTimeseriesViewModel
} from "../domain/types";
import { EventTimeseriesChart } from "./event-timeseries-chart";

interface EventDashboardProps {
  stats: EventStatsViewModel;
  timeseries: EventTimeseriesViewModel;
}

export function EventDashboard({ stats, timeseries }: EventDashboardProps) {
  return (
    <section className="dashboard-grid" aria-label="Event dashboard">
      <article className="metric-panel">
        <span>Total events</span>
        <strong>{stats.totalEvents}</strong>
      </article>
      <article className="metric-panel">
        <span>Top event types</span>
        <ul>
          {stats.topEventTypes.map((eventType) => (
            <li key={eventType.event}>
              <span>{eventType.event}</span>
              <strong>{eventType.count}</strong>
            </li>
          ))}
        </ul>
      </article>
      <EventTimeseriesChart points={timeseries.points} />
    </section>
  );
}
