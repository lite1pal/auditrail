import { z } from "zod";

import type { FrameworkOwnershipMode } from "./index.js";

const nonEmptyStringSchema = z.string().trim().min(1);
const frameworkProductOwnershipModeSchema = z.enum([
  "organization",
  "user",
  "global",
  "none"
]);

export const frameworkProductCapabilityKinds = [
  "resource",
  "api",
  "ui",
  "navigation",
  "onboarding",
  "billing",
  "entitlement",
  "meter",
  "job",
  "webhook"
] as const;

export type FrameworkProductCapabilityKind =
  (typeof frameworkProductCapabilityKinds)[number];

export const frameworkProductRuntimeSurfaces = [
  "api",
  "web",
  "worker"
] as const;

export type FrameworkProductRuntimeSurface =
  (typeof frameworkProductRuntimeSurfaces)[number];

export interface FrameworkProductCopy {
  emptyStateDescription: string;
  emptyStateTitle: string;
  primaryCtaHref?: string;
  primaryCtaLabel?: string;
}

export interface FrameworkProductNavItem {
  href: string;
  id: string;
  label: string;
}

export interface FrameworkProductUsageMeter {
  key: string;
  label: string;
}

export interface FrameworkProductOnboardingStep {
  id: string;
  required: boolean;
}

export interface FrameworkProductChrome {
  errorHeading: string;
  loadingLabel: string;
  metadataDescription: string;
  metadataTitle: string;
}

export interface FrameworkProductOnboardingAction {
  label: string;
  target: string;
}

export interface FrameworkProductOnboardingStepContent {
  action: FrameworkProductOnboardingAction;
  description: string;
  missingProjectAction?: FrameworkProductOnboardingAction;
  showsIngestCommand?: boolean;
  stepId: string;
  title: string;
}

export interface FrameworkProductOnboardingContent {
  completeSummaryDescription: string;
  dismissFromSidebarLabel: string;
  eyebrow: string;
  incompleteSummaryDescription: string;
  showInSidebarLabel: string;
  stepContent: readonly FrameworkProductOnboardingStepContent[];
  title: string;
}

export interface FrameworkProductOwnedResource {
  id: string;
  navigationId?: string;
  ownership: FrameworkOwnershipMode;
  routeBasePath?: string;
}

export interface FrameworkProductCapability {
  description?: string;
  id: string;
  kind: FrameworkProductCapabilityKind;
}

export interface FrameworkProductRuntimeRegistration {
  description?: string;
  id: string;
  surface: FrameworkProductRuntimeSurface;
  target: string;
}

export interface FrameworkProductModuleManifest {
  capabilities: readonly FrameworkProductCapability[];
  chrome?: FrameworkProductChrome;
  description?: string;
  emptyStateCopy: FrameworkProductCopy;
  id: string;
  name: string;
  navItems: readonly FrameworkProductNavItem[];
  onboardingContent: FrameworkProductOnboardingContent;
  onboardingSteps: readonly FrameworkProductOnboardingStep[];
  resources: readonly FrameworkProductOwnedResource[];
  runtime: {
    registrations: readonly FrameworkProductRuntimeRegistration[];
  };
  usageMeters: readonly FrameworkProductUsageMeter[];
}

export const frameworkProductCapabilityKindSchema = z.enum(
  frameworkProductCapabilityKinds
);

export const frameworkProductRuntimeSurfaceSchema = z.enum(
  frameworkProductRuntimeSurfaces
);

export const frameworkProductCopySchema = z.object({
  emptyStateDescription: nonEmptyStringSchema,
  emptyStateTitle: nonEmptyStringSchema,
  primaryCtaHref: nonEmptyStringSchema.optional(),
  primaryCtaLabel: nonEmptyStringSchema.optional()
}) satisfies z.ZodType<FrameworkProductCopy>;

export const frameworkProductNavItemSchema = z.object({
  href: nonEmptyStringSchema,
  id: nonEmptyStringSchema,
  label: nonEmptyStringSchema
}) satisfies z.ZodType<FrameworkProductNavItem>;

export const frameworkProductUsageMeterSchema = z.object({
  key: nonEmptyStringSchema,
  label: nonEmptyStringSchema
}) satisfies z.ZodType<FrameworkProductUsageMeter>;

export const frameworkProductOnboardingStepSchema = z.object({
  id: nonEmptyStringSchema,
  required: z.boolean()
}) satisfies z.ZodType<FrameworkProductOnboardingStep>;

export const frameworkProductChromeSchema = z.object({
  errorHeading: nonEmptyStringSchema,
  loadingLabel: nonEmptyStringSchema,
  metadataDescription: nonEmptyStringSchema,
  metadataTitle: nonEmptyStringSchema
}) satisfies z.ZodType<FrameworkProductChrome>;

export const frameworkProductOnboardingActionSchema = z.object({
  label: nonEmptyStringSchema,
  target: nonEmptyStringSchema
}) satisfies z.ZodType<FrameworkProductOnboardingAction>;

