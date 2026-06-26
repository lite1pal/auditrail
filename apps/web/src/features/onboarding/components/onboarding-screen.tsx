import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { EmptyState } from "@/src/components/ui/empty-state";
import { PageShell } from "@/src/components/ui/page-shell";
import { SectionHeader } from "@/src/components/ui/section-header";
import type { CurrentUserResponse } from "@/src/features/auth/domain/schemas";
import { OnboardingScreenContent } from "@/src/features/onboarding/components/onboarding-screen-content";
import type {
  OnboardingScreenCopy,
  OnboardingStepView
} from "@/src/features/onboarding/domain/onboarding-screen";

interface OnboardingScreenProps {
  activeOnboarding?: CurrentUserResponse["memberships"][number]["onboarding"];
  activeOrganizationId?: string;
  activeOrganizationName?: string;
  activeProjectId?: string;
  activeProjectName?: string;
  ingestCommand?: string;
  onboardingCopy: OnboardingScreenCopy;
  onboardingStepViews?: readonly OnboardingStepView[];
  updateOnboardingStateAction: (formData: FormData) => Promise<void>;
}

export function OnboardingScreen({
  activeOnboarding,
  activeOrganizationId,
  activeOrganizationName,
  activeProjectId,
  activeProjectName,
  ingestCommand,
  onboardingCopy,
  onboardingStepViews,
  updateOnboardingStateAction
}: OnboardingScreenProps) {
  if (!activeOrganizationId || !activeOnboarding) {
    return (
      <PageShell>
        <SectionHeader
          description={onboardingCopy.emptyStateDescription}
          eyebrow={onboardingCopy.eyebrow}
          title={onboardingCopy.title}
        />
        <EmptyState label={onboardingCopy.emptyStateDescription} />
        <div>
          <Button asChild>
            <a href={onboardingCopy.emptyStatePrimaryCtaHref}>
              {onboardingCopy.emptyStatePrimaryCtaLabel}
            </a>
          </Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <OnboardingScreenContent
        activeOnboarding={activeOnboarding}
        activeOrganizationId={activeOrganizationId}
        activeOrganizationName={activeOrganizationName}
        activeProjectId={activeProjectId}
        activeProjectName={activeProjectName}
        ingestCommand={ingestCommand}
        onboardingCopy={onboardingCopy}
        onboardingStepViews={onboardingStepViews ?? []}
        updateOnboardingStateAction={updateOnboardingStateAction}
      />
    </PageShell>
  );
}
