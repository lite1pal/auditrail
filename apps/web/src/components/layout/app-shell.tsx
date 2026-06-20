import type { ReactNode } from "react";
import Link from "next/link";
import type { Route } from "next";

import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { logoutAction } from "@/src/features/auth/server/auth-server";
import type { CurrentUserResponse } from "@/src/features/auth/domain/schemas";
import { toWorkspaceViewModel } from "@/src/features/organizations/domain/presenters";
import { WorkspaceSidebarSwitcher } from "@/src/features/organizations/components/workspace-sidebar-switcher";

interface AppShellProps {
  activeOrganizationId?: string;
  activeProjectId?: string;
  children: ReactNode;
  currentUser: CurrentUserResponse;
}

export function AppShell({
  activeOrganizationId,
  activeProjectId,
  children,
  currentUser
}: AppShellProps) {
  const workspace = toWorkspaceViewModel(currentUser, {
    organizationId: activeOrganizationId,
    projectId: activeProjectId
  });
  const workspaceSuffix = workspace.activeOrganization
    ? `?organizationId=${workspace.activeOrganization.id}${workspace.activeProject ? `&projectId=${workspace.activeProject.id}` : ""}`
    : "";
  const dashboardHref = workspaceSuffix
    ? { pathname: "/", query: Object.fromEntries(new URLSearchParams(workspaceSuffix)) }
    : "/";
  const settingsHref = workspaceSuffix
    ? {
        pathname: "/settings",
        query: Object.fromEntries(new URLSearchParams(workspaceSuffix))
      }
    : "/settings";
  const membersHref = workspaceSuffix
    ? (`/members${workspaceSuffix}` as Route)
    : ("/members" as Route);

  return (
    <div className="min-h-screen xl:grid xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="border-b border-[var(--border)] px-4 py-4 md:px-6 xl:min-h-screen xl:border-r xl:border-b-0 xl:px-5 xl:py-6">
        <div className="mx-auto grid max-w-[1240px] gap-4 xl:max-w-none xl:grid-rows-[auto_auto_1fr_auto]">
          <Card className="grid gap-4 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.9))]">
            <div className="grid gap-2">
              <Badge className="w-fit">Workspace</Badge>
              <strong className="text-lg">AuditTrail</strong>
            </div>
            <p className="text-sm text-[var(--muted)]">
              {workspace.activeOrganization?.name ?? "No organization"} ·{" "}
              {workspace.activeProject?.name ?? "No project"}
            </p>
          </Card>
          <Card className="grid gap-3">
            <div className="grid gap-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Navigation
              </p>
              <p className="text-sm text-[var(--muted)]">
                Move between the event stream and workspace administration.
              </p>
            </div>
            <nav aria-label="Primary">
              <ul className="grid gap-2">
                <li>
                  <Link
                    className="block rounded-xl border border-[var(--border)] bg-[var(--panel-subtle)] px-3 py-2.5 text-sm font-semibold hover:bg-[var(--panel-strong)]"
                    href={dashboardHref}
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    className="block rounded-xl border border-[var(--border)] bg-[var(--panel-subtle)] px-3 py-2.5 text-sm font-semibold hover:bg-[var(--panel-strong)]"
                    href={settingsHref}
                  >
                    Settings
                  </Link>
                </li>
                <li>
                  <Link
                    className="block rounded-xl border border-[var(--border)] bg-[var(--panel-subtle)] px-3 py-2.5 text-sm font-semibold hover:bg-[var(--panel-strong)]"
                    href={membersHref}
                  >
                    Members
                  </Link>
                </li>
              </ul>
            </nav>
          </Card>
          <div />
          <Card className="grid gap-4 self-end">
            <WorkspaceSidebarSwitcher
              activeOrganizationId={workspace.activeOrganization?.id}
              activeProjectId={workspace.activeProject?.id}
              memberships={currentUser.memberships}
            />
            <form action={logoutAction}>
              <Button className="w-full" size="sm" type="submit" variant="secondary">
                Sign out
              </Button>
            </form>
          </Card>
        </div>
      </aside>
      <div>{children}</div>
    </div>
  );
}
