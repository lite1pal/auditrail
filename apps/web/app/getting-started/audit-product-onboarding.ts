import { auditTrailProduct } from "@auditrail/domain/audit-events";

import type {
  OnboardingScreenCopy,
  OnboardingStepView
} from "@/src/features/onboarding/domain/onboarding-screen";
import type { CurrentUserResponse } from "@/src/features/auth/domain/schemas";

interface BuildAuditTrailOnboardingStepViewsInput {
  activeOnboarding: CurrentUserResponse["memberships"][number]["onboarding"];
  activeOrganizationId: string;
  activeProjectId?: string;
}

const onboardingScreenCopy: OnboardingScreenCopy = {
  completeSummaryDescription:
    auditTrailProduct.onboarding.completeSummaryDescription,
  dismissFromSidebarLabel:
    auditTrailProduct.onboarding.dismissFromSidebarLabel,
  emptyStateDescription: auditTrailProduct.emptyStateCopy.emptyStateDescription,
  emptyStatePrimaryCtaHref:
    auditTrailProduct.emptyStateCopy.primaryCtaHref ?? "/settings",
  emptyStatePrimaryCtaLabel:
    auditTrailProduct.emptyStateCopy.primaryCtaLabel ?? "Open settings",
  eyebrow: auditTrailProduct.onboarding.eyebrow,
  incompleteSummaryDescription:
    auditTrailProduct.onboarding.incompleteSummaryDescription,
  showInSidebarLabel: auditTrailProduct.onboarding.showInSidebarLabel,
  title: auditTrailProduct.onboarding.title
};

export function getAuditTrailOnboardingScreenCopy() {
  return onboardingScreenCopy;
}

export function buildAuditTrailOnboardingStepViews({
  activeOnboarding,
  activeOrganizationId,
  activeProjectId
}: BuildAuditTrailOnboardingStepViewsInput): OnboardingStepView[] {
  return activeOnboarding.steps.map((step) => {
    const stepConfig = auditTrailProduct.onboarding.steps[step.id];
    const missingProjectAction =
      "missingProjectAction" in stepConfig
        ? stepConfig.missingProjectAction
        : undefined;
    const action = activeProjectId
      ? stepConfig.action
      : (missingProjectAction ?? stepConfig.action);

    return {
      ...step,
      ctaHref: resolveActionHref(
        action.href,
        activeOrganizationId,
        activeProjectId
      ),
      ctaLabel: action.label,
      description: stepConfig.description,
      showsIngestCommand:
        "showsIngestCommand" in stepConfig
          ? (stepConfig.showsIngestCommand ?? false)
          : false,
      title: stepConfig.title
    };
  });
}

function resolveActionHref(
  href:
    | "access-settings"
    | "api-keys"
    | "project-settings"
    | "selected-project-settings",
  activeOrganizationId: string,
  activeProjectId?: string
) {
  const hrefByAction = {
    "access-settings": `/settings?organizationId=${activeOrganizationId}#access-settings`,
    "api-keys": activeProjectId
      ? `/api-keys?organizationId=${activeOrganizationId}&projectId=${activeProjectId}`
      : `/settings?organizationId=${activeOrganizationId}#project-settings`,
    "project-settings": `/settings?organizationId=${activeOrganizationId}#project-settings`,
    "selected-project-settings": activeProjectId
      ? `/settings?organizationId=${activeOrganizationId}&projectId=${activeProjectId}`
      : `/settings?organizationId=${activeOrganizationId}#project-settings`
  } as const;

  return hrefByAction[href];
}
