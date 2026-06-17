import { AuditEventsScreen } from "../src/features/audit-events/components/audit-events-screen";
import {
  parseEventSearchParams,
} from "../src/features/audit-events/domain/query";
import { loadAuditEventsPage } from "../src/features/audit-events/server/load-audit-events-page";

interface HomeProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Home({ searchParams }: HomeProps) {
  const query = parseEventSearchParams(await searchParams);
  const data = await loadAuditEventsPage(query);

  return (
    <AuditEventsScreen
      initialEvents={data.events}
      query={query}
      stats={data.stats}
      timeseries={data.timeseries}
    />
  );
}
