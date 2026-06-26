import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { SectionHeader } from "@/src/components/ui/section-header";
import type { CurrentUserResponse } from "@/src/features/auth/domain/schemas";
import { OnboardingStepCard } from "@/src/features/onboarding/components/onboarding-step-card";

interface OnboardingScreenContentProps {
  activeOnboarding: CurrentUserResponse["memberships"][number]["onboarding"];
  activeOrganizationId: string;
  activeOrganizationName?: string;
  activeProjectId?: string;
  activeProjectName?: string;
  ingestCommand?: string;
  updateOnboardingStateAction: (formData: FormData) => Promise<void>;
}

export function OnboardingScreenContent({
  activeOnboarding,
  activeOrganizationId,
  activeOrganizationName,
  activeProjectId,
  activeProjectName,
  ingestCommand,
  updateOnboardingStateAction
}: OnboardingScreenContentProps) {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeader
          description={getHeaderDescription(activeOrganizationName, activeProjectName)}
          eyebrow="Workspace setup"
          title="Getting started"
        />
        <OnboardingSidebarToggle
          activeOnboarding={activeOnboarding}
          activeOrganizationId={activeOrganizationId}
          updateOnboardingStateAction={updateOnboardingStateAction}
        />
      </div>

      <Card className="grid gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>
            {activeOnboarding.completedRequiredSteps} / {activeOnboarding.totalRequiredSteps} required
          </Badge>
          <span className="text-sm text-[var(--muted)]">
            {activeOnboarding.isComplete
              ? "Required setup is complete."
              : "Finish the required steps to complete the initial workspace setup."}
          </span>
        </div>
      </Card>

      <section className="grid gap-4">
        {activeOnboarding.steps.map((step) => (
          <OnboardingStepCard
            activeOrganizationId={activeOrganizationId}
            activeProjectId={activeProjectId}
            ingestCommand={ingestCommand}
            key={step.id}
            step={step}
          />
        ))}
      </section>
    </>
  );
}

function OnboardingSidebarToggle({
  activeOnboarding,
  activeOrganizationId,
  updateOnboardingStateAction
}: Pick<
  OnboardingScreenContentProps,
  "activeOnboarding" | "activeOrganizationId" | "updateOnboardingStateAction"
>) {
  return (
    <form action={updateOnboardingStateAction}>
      <input name="organizationId" type="hidden" value={activeOrganizationId} />
      <input
        name="dismissed"
        type="hidden"
        value={activeOnboarding.isDismissed ? "false" : "true"}
      />
      <OnboardingSidebarToggleButton isDismissed={activeOnboarding.isDismissed} />
    </form>
  );
}

function OnboardingSidebarToggleButton({
  isDismissed
}: {
  isDismissed: boolean;
}) {
  return (
    <button
      className="inline-flex items-center justify-center rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--panel-subtle)]"
      type="submit"
    >
      {isDismissed ? "Show in sidebar" : "Dismiss from sidebar"}
    </button>
  );
}

function getHeaderDescription(
  activeOrganizationName?: string,
  activeProjectName?: string
) {
  if (activeProjectName) {
    return `${activeOrganizationName} / ${activeProjectName}`;
  }

  return `${activeOrganizationName} setup progress`;
}
