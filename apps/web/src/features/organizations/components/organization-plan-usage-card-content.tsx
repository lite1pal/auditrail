import type { CurrentUserResponse } from "@/src/features/auth/domain/schemas";
import { OrganizationPlanUsageCardActions } from "@/src/features/organizations/components/organization-plan-usage-card-actions";
import { OrganizationPlanUsageCardMetrics } from "@/src/features/organizations/components/organization-plan-usage-card-metrics";
import type { WorkspaceSettingsPlanUsageCopy } from "@/src/features/organizations/components/workspace-settings-screen.types";

interface OrganizationPlanUsageCardContentProps {
  action: (formData: FormData) => Promise<void>;
  organizationId: string;
  plan: CurrentUserResponse["memberships"][number]["plan"];
  productCopy: WorkspaceSettingsPlanUsageCopy;
  role?: CurrentUserResponse["memberships"][number]["role"];
}

export function OrganizationPlanUsageCardContent({
  action,
  organizationId,
  plan,
  productCopy,
  role
}: OrganizationPlanUsageCardContentProps) {
  return (
    <div className="grid gap-5">
      <OrganizationPlanUsageCardMetrics plan={plan} productCopy={productCopy} />
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-subtle)] p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="grid gap-1">
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {productCopy.resetDatePrefix} {formatDate(plan.periodEnd)}
            </p>
            <p className="text-sm text-[var(--muted)]">
              {productCopy.usageWindowPrefix} {formatDateTime(plan.periodStart)} to{" "}
              {formatDateTime(plan.periodEnd)}.
            </p>
          </div>
          <OrganizationPlanUsageCardActions
            action={action}
            organizationId={organizationId}
            planId={plan.id}
            productCopy={productCopy}
            role={role}
          />
        </div>
      </div>
    </div>
  );
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
