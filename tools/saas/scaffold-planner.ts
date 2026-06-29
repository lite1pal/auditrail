import { existsSync } from "node:fs";
import { relative, resolve } from "node:path";

import type {
  FrameworkAgentTaskDefinition,
  FrameworkCheckDefinition
} from "../../packages/framework/src/index.js";
import { extractionManifest } from "../extraction/manifest.js";
import {
  defaultExtractionOutputPath,
  extractionReadmePath,
  extractionReportPath
} from "../extraction/output.js";
import {
  createPlaceholderProductFiles,
  placeholderProduct,
  requiredPlaceholderScaffoldFiles
} from "../extraction/placeholder-product.js";
import {
  createExtractionDryRunPlan,
  type ExtractionDryRunPlan
} from "../extraction/planner.js";

const safeScaffoldAppNamePattern = /^[a-z][a-z0-9-]*$/;
const safePackageNamePattern =
  /^(?:@[a-z0-9][a-z0-9-_]*\/)?[a-z0-9][a-z0-9-._]*$/;
const supportedDatabaseProviders = ["postgres"] as const;
const supportedAuthModes = ["magic-link"] as const;
const disallowedOutputRoots = new Set(["apps", "packages", "tools", "docs"]);
const outputConventions = {
  candidateOutputPath: defaultExtractionOutputPath,
  readmePath: `${defaultExtractionOutputPath}/${extractionReadmePath}`,
  reportPath: `${defaultExtractionOutputPath}/${extractionReportPath}`
} as const;

export interface ScaffoldPlanSourceEntry {
  category: string;
  path: string;
  reason: string;
  requiredForMinimalScaffold: boolean;
}

export interface ScaffoldPlanReplacement {
  from: string;
  id: string;
  target: string;
  to: string;
}

export interface ScaffoldPlanBundle {
  aiWorkflow: {
    recommendedCommands: readonly string[];
    reportFields: readonly string[];
    stopConditions: readonly string[];
    suggestedPrompt: string;
    task: FrameworkAgentTaskDefinition;
  };
  appIdentity: {
    packageName: string;
    productName: string;
    replacements: readonly ScaffoldPlanReplacement[];
  };
  extractionSummary: {
    byAction: ExtractionDryRunPlan["summary"]["byAction"];
    byCategory: ExtractionDryRunPlan["summary"]["byCategory"];
    byOwnershipSection: ExtractionDryRunPlan["summary"]["byOwnershipSection"];
    trackedFileCount: number;
    warnings: readonly string[];
  };
  futureGeneratorCommands: readonly string[];
  limitations: readonly string[];
  outputConventions: {
    candidateOutputPath: string;
    readmePath: string;
    reportPath: string;
  };
  planner: {
    appName: string;
    authMode: string;
    databaseProvider: string;
    outputDirectory: string;
    packageName: string;
    productName: string;
  };
  productSetup: {
    onboardingStepIds: readonly string[];
    placeholderFiles: readonly string[];
    placeholderProductId: string;
    placeholderProductName: string;
    requiredScaffoldFiles: readonly string[];
    usageMeterKeys: readonly string[];
  };
  qualityGates: {
    checks: readonly FrameworkCheckDefinition[];
  };
  runtimeConfig: {
    authNotes: readonly string[];
    cookieNotes: readonly string[];
    envTemplateNotes: readonly string[];
    expectedEnvVars: readonly string[];
    publicUrlNotes: readonly string[];
  };
  source: {
    copiedFromBoilerplateCandidate: readonly ScaffoldPlanSourceEntry[];
    excludedAsProductSpecific: readonly ScaffoldPlanSourceEntry[];
    generatedFromPlaceholderTemplates: readonly ScaffoldPlanSourceEntry[];
    manualReview: readonly ScaffoldPlanSourceEntry[];
  };
  supportedOptions: {
    authMode: {
      default: string;
      supported: readonly string[];
    };
    databaseProvider: {
      default: string;
      supported: readonly string[];
    };
    outputDirectory: {
      default: string;
    };
    packageName: {
      default: string;
    };
    productName: {
      default: string;
    };
  };
  unsupportedFutureFeatures: readonly string[];
}

