import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { EmptyState } from "@/src/components/ui/empty-state";
import { PageShell } from "@/src/components/ui/page-shell";
import { SectionHeader } from "@/src/components/ui/section-header";
import type { CurrentUserResponse } from "@/src/features/auth/domain/schemas";

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

  const stepHref = {
    api_key_created: activeProjectId
      ? `/api-keys?organizationId=${activeOrganizationId}&projectId=${activeProjectId}`
      : `/settings?organizationId=${activeOrganizationId}#project-settings`,
    first_event_ingested: activeProjectId
      ? `/settings?organizationId=${activeOrganizationId}&projectId=${activeProjectId}`
      : `/settings?organizationId=${activeOrganizationId}#project-settings`,
    member_invited: `/settings?organizationId=${activeOrganizationId}#access-settings`,
    project_created: `/settings?organizationId=${activeOrganizationId}#project-settings`
  } as const;

  const stepLabel = {
    api_key_created: activeProjectId ? "Create first API key" : "Create a project first",
    first_event_ingested: activeProjectId ? "Send first event" : "Create a project first",
    member_invited: "Invite teammate",
    project_created: "Create first project"
  } as const;

  return (
    <PageShell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeader
          description={
            activeProjectName
              ? `${activeOrganizationName} / ${activeProjectName}`
              : `${activeOrganizationName} setup progress`
          }
          eyebrow="Workspace setup"
          title="Getting started"
        />
        <form action={updateOnboardingStateAction}>
          <input name="organizationId" type="hidden" value={activeOrganizationId} />
          <input
            name="dismissed"
            type="hidden"
            value={activeOnboarding.isDismissed ? "false" : "true"}
          />
          <Button type="submit" variant="secondary">
            {activeOnboarding.isDismissed ? "Show in sidebar" : "Dismiss from sidebar"}
          </Button>
        </form>
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
          <Card className="grid gap-3" key={step.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="grid gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold">{stepTitles[step.id]}</h2>
                  <Badge>{step.required ? "Required" : "Optional"}</Badge>
                  <Badge>{step.status === "complete" ? "Complete" : "Pending"}</Badge>
                </div>
                <p className="text-sm text-[var(--muted)]">{stepDescriptions[step.id]}</p>
                {step.completedAt ? (
                  <p className="text-xs text-[var(--muted)]">
                    Completed {formatIsoDate(step.completedAt)}
                  </p>
                ) : null}
              </div>
              <Button asChild variant="secondary">
                <a href={stepHref[step.id]}>{stepLabel[step.id]}</a>
              </Button>
            </div>
            {step.id === "first_event_ingested" && ingestCommand ? (
              <section className="grid gap-2">
                <p className="text-sm font-bold">Ingest command</p>
                <pre className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--panel-subtle)] p-3 text-xs">
                  {ingestCommand}
                </pre>
              </section>
            ) : null}
          </Card>
        ))}
      </section>
    </PageShell>
  );
}

const stepTitles = {
  api_key_created: "Create an API key",
  first_event_ingested: "Send the first event",
  member_invited: "Invite a teammate",
  project_created: "Create a project"
} as const;

const stepDescriptions = {
  api_key_created: "Generate a machine credential in the existing API keys flow.",
  first_event_ingested:
    "Send one test event through the selected project to validate the full ingest path.",
  member_invited: "Add another member from the workspace access settings when you are ready.",
  project_created: "Create the first project for this organization in workspace settings."
} as const;

function formatIsoDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
