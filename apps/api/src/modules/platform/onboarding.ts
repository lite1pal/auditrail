import type {
  OnboardingStepDefinition,
  OnboardingSummary
} from "@auditrail/domain";

export const platformAuditOnboardingStepIds = [
  "project_created",
  "api_key_created",
  "first_event_ingested",
  "member_invited"
] as const;

export type PlatformAuditOnboardingStepId =
  (typeof platformAuditOnboardingStepIds)[number];

export type PlatformAuditOnboardingSummary =
  OnboardingSummary<PlatformAuditOnboardingStepId>;

export const platformAuditOnboardingSteps: readonly OnboardingStepDefinition<PlatformAuditOnboardingStepId>[] =
  [
    {
      id: "project_created",
      required: true
    },
    {
      id: "api_key_created",
      required: true
    },
    {
      id: "first_event_ingested",
      required: true
    },
    {
      id: "member_invited",
      required: false
    }
  ];

export function toPlatformAuditOnboardingCompletedAtByStep(input: {
  apiKeyCreatedAt?: string;
  firstEventIngestedAt?: string;
  memberInvitedAt?: string;
  projectCreatedAt?: string;
}): Partial<Record<PlatformAuditOnboardingStepId, string>> {
  return {
    api_key_created: input.apiKeyCreatedAt,
    first_event_ingested: input.firstEventIngestedAt,
    member_invited: input.memberInvitedAt,
    project_created: input.projectCreatedAt
  };
}
