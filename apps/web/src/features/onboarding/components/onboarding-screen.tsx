import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { EmptyState } from "@/src/components/ui/empty-state";
import { PageShell } from "@/src/components/ui/page-shell";
import { SectionHeader } from "@/src/components/ui/section-header";
import type { CurrentUserResponse } from "@/src/features/auth/domain/schemas";
import { OnboardingScreenContent } from "@/src/features/onboarding/components/onboarding-screen-content";

interface OnboardingScreenProps {
  activeOnboarding?: CurrentUserResponse["memberships"][number]["onboarding"];
  activeOrganizationId?: string;
  activeOrganizationName?: string;
  activeProjectId?: string;
  activeProjectName?: string;
  ingestCommand?: string;
  updateOnboardingStateAction: (formData: FormData) => Promise<void>;
}

export function OnboardingScreen({
  activeOnboarding,
  activeOrganizationId,
  activeOrganizationName,
  activeProjectId,
  activeProjectName,
  ingestCommand,
  updateOnboardingStateAction
}: OnboardingScreenProps) {
  if (!activeOrganizationId || !activeOnboarding) {
    return (
      <PageShell>
        <SectionHeader
          description="Create an organization to unlock the reusable setup flow."
          eyebrow="Workspace setup"
          title="Getting started"
        />
        <EmptyState label="No organization is available yet. Create a workspace first, then come back here for the guided setup flow." />
        <div>
          <Button asChild>
            <a href="/settings">Open settings</a>
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
        updateOnboardingStateAction={updateOnboardingStateAction}
      />
    </PageShell>
  );
}
