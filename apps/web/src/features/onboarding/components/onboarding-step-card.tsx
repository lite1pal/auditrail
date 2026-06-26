import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import type { OnboardingStepView } from "@/src/features/onboarding/domain/onboarding-screen";

interface OnboardingStepCardProps {
  ingestCommand?: string;
  step: OnboardingStepView;
}

export function OnboardingStepCard({
  ingestCommand,
  step
}: OnboardingStepCardProps) {
  return (
    <Card className="grid gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold">{step.title}</h2>
            <Badge>{step.required ? "Required" : "Optional"}</Badge>
            <Badge>{step.status === "complete" ? "Complete" : "Pending"}</Badge>
          </div>
          <p className="text-sm text-[var(--muted)]">{step.description}</p>
          {step.completedAt ? (
            <p className="text-xs text-[var(--muted)]">
              Completed {formatIsoDate(step.completedAt)}
            </p>
          ) : null}
        </div>
        <Button asChild variant="secondary">
          <a href={step.ctaHref}>{step.ctaLabel}</a>
        </Button>
      </div>
      {step.showsIngestCommand && ingestCommand ? (
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

function formatIsoDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
