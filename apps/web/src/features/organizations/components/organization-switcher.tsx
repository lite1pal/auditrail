import Link from "next/link";

import { Card } from "@/src/components/ui/card";
import type { Organization } from "@/src/features/organizations/domain/schemas";

interface OrganizationSwitcherProps {
  activeOrganizationId?: string;
  organizations: Organization[];
}

export function OrganizationSwitcher({
  activeOrganizationId,
  organizations
}: OrganizationSwitcherProps) {
  if (organizations.length === 0) {
    return (
      <Card className="grid gap-2">
        <h2 className="text-lg font-bold">Organizations</h2>
        <p className="text-sm text-[var(--muted)]">
          No organizations yet. Create one to start a workspace.
        </p>
      </Card>
    );
  }

  return (
    <Card className="grid gap-3">
      <div className="grid gap-1">
        <h2 className="text-lg font-bold">Organizations</h2>
        <p className="text-sm text-[var(--muted)]">
          Switch the workspace that controls projects, invitations, and keys.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {organizations.map((organization) => {
          const isActive = organization.id === activeOrganizationId;

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={
                isActive
                  ? "rounded-lg border border-[var(--foreground)] bg-[var(--foreground)] px-3 py-2 text-sm font-medium text-[var(--panel-strong)]"
                  : "rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--panel-subtle)]"
              }
              href={`/settings?organizationId=${organization.id}`}
              key={organization.id}
            >
              {organization.name}
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
