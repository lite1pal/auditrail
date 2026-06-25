import { Button } from "@/src/components/ui/button";
import type { CurrentUserResponse } from "@/src/features/auth/domain/schemas";

interface OrganizationPlanUsageCardProps {
  action: (formData: FormData) => Promise<void>;
  organizationId?: string;
  plan?: CurrentUserResponse["memberships"][number]["plan"];
  role?: CurrentUserResponse["memberships"][number]["role"];
}

const availablePlans = [
  {
    id: "starter",
    label: "Starter"
  },
  {
    id: "growth",
    label: "Growth"
  },
  {
    id: "scale",
    label: "Scale"
  }
] as const;

export function OrganizationPlanUsageCard({
  action,
  organizationId,
  plan,
  role
}: OrganizationPlanUsageCardProps) {
  const canManage = role === "owner" || role === "admin";

  if (!organizationId || !plan) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--panel-subtle)] p-5 text-sm text-[var(--muted)]">
        Select an organization to review its current plan and monthly event usage.
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 lg:grid-cols-4">
        <Metric label="Current plan" value={plan.name} />
        <Metric label="Included events" value={formatNumber(plan.includedEvents)} />
        <Metric label="Used this month" value={formatNumber(plan.usedEvents)} />
        <Metric label="Remaining" value={formatNumber(plan.remainingEvents)} />
      </div>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-subtle)] p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="grid gap-1">
            <p className="text-sm font-semibold text-[var(--foreground)]">
              Resets on {formatDate(plan.periodEnd)}
            </p>
            <p className="text-sm text-[var(--muted)]">
              Usage is tracked by UTC calendar month from {formatDateTime(plan.periodStart)} to{" "}
              {formatDateTime(plan.periodEnd)}.
            </p>
          </div>
          {canManage ? (
            <form action={action} className="flex flex-wrap gap-2">
              <input name="organizationId" type="hidden" value={organizationId} />
              {availablePlans.map((availablePlan) => (
                <Button
                  key={availablePlan.id}
                  name="planId"
                  size="sm"
                  type="submit"
                  value={availablePlan.id}
                  variant={availablePlan.id === plan.id ? "primary" : "secondary"}
                >
                  {availablePlan.id === plan.id
                    ? `${availablePlan.label} selected`
                    : `Switch to ${availablePlan.label}`}
                </Button>
              ))}
            </form>
          ) : (
            <p className="text-sm text-[var(--muted)]">
              Only organization owners and admins can change plans.
            </p>
          )}
        </div>
      </div>
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC"
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC"
  }).format(new Date(value));
}
