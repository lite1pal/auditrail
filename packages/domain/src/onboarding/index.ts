export const onboardingStepIds = [
  "project_created",
  "api_key_created",
  "first_event_ingested",
  "member_invited"
] as const;

export type OnboardingStepId = (typeof onboardingStepIds)[number];

export type OnboardingStepStatus = "complete" | "pending";

export interface OnboardingStepSummary {
  completedAt?: string;
  id: OnboardingStepId;
  required: boolean;
  status: OnboardingStepStatus;
}

export interface OnboardingSummary {
  completedRequiredSteps: number;
  dismissedAt?: string;
  isComplete: boolean;
  isDismissed: boolean;
  steps: OnboardingStepSummary[];
  totalRequiredSteps: number;
}

export interface OnboardingProgressFacts {
  apiKeyCreatedAt?: string;
  dismissedAt?: string;
  firstEventIngestedAt?: string;
  memberInvitedAt?: string;
  projectCreatedAt?: string;
}

const requiredSteps = new Set<OnboardingStepId>([
  "project_created",
  "api_key_created",
  "first_event_ingested"
]);

export function isRequiredOnboardingStep(stepId: OnboardingStepId) {
  return requiredSteps.has(stepId);
}

export function summarizeOnboardingProgress(
  facts: OnboardingProgressFacts
): OnboardingSummary {
  const steps = onboardingStepIds.map((stepId) =>
    toStepSummary(stepId, facts)
  );
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

function toStepSummary(
  stepId: OnboardingStepId,
  facts: OnboardingProgressFacts
): OnboardingStepSummary {
  const completedAt = getStepCompletedAt(stepId, facts);

  return {
    completedAt,
    id: stepId,
    required: isRequiredOnboardingStep(stepId),
    status: completedAt ? "complete" : "pending"
  };
}

function getStepCompletedAt(
  stepId: OnboardingStepId,
  facts: OnboardingProgressFacts
) {
  switch (stepId) {
    case "project_created":
      return facts.projectCreatedAt;
    case "api_key_created":
      return facts.apiKeyCreatedAt;
    case "first_event_ingested":
      return facts.firstEventIngestedAt;
    case "member_invited":
      return facts.memberInvitedAt;
  }
}