export function createScaffoldPlan(input: {
  appName: string;
  authMode?: string;
  databaseProvider?: string;
  outputDirectory?: string;
  packageName?: string;
  productName?: string;
  repoRoot: string;
}): ScaffoldPlanBundle {
  const repoRoot = resolve(input.repoRoot);
  const appName = validateAppName(input.appName);
  const packageName = validatePackageName(input.packageName ?? appName);
  const productName = validateProductName(
    input.productName ?? toTitleCase(appName)
  );
  const outputDirectory = resolveSafeScaffoldOutputDirectory({
    outputDirectory: input.outputDirectory ?? appName,
    repoRoot
  });
  const databaseProvider = validateSupportedValue({
    label: "database provider",
    supportedValues: supportedDatabaseProviders,
    value: input.databaseProvider ?? "postgres"
  });
  const authMode = validateSupportedValue({
    label: "auth mode",
    supportedValues: supportedAuthModes,
    value: input.authMode ?? "magic-link"
  });
  const extractionPlan = createExtractionDryRunPlan({
    repoRoot
  });

  if (extractionPlan.errors.length > 0) {
    throw new Error(
      [
        "Scaffold planning failed because extraction metadata is not currently safe to consume.",
        ...extractionPlan.errors.slice(0, 8).map((error) => `- ${error}`)
      ].join("\n")
    );
  }

  const placeholderFiles = createPlaceholderProductFiles().map((file) => file.path);
  const recommendedCommands = [
    `pnpm saas plan scaffold ${appName}`,
    "pnpm check:extraction",
    `pnpm extract:boilerplate -- --output ${defaultExtractionOutputPath}`,
    "pnpm check:extraction:placeholder",
    "pnpm saas doctor",
    "pnpm saas agent context resource <resource-spec.json>",
    "pnpm saas agent recipe resource-install <resource-spec.json>"
  ] as const;
  const reportFields = [
    "app name",
    "target directory",
    "planner warnings",
    "manual-review items",
    "commands reviewed",
    "checks run",
    "checks skipped with reasons",
    "known risks",
    "next suggested task"
  ] as const;
  const stopConditions = [
    "Stop if extraction dry-run metadata reports errors or unmatched classifications.",
    "Stop if placeholder product validation assumptions change and the generated candidate no longer proves the generic seams.",
    "Stop if the requested database provider or auth mode is unsupported.",
    "Stop if the output directory points at an existing or source-owned path.",
    "Stop if the task expands into actual scaffold generation, package publishing, repo creation, or runtime mutation."
  ] as const;

  return {
    aiWorkflow: {
      recommendedCommands,
      reportFields,
      stopConditions,
      suggestedPrompt: [
        `Plan the future scaffold creation for \`${appName}\` only.`,
        "Reuse the extraction dry-run metadata, placeholder product seams, framework doctor, and generated-resource agent commands.",
        "Do not create files, publish packages, create a repo, or mutate runtime source.",
        "Report planner warnings, manual-review items, supported options, and the next follow-up task."
      ].join("\n"),
      task: {
        allowedPaths: [
          "tools/saas/**",
          "tools/extraction/**",
          "packages/framework/**",
          "tasks/workflow.txt"
        ],
        contextFiles: [
          "AGENTS.md",
          "docs/08-agent-quickstart.md",
          "docs/01-agent-engineering-rules.md",
          "docs/02-architecture.md",
          "docs/04-quality-gates.md",
          "docs/05-next-steps.md",
          "tools/extraction/README.md",
          "packages/framework/src/index.ts",
          "tools/saas/scaffold-planner.ts"
        ],
        forbiddenPaths: [
          "apps/api/src/modules/audit-events/**",
          "apps/web/src/features/audit-events/**",
          "packages/domain/src/audit-events/**",
          "apps/api/**",
          "apps/web/**",
          "packages/db/**",
          "apps/worker/**"
        ],
        goal: `Plan the future create-saas-app scaffold for \`${appName}\` without writing scaffold output or touching runtime source.`,
        id: `scaffold-plan-${appName}`,
        reportFields,
        requiredChecks: createScaffoldQualityChecks(appName).map(
          (check) => check.command
        ),
        stopConditions,
        taskType: "scaffold-plan"
      }
    },
    appIdentity: {
      packageName,
      productName,
      replacements: [
        {
          from: "placeholder-product",
          id: "placeholder-product-id",
          target: "placeholder product definition id",
          to: appName
        },
        {
          from: "Placeholder Product",
          id: "placeholder-product-name",
          target: "placeholder product name, shell copy, and onboarding copy",
          to: productName
        },
        {
          from: "auditrail",
          id: "workspace-package-name",
          target: "root package metadata and future scaffold package metadata",
          to: packageName
        },
        {
          from: "AuditTrail",
          id: "readme-branding",
          target: "README title and operator-facing branding",
          to: productName
        }
      ],
    },
    extractionSummary: {
      byAction: extractionPlan.summary.byAction,
      byCategory: extractionPlan.summary.byCategory,
      byOwnershipSection: extractionPlan.summary.byOwnershipSection,
      trackedFileCount: extractionPlan.trackedFileCount,
      warnings: [...extractionPlan.warnings]
    },
    futureGeneratorCommands: [
      "pnpm check:extraction-manifest",
      "pnpm check:extraction",
      `pnpm extract:boilerplate -- --output ${defaultExtractionOutputPath}`,
      "pnpm check:extraction:placeholder",
      "pnpm saas doctor"
    ],
    limitations: [
      "Planning only: no scaffold files are created by this command.",
      "Only the current Postgres plus magic-link stack is described in this slice.",
      "Manual-review extraction paths still block any claim of a finished public scaffold.",
      "Generated-resource commands remain separate follow-up tooling after scaffold creation."
    ],
    outputConventions: {
      ...outputConventions
    },
    planner: {
      appName,
      authMode,
      databaseProvider,
      outputDirectory,
      packageName,
      productName
    },
    productSetup: {
      onboardingStepIds: placeholderProduct.onboardingSteps.map((step) => step.id),
      placeholderFiles,
      placeholderProductId: placeholderProduct.id,
      placeholderProductName: placeholderProduct.name,
      requiredScaffoldFiles: [...requiredPlaceholderScaffoldFiles],
      usageMeterKeys: placeholderProduct.usageMeters.map((meter) => meter.key)
    },
    qualityGates: {
      checks: createScaffoldQualityChecks(appName)
    },
    runtimeConfig: {
      authNotes: [
        "Only magic-link auth is planned in this slice.",
        "Email sender and delivery provider wiring remain deployment-time follow-up, not scaffold-generation behavior."
      ],
      cookieNotes: [
        "Browser auth expects explicit cookie and session configuration from the current platform auth stack.",
        "Future scaffold creation should keep cookie naming and security settings template-driven rather than product-specific."
      ],
      envTemplateNotes: [
        "Environment files should preserve the current root -> app-local -> process-env precedence.",
        "Service URLs should stay explicit; defaults are acceptable only for non-secret process settings."
      ],
      expectedEnvVars: [
        "DATABASE_URL",
        "TEST_DATABASE_URL",
        "API_KEY_PEPPER",
        "API_HOST",
        "API_PORT",
        "RATE_LIMIT_MAX",
        "RATE_LIMIT_WINDOW",
        "NODE_ENV"
      ],
      publicUrlNotes: [
        "Future scaffold creation should template explicit browser and API base URLs.",
        "Cookie domain and public URL settings remain operator configuration, not planner-time mutations."
      ]
    },
    source: {
      copiedFromBoilerplateCandidate: summarizeManifestEntries(
        extractionManifest.copyToBoilerplate.entries.filter(
          (entry) => entry.requiredForMinimalScaffold
        )
      ),
      excludedAsProductSpecific: summarizeManifestEntries(
        extractionManifest.productSpecific.entries
      ),
      generatedFromPlaceholderTemplates: summarizePlaceholderEntries(
        placeholderFiles
      ),
      manualReview: summarizeManifestEntries(
        extractionManifest.requiresManualReview.entries.filter(
          (entry) => entry.requiredForMinimalScaffold
        )
      )
    },
    supportedOptions: {
      authMode: {
        default: "magic-link",
        supported: [...supportedAuthModes]
      },
      databaseProvider: {
        default: "postgres",
        supported: [...supportedDatabaseProviders]
      },
      outputDirectory: {
        default: appName
      },
      packageName: {
        default: appName
      },
      productName: {
        default: toTitleCase(appName)
      }
    },
    unsupportedFutureFeatures: [
      "npm create-* package",
      "published framework package",
      "MCP server",
      "OpenAPI or client generation",
      "provider plugin marketplace",
      "automatic deployment provisioning",
      "actual scaffold creation in this command",
      "Git repository creation"
    ]
  };
}

