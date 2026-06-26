import type { CurrentUserResponse } from "@/src/features/auth/domain/schemas";
import { OrganizationPlanUsageCardContent } from "@/src/features/organizations/components/organization-plan-usage-card-content";

interface OrganizationPlanUsageCardProps {
  action: (formData: FormData) => Promise<void>;
  organizationId?: string;
  plan?: CurrentUserResponse["memberships"][number]["plan"];
  role?: CurrentUserResponse["memberships"][number]["role"];
}

export function OrganizationPlanUsageCard({
  action,
  organizationId,
  plan,
  role
}: OrganizationPlanUsageCardProps) {
  if (!organizationId || !plan) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--panel-subtle)] p-5 text-sm text-[var(--muted)]">
        Select an organization to review its current plan and monthly event usage.
      </div>
    );
  }

  return (
    <OrganizationPlanUsageCardContent
      action={action}
      organizationId={organizationId}
      plan={plan}
      role={role}
    />
  );
}
