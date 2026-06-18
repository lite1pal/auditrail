import type { ReactNode } from "react";
import Link from "next/link";

import { Button } from "@/src/components/ui/button";
import { logoutAction } from "@/src/features/auth/server/auth-server";
import type { CurrentUserResponse } from "@/src/features/auth/domain/schemas";
import { toWorkspaceViewModel } from "@/src/features/organizations/domain/presenters";

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

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-[var(--panel)]">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div>
            <strong>AuditTrail</strong>
            <p className="text-sm text-[var(--muted)]">
              {workspace.activeOrganization?.name ?? "No organization"} ·{" "}
              {workspace.activeProject?.name ?? "No project"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link className="text-sm font-bold" href={dashboardHref}>
              Dashboard
            </Link>
            <Link className="text-sm font-bold" href={settingsHref}>
              Settings
            </Link>
            <form action={logoutAction}>
              <Button size="sm" type="submit" variant="secondary">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
