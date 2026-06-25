export type OnboardingStepStatus = "complete" | "pending";

export interface OnboardingStepDefinition<TStepId extends string = string> {
  id: TStepId;
  required: boolean;
}

export interface OnboardingStepSummary<TStepId extends string = string> {
  completedAt?: string;
  id: TStepId;
  required: boolean;
  status: OnboardingStepStatus;
}

export interface OnboardingSummary<TStepId extends string = string> {
  completedRequiredSteps: number;
  dismissedAt?: string;
  isComplete: boolean;
  isDismissed: boolean;
  steps: OnboardingStepSummary<TStepId>[];
  totalRequiredSteps: number;
}

export interface OnboardingProgressFacts<TStepId extends string = string> {
  completedAtByStep?: Partial<Record<TStepId, string>>;
  dismissedAt?: string;
  steps: readonly OnboardingStepDefinition<TStepId>[];
}

export function isRequiredOnboardingStep<TStepId extends string>(
  stepId: TStepId,
  steps: readonly OnboardingStepDefinition<TStepId>[]
) {
  return steps.some((step) => step.id === stepId && step.required);
}

export function summarizeOnboardingProgress<TStepId extends string>(
  facts: OnboardingProgressFacts<TStepId>
): OnboardingSummary<TStepId> {
  const steps = facts.steps.map((step) => toStepSummary(step, facts));
  const totalRequiredSteps = steps.filter((step) => step.required).length;
  const completedRequiredSteps = steps.filter(
    (step) => step.required && step.status === "complete"
  ).length;
  const dismissedAt = facts.dismissedAt;

  return {
    completedRequiredSteps,
    dismissedAt,
    isComplete: completedRequiredSteps === totalRequiredSteps,
    isDismissed: Boolean(dismissedAt),
    steps,
    totalRequiredSteps
  };
}

function toStepSummary<TStepId extends string>(
  step: OnboardingStepDefinition<TStepId>,
  facts: OnboardingProgressFacts<TStepId>
): OnboardingStepSummary<TStepId> {
  const completedAt = facts.completedAtByStep?.[step.id];

  return {
    completedAt,
    id: step.id,
    required: step.required,
    status: completedAt ? "complete" : "pending"
  };
}
