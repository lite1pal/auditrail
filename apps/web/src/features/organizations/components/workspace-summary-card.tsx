import Link from "next/link";
import type { UrlObject } from "url";

import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";

interface WorkspaceSummaryCardProps {
  activeOrganizationName?: string;
  activeProjectName?: string;
  apiKeyCount: number;
  dashboardHref: UrlObject;
  organizationCount: number;
  projectCount: number;
}

export function WorkspaceSummaryCard({
  activeOrganizationName,
  activeProjectName,
  apiKeyCount,
  dashboardHref,
  organizationCount,
  projectCount
}: WorkspaceSummaryCardProps) {
  return (
    <Card className="grid gap-5">
      <div className="grid gap-1">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
          Workspace snapshot
        </p>
        <h2 className="text-xl font-bold">
          {activeOrganizationName ?? "No organization selected"}
        </h2>
        <p className="text-sm text-[var(--muted)]">
          {activeProjectName
            ? `Selected project: ${activeProjectName}`
            : "Select an organization and project to unlock keys and ingestion commands."}
        </p>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        <Stat label="Organizations" value={organizationCount} />
        <Stat label="Projects" value={projectCount} />
        <Stat label="API keys" value={apiKeyCount} />
        <Stat
          label="Status"
          value={activeProjectName ? "Ready" : "Needs a project"}
        />
      </dl>
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link href={dashboardHref}>Open dashboard</Link>
        </Button>
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--panel-subtle)] p-3">
      <dt className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-bold">{value}</dd>
    </div>
  );
}