export function formatScaffoldPlanMarkdown(bundle: ScaffoldPlanBundle) {
  const lines = [
    `Scaffold plan: ${bundle.planner.appName}`,
    "",
    "Summary",
    `- app name: ${bundle.planner.appName}`,
    `- package name: ${bundle.planner.packageName}`,
    `- product name: ${bundle.planner.productName}`,
    `- target directory: ${bundle.planner.outputDirectory}`,
    `- database provider: ${bundle.planner.databaseProvider}`,
    `- auth mode: ${bundle.planner.authMode}`,
    "",
    "Supported Options",
    `- package name default: ${bundle.supportedOptions.packageName.default}`,
    `- product name default: ${bundle.supportedOptions.productName.default}`,
    `- output directory default: ${bundle.supportedOptions.outputDirectory.default}`,
    `- database providers: ${bundle.supportedOptions.databaseProvider.supported.join(", ")}`,
    `- auth modes: ${bundle.supportedOptions.authMode.supported.join(", ")}`,
    "",
    "Source",
    `- extracted candidate output: ${bundle.outputConventions.candidateOutputPath}`,
    `- extraction README: ${bundle.outputConventions.readmePath}`,
    `- extraction report: ${bundle.outputConventions.reportPath}`,
    `- tracked files: ${bundle.extractionSummary.trackedFileCount}`,
    `- copy: ${bundle.extractionSummary.byAction.copy}`,
    `- exclude: ${bundle.extractionSummary.byAction.exclude}`,
    `- template: ${bundle.extractionSummary.byAction.template}`,
    `- manual-review: ${bundle.extractionSummary.byAction["manual-review"]}`,
    ...formatEntrySection(
      "Copied From Boilerplate Candidate",
      bundle.source.copiedFromBoilerplateCandidate
    ),
    ...formatEntrySection(
      "Excluded As Product Specific",
      bundle.source.excludedAsProductSpecific
    ),
    ...formatEntrySection(
      "Generated From Placeholder Templates",
      bundle.source.generatedFromPlaceholderTemplates
    ),
    ...formatEntrySection("Manual Review", bundle.source.manualReview),
    "",
    "App Identity",
    ...bundle.appIdentity.replacements.map(
      (replacement) =>
        `- ${replacement.target}: ${replacement.from} -> ${replacement.to}`
    ),
    "",
    "Product Setup",
    `- placeholder product id: ${bundle.productSetup.placeholderProductId}`,
    `- placeholder product name: ${bundle.productSetup.placeholderProductName}`,
    `- placeholder files: ${bundle.productSetup.placeholderFiles.join(", ")}`,
    `- required scaffold files: ${bundle.productSetup.requiredScaffoldFiles.join(", ")}`,
    `- onboarding steps: ${bundle.productSetup.onboardingStepIds.join(", ")}`,
    `- usage meters: ${bundle.productSetup.usageMeterKeys.join(", ")}`,
    "",
    "Runtime Config",
    ...bundle.runtimeConfig.envTemplateNotes.map((note) => `- ${note}`),
    ...bundle.runtimeConfig.authNotes.map((note) => `- ${note}`),
    ...bundle.runtimeConfig.cookieNotes.map((note) => `- ${note}`),
    ...bundle.runtimeConfig.publicUrlNotes.map((note) => `- ${note}`),
    `- expected env vars: ${bundle.runtimeConfig.expectedEnvVars.join(", ")}`,
    "",
    "Quality Gates",
    ...bundle.qualityGates.checks.map((check) => `- ${check.command}`),
    "",
    "Future Generator Commands",
    ...bundle.futureGeneratorCommands.map((command) => `- ${command}`),
    "",
    "AI Workflow",
    ...bundle.aiWorkflow.recommendedCommands.map((command) => `- ${command}`),
    ...bundle.aiWorkflow.stopConditions.map((condition) => `- ${condition}`),
    ...bundle.aiWorkflow.reportFields.map((field) => `- report field: ${field}`),
    "",
    "Unsupported Future Features",
    ...bundle.unsupportedFutureFeatures.map((feature) => `- ${feature}`),
    "",
    "Warnings",
    ...(bundle.extractionSummary.warnings.length > 0
      ? bundle.extractionSummary.warnings.map((warning) => `- ${warning}`)
      : ["- none"]),
    "",
    "Limitations",
    ...bundle.limitations.map((limitation) => `- ${limitation}`),
    "",
    "Suggested Prompt",
    bundle.aiWorkflow.suggestedPrompt
  ];

  return `${lines.join("\n")}\n`;
}

