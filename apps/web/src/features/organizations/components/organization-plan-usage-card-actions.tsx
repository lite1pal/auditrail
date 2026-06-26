import { Button } from "@/src/components/ui/button";
import type { CurrentUserResponse } from "@/src/features/auth/domain/schemas";
import type { WorkspaceSettingsPlanUsageCopy } from "@/src/features/organizations/components/workspace-settings-screen.types";

interface OrganizationPlanUsageCardActionsProps {
  action: (formData: FormData) => Promise<void>;
  organizationId: string;
  planId: CurrentUserResponse["memberships"][number]["plan"]["id"];
  productCopy: WorkspaceSettingsPlanUsageCopy;
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

export function OrganizationPlanUsageCardActions({
  action,
  organizationId,
  planId,
  productCopy,
  role
}: OrganizationPlanUsageCardActionsProps) {
  if (role !== "owner" && role !== "admin") {
    return (
      <p className="text-sm text-[var(--muted)]">
        {productCopy.noPermissionDescription}
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-wrap gap-2">
      <input name="organizationId" type="hidden" value={organizationId} />
      {availablePlans.map((availablePlan) => (
        <Button
          key={availablePlan.id}
          name="planId"
          size="sm"
          type="submit"
          value={availablePlan.id}
          variant={availablePlan.id === planId ? "primary" : "secondary"}
        >
          {availablePlan.id === planId
            ? `${availablePlan.label} ${productCopy.selectedPlanSuffix}`
            : `${productCopy.switchToPlanPrefix} ${availablePlan.label}`}
        </Button>
      ))}
    </form>
  );
}
