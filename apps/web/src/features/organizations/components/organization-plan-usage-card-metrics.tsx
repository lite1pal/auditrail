import type { CurrentUserResponse } from "@/src/features/auth/domain/schemas";

interface OrganizationPlanUsageCardMetricsProps {
  plan: CurrentUserResponse["memberships"][number]["plan"];
}

export function OrganizationPlanUsageCardMetrics({
  plan
}: OrganizationPlanUsageCardMetricsProps) {
  return (
    <div className="grid gap-3 lg:grid-cols-4">
      <Metric label="Current plan" value={plan.name} />
      <Metric label="Included events" value={formatNumber(plan.includedEvents)} />
      <Metric label="Used this month" value={formatNumber(plan.usedEvents)} />
      <Metric label="Remaining" value={formatNumber(plan.remainingEvents)} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2 rounded-2xl border border-[var(--border)] bg-[var(--panel-subtle)] p-4">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
        {label}
      </span>
      <strong className="text-2xl tracking-tight text-[var(--foreground)]">
        {value}
      </strong>
    </div>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}
