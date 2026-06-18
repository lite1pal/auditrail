import { AuditEventsScreen } from "@/src/features/audit-events/components/audit-events-screen";
import {
  parseEventSearchParams,
} from "@/src/features/audit-events/domain/query";
import { loadAuditEventsPage } from "@/src/features/audit-events/server/load-audit-events-page";
import { requireCurrentUser } from "@/src/features/auth/server/auth-server";
import { AppShell } from "@/src/components/layout/app-shell";

interface HomeProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Home({ searchParams }: HomeProps) {
  const currentUser = await requireCurrentUser();
  const resolvedSearchParams = await searchParams;
  const query = parseEventSearchParams(resolvedSearchParams);
  const workspace = resolveWorkspaceQuery(currentUser, resolvedSearchParams);
  const data =
    workspace.organizationId && workspace.projectId
      ? await loadAuditEventsPage(query, workspace)
      : {
          events: {
            events: [],
            pageInfo: {
              hasMore: false,
              nextCursor: null
            }
          },
          stats: {
            topEventTypes: [],
            totalEvents: 0
          },
          timeseries: {
            points: []
          }
        };

  return (
    <AppShell
      activeOrganizationId={workspace.organizationId}
      activeProjectId={workspace.projectId}
      currentUser={currentUser}
    >
      <AuditEventsScreen
        initialEvents={data.events}
        query={query}
        stats={data.stats}
        timeseries={data.timeseries}
        workspace={workspace}
      />
    </AppShell>
  );
}

function resolveWorkspaceQuery(
  currentUser: Awaited<ReturnType<typeof requireCurrentUser>>,
  searchParams: Record<string, string | string[] | undefined>
) {
  const requestedOrganizationId = getSearchValue(searchParams.organizationId);
  const requestedProjectId = getSearchValue(searchParams.projectId);
  const activeMembership =
    currentUser.memberships.find(
      (membership) => membership.organization.id === requestedOrganizationId
    ) ?? currentUser.memberships[0];
  const activeProject =
    activeMembership?.projects.find(
      (project) => project.id === requestedProjectId
    ) ?? activeMembership?.projects[0];

  return {
    organizationId: activeMembership?.organization.id,
    projectId: activeProject?.id
  };
}

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
