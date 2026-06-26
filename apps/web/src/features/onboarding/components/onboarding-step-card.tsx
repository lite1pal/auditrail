import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import type { CurrentUserResponse } from "@/src/features/auth/domain/schemas";

interface OnboardingStepCardProps {
  activeOrganizationId: string;
  activeProjectId?: string;
  ingestCommand?: string;
  step: CurrentUserResponse["memberships"][number]["onboarding"]["steps"][number];
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

export function OnboardingStepCard({
  activeOrganizationId,
  activeProjectId,
  ingestCommand,
  step
}: OnboardingStepCardProps) {
  const stepHref = getStepHref(step.id, activeOrganizationId, activeProjectId);
  const stepLabel = getStepLabel(step.id, activeProjectId);

  return (
    <Card className="grid gap-3">
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
          <a href={stepHref}>{stepLabel}</a>
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
  );
}

function getStepHref(
  stepId: CurrentUserResponse["memberships"][number]["onboarding"]["steps"][number]["id"],
  activeOrganizationId: string,
  activeProjectId?: string
) {
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

  return stepHref[stepId];
}

function getStepLabel(
  stepId: CurrentUserResponse["memberships"][number]["onboarding"]["steps"][number]["id"],
  activeProjectId?: string
) {
  const stepLabel = {
    api_key_created: activeProjectId ? "Create first API key" : "Create a project first",
    first_event_ingested: activeProjectId ? "Send first event" : "Create a project first",
    member_invited: "Invite teammate",
    project_created: "Create first project"
  } as const;

  return stepLabel[stepId];
}

function formatIsoDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
