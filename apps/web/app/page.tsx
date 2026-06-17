import { createAuditEventsClient } from "../src/features/audit-events/api/audit-events-client";
import { AuditEventsScreen } from "../src/features/audit-events/components/audit-events-screen";
import { parseEventSearchParams } from "../src/features/audit-events/domain/query";
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
  const initialEvents = await service.list(query);

  return <AuditEventsScreen initialEvents={initialEvents} query={query} />;
}
