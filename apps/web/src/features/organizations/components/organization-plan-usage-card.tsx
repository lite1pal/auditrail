import type { CurrentUserResponse } from "@/src/features/auth/domain/schemas";
import { OrganizationPlanUsageCardContent } from "@/src/features/organizations/components/organization-plan-usage-card-content";
import type { WorkspaceSettingsPlanUsageCopy } from "@/src/features/organizations/components/workspace-settings-screen.types";

interface OrganizationPlanUsageCardProps {
  action: (formData: FormData) => Promise<void>;
  organizationId?: string;
  plan?: CurrentUserResponse["memberships"][number]["plan"];
  productCopy: WorkspaceSettingsPlanUsageCopy;
  role?: CurrentUserResponse["memberships"][number]["role"];
}

export function OrganizationPlanUsageCard({
  action,
  organizationId,
  plan,
  productCopy,
  role
}: OrganizationPlanUsageCardProps) {
  if (!organizationId || !plan) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--panel-subtle)] p-5 text-sm text-[var(--muted)]">
        {productCopy.emptyStateDescription}
      </div>
    );
  }

  return (
    <OrganizationPlanUsageCardContent
      action={action}
      organizationId={organizationId}
      plan={plan}
      productCopy={productCopy}
      role={role}
    />
  );
}