function validateAppName(appName: string) {
  const normalized = appName.trim();

  if (!safeScaffoldAppNamePattern.test(normalized)) {
    throw new Error(
      "Invalid app name. Use lowercase letters, numbers, and hyphens only, and start with a letter."
    );
  }

  return normalized;
}

function validatePackageName(packageName: string) {
  const normalized = packageName.trim();

  if (!safePackageNamePattern.test(normalized)) {
    throw new Error(
      "Invalid package name. Use a safe npm-style package name such as `my-saas-app` or `@scope/my-saas-app`."
    );
  }

  return normalized;
}

function validateProductName(productName: string) {
  const normalized = productName.trim();

  if (normalized.length === 0) {
    throw new Error("Invalid product name. Use a non-empty product name.");
  }

  return normalized;
}

function validateSupportedValue<TValue extends readonly string[]>(input: {
  label: string;
  supportedValues: TValue;
  value: string;
}) {
  if (
    !input.supportedValues.includes(
      input.value as TValue[number]
    )
  ) {
    throw new Error(
      `Unsupported ${input.label} '${input.value}'. Supported values: ${input.supportedValues.join(", ")}.`
    );
  }

  return input.value;
}

function resolveSafeScaffoldOutputDirectory(input: {
  outputDirectory: string;
  repoRoot: string;
}) {
  const requested = input.outputDirectory.trim();

  if (requested.length === 0) {
    throw new Error("Invalid output directory. Use a non-empty directory name.");
  }

  const absolute = resolve(input.repoRoot, requested);
  const relativePath = relative(input.repoRoot, absolute).replace(/\\/g, "/");

  if (
    relativePath.length === 0 ||
    relativePath === "." ||
    relativePath.startsWith("../")
  ) {
    throw new Error(
      `Unsafe scaffold output directory '${input.outputDirectory}'. Target must stay inside the repository and use a dedicated subdirectory.`
    );
  }

  const [prefix] = relativePath.split("/");

  if (disallowedOutputRoots.has(prefix)) {
    throw new Error(
      `Unsafe scaffold output directory '${input.outputDirectory}'. Target must not point at source-owned roots such as apps/, packages/, tools/, or docs/.`
    );
  }

  if (existsSync(absolute)) {
    throw new Error(
      `Unsafe scaffold output directory '${input.outputDirectory}'. Target already exists; planning requires a new dedicated directory.`
    );
  }

  return relativePath;
}

