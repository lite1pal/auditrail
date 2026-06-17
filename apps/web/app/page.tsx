import { createAuditEventsClient } from "../src/features/audit-events/api/audit-events-client";
import { AuditEventsScreen } from "../src/features/audit-events/components/audit-events-screen";
import {
  parseEventSearchParams,
  toDashboardRange
} from "../src/features/audit-events/domain/query";
import { createAuditEventsService } from "../src/features/audit-events/services/audit-events-service";
import { createServerApiClient } from "../src/lib/api/server-api-client";

interface HomeProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Home({ searchParams }: HomeProps) {
  const query = parseEventSearchParams(await searchParams);
  const service = createAuditEventsService(
    createAuditEventsClient(createServerApiClient())
  );
  const dashboardRange = toDashboardRange(query);
  const [initialEvents, stats, timeseries] = await Promise.all([
    service.list(query),
    service.stats({
      from: dashboardRange.from,
      to: dashboardRange.to,
      top: 5
    }),
    service.timeseries(dashboardRange)
  ]);

  return (
    <AuditEventsScreen
      initialEvents={initialEvents}
      query={query}
      stats={stats}
      timeseries={timeseries}
    />
  );
}
