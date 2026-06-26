import type { CurrentUserResponse } from "@/src/features/auth/domain/schemas";

export interface OnboardingScreenCopy {
  completeSummaryDescription: string;
  dismissFromSidebarLabel: string;
  emptyStateDescription: string;
  emptyStatePrimaryCtaHref: string;
  emptyStatePrimaryCtaLabel: string;
  eyebrow: string;
  incompleteSummaryDescription: string;
  showInSidebarLabel: string;
  title: string;
}

type CurrentOnboardingStep =
  CurrentUserResponse["memberships"][number]["onboarding"]["steps"][number];

export type OnboardingStepView = CurrentOnboardingStep & {
  ctaHref: string;
  ctaLabel: string;
  description: string;
  showsIngestCommand: boolean;
  title: string;
};