export const frameworkProductOnboardingStepContentSchema = z.object({
  action: frameworkProductOnboardingActionSchema,
  description: nonEmptyStringSchema,
  missingProjectAction: frameworkProductOnboardingActionSchema.optional(),
  showsIngestCommand: z.boolean().optional(),
  stepId: nonEmptyStringSchema,
  title: nonEmptyStringSchema
}) satisfies z.ZodType<FrameworkProductOnboardingStepContent>;

export const frameworkProductOnboardingContentSchema = z.object({
  completeSummaryDescription: nonEmptyStringSchema,
  dismissFromSidebarLabel: nonEmptyStringSchema,
  eyebrow: nonEmptyStringSchema,
  incompleteSummaryDescription: nonEmptyStringSchema,
  showInSidebarLabel: nonEmptyStringSchema,
  stepContent: z.array(frameworkProductOnboardingStepContentSchema),
  title: nonEmptyStringSchema
}) satisfies z.ZodType<FrameworkProductOnboardingContent>;

export const frameworkProductOwnedResourceSchema = z.object({
  id: nonEmptyStringSchema,
  navigationId: nonEmptyStringSchema.optional(),
  ownership: frameworkProductOwnershipModeSchema,
  routeBasePath: nonEmptyStringSchema.optional()
}) satisfies z.ZodType<FrameworkProductOwnedResource>;

export const frameworkProductCapabilitySchema = z.object({
  description: nonEmptyStringSchema.optional(),
  id: nonEmptyStringSchema,
  kind: frameworkProductCapabilityKindSchema
}) satisfies z.ZodType<FrameworkProductCapability>;

export const frameworkProductRuntimeRegistrationSchema = z.object({
  description: nonEmptyStringSchema.optional(),
  id: nonEmptyStringSchema,
  surface: frameworkProductRuntimeSurfaceSchema,
  target: nonEmptyStringSchema
}) satisfies z.ZodType<FrameworkProductRuntimeRegistration>;

export const frameworkProductModuleManifestSchema = z
  .object({
    capabilities: z.array(frameworkProductCapabilitySchema),
    chrome: frameworkProductChromeSchema.optional(),
    description: nonEmptyStringSchema.optional(),
    emptyStateCopy: frameworkProductCopySchema,
    id: nonEmptyStringSchema,
    name: nonEmptyStringSchema,
    navItems: z.array(frameworkProductNavItemSchema),
    onboardingContent: frameworkProductOnboardingContentSchema,
    onboardingSteps: z.array(frameworkProductOnboardingStepSchema),
    resources: z.array(frameworkProductOwnedResourceSchema),
    runtime: z.object({
      registrations: z.array(frameworkProductRuntimeRegistrationSchema)
    }),
    usageMeters: z.array(frameworkProductUsageMeterSchema)
  })
  .superRefine((value, context) => {
    addDuplicateIssues({
      context,
      label: "navigation item",
      path: ["navItems"],
      values: value.navItems.map((item) => item.id)
    });
    addDuplicateIssues({
      context,
      label: "onboarding step",
      path: ["onboardingSteps"],
      values: value.onboardingSteps.map((step) => step.id)
    });
    addDuplicateIssues({
      context,
      label: "usage meter",
      path: ["usageMeters"],
      values: value.usageMeters.map((meter) => meter.key)
    });
    addDuplicateIssues({
      context,
      label: "resource",
      path: ["resources"],
      values: value.resources.map((resource) => resource.id)
    });
    addDuplicateIssues({
      context,
      label: "capability",
      path: ["capabilities"],
      values: value.capabilities.map((capability) => capability.id)
    });
    addDuplicateIssues({
      context,
      label: "runtime registration",
      path: ["runtime", "registrations"],
      values: value.runtime.registrations.map((registration) => registration.id)
    });

    const stepIds = new Set(value.onboardingSteps.map((step) => step.id));
    const contentStepIds = new Set(
      value.onboardingContent.stepContent.map((step) => step.stepId)
    );

    for (const stepId of stepIds) {
      if (!contentStepIds.has(stepId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Missing onboarding content for step '${stepId}'.`,
          path: ["onboardingContent", "stepContent"]
        });
      }
    }

    for (const stepId of contentStepIds) {
      if (!stepIds.has(stepId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Onboarding content references unknown step '${stepId}'.`,
          path: ["onboardingContent", "stepContent"]
        });
      }
    }
  }) satisfies z.ZodType<FrameworkProductModuleManifest>;

function addDuplicateIssues(input: {
  context: z.RefinementCtx;
  label: string;
  path: readonly (string | number)[];
  values: readonly string[];
}) {
  const seen = new Set<string>();

  for (const value of input.values) {
    if (seen.has(value)) {
      input.context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${input.label} identifiers must be unique.`,
        path: [...input.path]
      });

      return;
    }

    seen.add(value);
  }
}