function createScaffoldQualityChecks(appName: string) {
  return [
    {
      appliesToPaths: ["tools/architecture-boundaries/**"],
      command: "pnpm check:boundaries",
      id: "boundaries",
      required: true
    },
    {
      appliesToPaths: ["tools/extraction/**"],
      command: "pnpm check:extraction-manifest",
      id: "extraction-manifest",
      required: true
    },
    {
      appliesToPaths: ["tools/extraction/**"],
      command: "pnpm check:extraction",
      id: "extraction-dry-run",
      required: true
    },
    {
      appliesToPaths: ["tools/extraction/**"],
      command: "pnpm check:extraction:placeholder",
      id: "placeholder-validation",
      required: true
    },
    {
      appliesToPaths: ["tools/saas/**", "packages/framework/**"],
      command: "pnpm saas doctor",
      id: "saas-doctor",
      required: true
    },
    {
      appliesToPaths: ["tools/saas/**"],
      command: `pnpm saas plan scaffold ${appName}`,
      id: "scaffold-plan",
      required: true
    },
    {
      appliesToPaths: ["packages/framework/**"],
      command: "pnpm --filter @auditrail/framework typecheck",
      id: "framework-typecheck",
      required: true
    },
    {
      appliesToPaths: ["packages/framework/**"],
      command: "pnpm --filter @auditrail/framework test",
      id: "framework-test",
      required: true
    },
    {
      appliesToPaths: ["apps/**", "packages/**", "tools/**"],
      command: "pnpm typecheck",
      id: "workspace-typecheck",
      required: true
    },
    {
      appliesToPaths: ["apps/**", "packages/**", "tools/**"],
      command: "pnpm test",
      id: "workspace-test",
      required: true
    },
    {
      appliesToPaths: ["apps/**", "packages/**", "tools/**"],
      command: "pnpm verify",
      id: "verify",
      required: true
    }
  ] as const satisfies readonly FrameworkCheckDefinition[];
}

function summarizeManifestEntries(
  entries: readonly {
    category: string;
    path: string;
    reason: string;
    requiredForMinimalScaffold: boolean;
  }[]
) {
  return [...entries]
    .map((entry) => ({
      category: entry.category,
      path: entry.path,
      reason: entry.reason,
      requiredForMinimalScaffold: entry.requiredForMinimalScaffold
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
}

function summarizePlaceholderEntries(paths: readonly string[]) {
  return [...paths]
    .map((path) => ({
      category: "platform-extension",
      path,
      reason:
        "Generate placeholder product config, shell navigation, and onboarding adapters from the validated placeholder product metadata.",
      requiredForMinimalScaffold: true
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
}

function formatEntrySection(
  heading: string,
  entries: readonly ScaffoldPlanSourceEntry[]
) {
  return [
    "",
    `${heading} (${entries.length})`,
    ...entries.map(
      (entry) => `- ${entry.path} [${entry.category}] (${entry.reason})`
    )
  ];
}

function toTitleCase(value: string) {
  return value
    .split("-")
    .filter((segment) => segment.length > 0)
    .map((segment) => `${segment[0]?.toUpperCase() ?? ""}${segment.slice(1)}`)
    .join(" ");
}
