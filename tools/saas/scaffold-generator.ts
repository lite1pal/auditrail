import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync
} from "node:fs";
import { dirname, extname, relative, resolve } from "node:path";

import {
  createPlaceholderProductFiles,
  placeholderProduct,
  requiredPlaceholderScaffoldFiles
} from "../extraction/placeholder-product.js";
import {
  extractionReadmePath,
  extractionReportPath,
  generateExtractionOutput,
  type ExtractionOutputResult,
  resolveSafeOutputPath
} from "../extraction/output.js";
import {
  createScaffoldPlan,
  type ScaffoldPlanBundle,
  type ScaffoldPlanReplacement
} from "./scaffold-planner.js";

const scaffoldStageRoot = "tmp/saas-scaffold-stage";
const defaultScaffoldOutputRoot = ".generated/scaffolds";
export const scaffoldReportPath = ".saas/scaffold-report.json";
export const scaffoldReadmePath = "README.md";
const scaffoldOwnershipStatus = "local-candidate-scaffold";
const textFileExtensions = new Set([
  ".css",
  ".env",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".mts",
  ".sql",
  ".svg",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml"
]);
const forbiddenImportMatchers = [
  "@auditrail/domain/audit-events",
  "packages/domain/src/audit-events",
  "apps/api/src/modules/audit-events",
  "apps/web/src/features/audit-events",
  "audit-product",
  "auditTrailProduct"
] as const;
const forbiddenIdentityMatchers = [
  "AuditTrail",
  "@auditrail/",
  "auditTrailProduct"
] as const;
const unresolvedPlaceholderMatchers = [
  "<next>",
  "<resource>",
  "<plural>",
  "placeholder-product",
  "Placeholder Product",
  "placeholderProduct"
] as const;
const reportExcludedSafetyPaths = new Set([scaffoldReportPath]);

export interface ScaffoldGeneratedFile {
  origin: "copied" | "generated" | "placeholder" | "templated";
  path: string;
}

export interface ScaffoldSafetyIssue {
  details: string;
  path: string;
  type:
    | "forbidden-import"
    | "product-identity"
    | "unresolved-placeholder";
}

export interface ScaffoldGenerationResult {
  appName: string;
  checks: readonly string[];
  filesExcluded: readonly string[];
  generatedFiles: readonly ScaffoldGeneratedFile[];
  knownLimitations: readonly string[];
  manualReviewItems: readonly {
    category: string;
    path: string;
    reason: string;
  }[];
  outputPath: string;
  packageName: string;
  placeholderProductSetup: {
    onboardingStepIds: readonly string[];
    outputFiles: readonly string[];
    productId: string;
    productName: string;
    requiredScaffoldFiles: readonly string[];
    usageMeterKeys: readonly string[];
  };
  productName: string;
  replacementsApplied: readonly ScaffoldPlanReplacement[];
  reportPath: string;
  safetyIssues: readonly ScaffoldSafetyIssue[];
  scaffoldCommand: string;
  scaffoldReadmePath: string;
}

interface PendingScaffoldFile {
  contents: string;
  origin: ScaffoldGeneratedFile["origin"];
  path: string;
}

interface PersistedScaffoldOwnership {
  appName: string;
  packageName: string;
  productName: string;
  status: string;
}

export function generateScaffold(input: {
  appName: string;
  mutateFilesForTest?: (files: PendingScaffoldFile[]) => void;
  force?: boolean;
  outputPath?: string;
  packageName?: string;
  productName?: string;
  repoRoot: string;
}): ScaffoldGenerationResult {
  const repoRoot = resolve(input.repoRoot);
  const requestedOutputPath =
    input.outputPath ?? createDefaultScaffoldOutputPath(input.appName);
  const outputPath = resolveSafeOutputPath({
    outputPath: requestedOutputPath,
    repoRoot
  });

  prepareOutputDirectory({
    appName: input.appName,
    force: input.force ?? false,
    outputPath,
    repoRoot
  });

  const plan = createScaffoldPlan({
    appName: input.appName,
    outputDirectory: outputPath,
    packageName: input.packageName,
    productName: input.productName,
    repoRoot
  });

  if (plan.extractionSummary.warnings.length > 0) {
    throw new Error(
      [
        "Scaffold generation aborted because the planner reported blocking warnings.",
        ...plan.extractionSummary.warnings.map((warning) => `- ${warning}`)
      ].join("\n")
    );
  }

  const stagePath = resolveSafeOutputPath({
    outputPath: `${scaffoldStageRoot}/${plan.planner.appName}`,
    repoRoot
  });

  try {
    rmSync(resolve(repoRoot, stagePath), {
      force: true,
      recursive: true
    });

    const extraction = generateExtractionOutput({
      clean: true,
      outputPath: stagePath,
      repoRoot
    });
    const files = createScaffoldFiles({
      appName: plan.planner.appName,
      extraction,
      outputPath,
      packageName: plan.planner.packageName,
      plan,
      productName: plan.planner.productName,
      repoRoot,
      stagePath
    });

    input.mutateFilesForTest?.(files);

    const safetyIssues = collectSafetyIssues(files);

    if (safetyIssues.length > 0) {
      throw new Error(formatSafetyIssues(safetyIssues));
    }

    for (const file of files) {
      const absolutePath = resolve(repoRoot, outputPath, file.path);

      mkdirSync(dirname(absolutePath), {
        recursive: true
      });
      writeFileSync(absolutePath, ensureTrailingNewline(file.contents));
    }

    return {
      appName: plan.planner.appName,
      checks: plan.qualityGates.checks.map((check) => check.command),
      filesExcluded: extraction.plan.filesByAction.exclude
        .map((file) => file.path)
        .sort((left, right) => left.localeCompare(right)),
      generatedFiles: files
        .map((file) => ({
          origin: file.origin,
          path: file.path
        }))
        .sort((left, right) => left.path.localeCompare(right.path)),
      knownLimitations: plan.limitations,
      manualReviewItems: plan.source.manualReview.map((item) => ({
        category: item.category,
        path: item.path,
        reason: item.reason
      })),
      outputPath,
      packageName: plan.planner.packageName,
      placeholderProductSetup: {
        onboardingStepIds: plan.productSetup.onboardingStepIds,
        outputFiles: createProductSetupPaths(plan.planner.appName),
        productId: plan.planner.appName,
        productName: plan.planner.productName,
        requiredScaffoldFiles: requiredPlaceholderScaffoldFiles,
        usageMeterKeys: placeholderProduct.usageMeters.map((meter) => meter.key)
      },
      productName: plan.planner.productName,
      replacementsApplied: plan.appIdentity.replacements,
      reportPath: scaffoldReportPath,
      safetyIssues,
      scaffoldCommand: buildScaffoldCommand({
        appName: plan.planner.appName,
        outputPath,
        packageName: input.packageName,
        productName: input.productName
      }),
      scaffoldReadmePath
    };
  } finally {
    rmSync(resolve(repoRoot, stagePath), {
      force: true,
      recursive: true
    });
  }
}

export function formatGeneratedScaffoldSummary(
  result: ScaffoldGenerationResult
) {
  const counts = countOrigins(result.generatedFiles);

  return [
    `Generated local scaffold candidate: ${result.appName}`,
    "",
    `- output directory: ${result.outputPath}`,
    `- package name: ${result.packageName}`,
    `- product name: ${result.productName}`,
    `- generated README: ${joinOutputPath(result.outputPath, result.scaffoldReadmePath)}`,
    `- scaffold report: ${joinOutputPath(result.outputPath, result.reportPath)}`,
    `- copied files: ${counts.copied}`,
    `- templated files: ${counts.templated}`,
    `- placeholder files: ${counts.placeholder}`,
    `- generated files: ${counts.generated}`,
    `- excluded source files: ${result.filesExcluded.length}`,
    `- manual-review items: ${result.manualReviewItems.length}`,
    `- placeholder product id: ${result.placeholderProductSetup.productId}`,
    `- placeholder product files: ${result.placeholderProductSetup.outputFiles.join(", ")}`
  ].join("\n");
}

export function createDefaultScaffoldOutputPath(appName: string) {
  return `${defaultScaffoldOutputRoot}/${appName}`;
}

function createScaffoldFiles(input: {
  appName: string;
  extraction: ExtractionOutputResult;
  outputPath: string;
  packageName: string;
  plan: ScaffoldPlanBundle;
  productName: string;
  repoRoot: string;
  stagePath: string;
}) {
  const stagedFiles = collectStageFiles({
    extraction: input.extraction,
    repoRoot: input.repoRoot,
    stagePath: input.stagePath
  });
  const textReplacements = createTextReplacements(input.plan);
  const rootWorkspaceFiles = createRootWorkspaceFiles({
    repoRoot: input.repoRoot,
    textReplacements
  });
  const placeholderFiles = createProductSetupFiles({
    appName: input.appName,
    productName: input.productName
  });
  const generatedReadme = applyTextReplacements(
    createGeneratedReadme({
      appName: input.appName,
      outputPath: input.outputPath,
      packageName: input.packageName,
      plan: input.plan,
      productName: input.productName
    }),
    textReplacements
  );
  const reportContents = createScaffoldReport({
    outputPath: input.outputPath,
    packageName: input.packageName,
    plan: input.plan,
    scaffoldCommand: buildScaffoldCommand({
      appName: input.appName,
      outputPath: input.outputPath,
      packageName: input.plan.planner.packageName !== input.appName
        ? input.plan.planner.packageName
        : undefined,
      productName: input.plan.planner.productName !== toTitleCase(input.appName)
        ? input.plan.planner.productName
        : undefined
    }),
    stagedFiles
  });
  const files = [
    ...stagedFiles
      .filter((file) => !isExcludedStagedPath(file.path))
      .filter(
        (file) =>
          file.path !== extractionReadmePath && file.path !== extractionReportPath
      )
      .map((file) => ({
        contents: applyTextReplacements(file.contents, textReplacements),
        origin: file.origin,
        path: file.path
      })),
    ...rootWorkspaceFiles,
    ...placeholderFiles,
    {
      contents: generatedReadme,
      origin: "generated" as const,
      path: scaffoldReadmePath
    },
    {
      contents: applyTextReplacements(reportContents, textReplacements),
      origin: "generated" as const,
      path: scaffoldReportPath
    }
  ];

  return dedupeFiles(files).sort((left, right) => left.path.localeCompare(right.path));
}

function createProductSetupFiles(input: {
  appName: string;
  productName: string;
}) {
  const pascalAppName = toPascalCase(input.appName);
  const camelAppName = toCamelCase(input.appName);
  const pathReplacements = new Map<string, string>([
    [
      "packages/domain/src/placeholder-product/index.ts",
      `packages/domain/src/${input.appName}/index.ts`
    ],
    [
      "packages/domain/src/placeholder-product/product.ts",
      `packages/domain/src/${input.appName}/product.ts`
    ],
    [
      "apps/web/app/placeholder-product-navigation.ts",
      `apps/web/app/${input.appName}-navigation.ts`
    ],
    [
      "apps/web/app/getting-started/placeholder-product-onboarding.ts",
      `apps/web/app/getting-started/${input.appName}-onboarding.ts`
    ]
  ]);
  const contentReplacements = [
    {
      from: "packages/domain/src/placeholder-product/product.js",
      to: `packages/domain/src/${input.appName}/product.js`
    },
    {
      from: "../placeholder-product/product.js",
      to: `../${input.appName}/product.js`
    },
    {
      from: "placeholder-product/product.js",
      to: `${input.appName}/product.js`
    },
    {
      from: "placeholder-product",
      to: input.appName
    },
    {
      from: "Placeholder Product",
      to: input.productName
    },
    {
      from: "placeholderProduct",
      to: `${camelAppName}Product`
    },
    {
      from: "PlaceholderOnboardingStepId",
      to: `${pascalAppName}OnboardingStepId`
    },
    {
      from: "PlaceholderUsageMeterKey",
      to: `${pascalAppName}UsageMeterKey`
    },
    {
      from: "PlaceholderNavItemId",
      to: `${pascalAppName}NavItemId`
    },
    {
      from: "PlaceholderShellProductConfig",
      to: `${pascalAppName}ShellProductConfig`
    },
    {
      from: "getPlaceholderShellProductConfig",
      to: `get${pascalAppName}ShellProductConfig`
    },
    {
      from: "getPlaceholderOnboardingScreenCopy",
      to: `get${pascalAppName}OnboardingScreenCopy`
    },
    {
      from: "buildPlaceholderOnboardingStepViews",
      to: `build${pascalAppName}OnboardingStepViews`
    }
  ];

  return createPlaceholderProductFiles().map((file) => ({
    contents: applySimpleReplacements(file.contents, contentReplacements),
    origin: "placeholder" as const,
    path: pathReplacements.get(file.path) ?? file.path
  }));
}

function createGeneratedReadme(input: {
  appName: string;
  outputPath: string;
  packageName: string;
  plan: ScaffoldPlanBundle;
  productName: string;
}) {
  return [
    `# ${input.productName}`,
    "",
    "This directory is local candidate scaffold output.",
    "It was generated inside the AuditTrail repo and is not a published framework package or a real external repository.",
    "",
    "How it was generated:",
    `- command: \`${buildScaffoldCommand({
      appName: input.appName,
      outputPath: input.outputPath,
      packageName: input.plan.planner.packageName !== input.appName
        ? input.plan.planner.packageName
        : undefined,
      productName: input.plan.planner.productName !== toTitleCase(input.appName)
        ? input.plan.planner.productName
        : undefined
    })}\``,
    "- inputs reused: scaffold planner, extraction candidate output, and placeholder product tooling",
    `- scaffold report: \`${scaffoldReportPath}\``,
    "",
    "Checks to run from the repo root:",
    ...input.plan.qualityGates.checks.map((check) => `- \`${check.command}\``),
    "",
    "Known limitations:",
    ...input.plan.limitations.map((item) => `- ${item}`),
    "",
    "How to add resources next:",
    "- plan one resource with `pnpm saas plan resource tools/saas/__fixtures__/resources/customer.json`",
    "- preview generated resource output with `pnpm saas add resource tools/saas/__fixtures__/resources/customer.json --output .generated/resource-preview/customer`",
    "- compile bounded agent guidance with `pnpm saas agent recipe resource-install tools/saas/__fixtures__/resources/customer.json`",
    "",
    "Manual review is still required for:",
    ...input.plan.source.manualReview.map((item) => `- ${item.path}: ${item.reason}`),
    "",
    "Candidate-only posture:",
    "- this output is deterministic and repo-local",
    "- it does not publish packages, create a Git repo, or mutate AuditTrail runtime source",
    "- promote or extract it only after the manual-review seams are resolved explicitly"
  ].join("\n");
}

function createScaffoldReport(input: {
  outputPath: string;
  packageName: string;
  plan: ScaffoldPlanBundle;
  scaffoldCommand: string;
  stagedFiles: readonly PendingScaffoldFile[];
}) {
  const filesGeneratedOrCopied = input.stagedFiles
    .filter((file) => !isExcludedStagedPath(file.path))
    .map((file) => ({
      origin: file.origin,
      path: file.path
    }))
    .concat(
      createProductSetupPaths(input.plan.planner.appName).map((path) => ({
        origin: "placeholder" as const,
        path
      })),
      [
        {
          origin: "generated" as const,
          path: scaffoldReadmePath
        },
        {
          origin: "generated" as const,
          path: scaffoldReportPath
        }
      ]
    )
    .sort((left, right) => left.path.localeCompare(right.path));

  return JSON.stringify(
    {
      appName: input.plan.planner.appName,
      checksToRun: input.plan.qualityGates.checks.map((check) => check.command),
      filesExcluded: input.plan.source.excludedAsProductSpecific.map((item) => item.path),
      filesGeneratedOrCopied,
      knownLimitations: input.plan.limitations,
      manualReviewItems: input.plan.source.manualReview.map((item) => ({
        category: item.category,
        path: item.path,
        reason: item.reason
      })),
      outputPath: input.outputPath,
      packageName: input.packageName,
      placeholderProductSetup: {
        onboardingStepIds: input.plan.productSetup.onboardingStepIds,
        productId: input.plan.planner.appName,
        productName: input.plan.planner.productName,
        usageMeterKeys: input.plan.productSetup.usageMeterKeys
      },
      replacementsApplied: input.plan.appIdentity.replacements,
      scaffoldCommand: input.scaffoldCommand,
      sourceExtractionSummary: {
        byAction: input.plan.extractionSummary.byAction,
        byCategory: input.plan.extractionSummary.byCategory,
        byOwnershipSection: input.plan.extractionSummary.byOwnershipSection,
        trackedFileCount: input.plan.extractionSummary.trackedFileCount
      },
      status: scaffoldOwnershipStatus,
      templateReplacementsApplied: input.plan.appIdentity.replacements.map(
        (replacement) => ({
          from: replacement.from,
          target: replacement.target,
          to: replacement.to
        })
      )
    },
    null,
    2
  );
}

function createRootWorkspaceFiles(input: {
  repoRoot: string;
  textReplacements: readonly { from: string; to: string }[];
}) {
  return ["package.json", "pnpm-workspace.yaml", ".gitignore"].map((path) => ({
    contents: applyTextReplacements(
      readFileSync(resolve(input.repoRoot, path), "utf8"),
      input.textReplacements
    ),
    origin: "copied" as const,
    path
  }));
}

function createTextReplacements(plan: ScaffoldPlanBundle) {
  const packageScope = derivePackageScope(plan.planner.packageName);
  const replacements = [
    {
      from: "@auditrail/",
      to: `${packageScope}/`
    },
    {
      from: "auditTrailProduct",
      to: `${toCamelCase(plan.planner.appName)}Product`
    },
    ...plan.appIdentity.replacements.map((replacement) => ({
      from: replacement.from,
      to: replacement.to
    }))
  ];

  return replacements.sort(
    (left, right) => right.from.length - left.from.length
  );
}

function prepareOutputDirectory(input: {
  appName: string;
  force: boolean;
  outputPath: string;
  repoRoot: string;
}) {
  const absoluteOutputPath = resolve(input.repoRoot, input.outputPath);

  if (!existsSync(absoluteOutputPath)) {
    return;
  }

  if (!input.force) {
    throw new Error(
      `Refusing to overwrite existing scaffold output without --force: ${input.outputPath}`
    );
  }

  const ownership = readScaffoldOwnership({
    outputPath: input.outputPath,
    repoRoot: input.repoRoot
  });

  if (!ownership || ownership.status !== scaffoldOwnershipStatus) {
    throw new Error(
      `Refusing to clean existing non-generated scaffold output: ${input.outputPath}`
    );
  }

  if (ownership.appName !== input.appName) {
    throw new Error(
      `Refusing to clean scaffold output owned by a different app: ${input.outputPath}`
    );
  }

  rmSync(absoluteOutputPath, {
    force: true,
    recursive: true
  });
}

function readScaffoldOwnership(input: {
  outputPath: string;
  repoRoot: string;
}): PersistedScaffoldOwnership | undefined {
  const absolutePath = resolve(input.repoRoot, input.outputPath, scaffoldReportPath);

  if (!existsSync(absolutePath)) {
    return undefined;
  }

  try {
    return JSON.parse(readFileSync(absolutePath, "utf8")) as PersistedScaffoldOwnership;
  } catch {
    return undefined;
  }
}

function collectStageFiles(input: {
  extraction: ExtractionOutputResult;
  repoRoot: string;
  stagePath: string;
}) {
  const stageRoot = resolve(input.repoRoot, input.stagePath);
  const templatedPaths = new Set(input.extraction.templatedFiles);
  const filePaths = walkFiles(stageRoot).map((absolutePath) =>
    relative(stageRoot, absolutePath).replace(/\\/g, "/")
  );

  return filePaths.map((path) => ({
    contents: readFileSync(resolve(stageRoot, path), "utf8"),
    origin: inferStageOrigin(path, templatedPaths),
    path
  }));
}

function inferStageOrigin(
  path: string,
  templatedPaths: ReadonlySet<string>
): PendingScaffoldFile["origin"] {
  if (path === extractionReadmePath || path === extractionReportPath) {
    return "generated";
  }

  if (templatedPaths.has(path)) {
    return "templated";
  }

  return "copied";
}

function collectSafetyIssues(files: readonly PendingScaffoldFile[]) {
  const issues: ScaffoldSafetyIssue[] = [];

  for (const file of files) {
    if (reportExcludedSafetyPaths.has(file.path)) {
      continue;
    }

    issues.push(...collectForbiddenImportIssues(file));
    issues.push(...collectForbiddenIdentityIssues(file));
    issues.push(...collectUnresolvedPlaceholderIssues(file));
  }

  return issues.sort((left, right) => left.path.localeCompare(right.path));
}

function collectForbiddenImportIssues(file: PendingScaffoldFile) {
  const issues: ScaffoldSafetyIssue[] = [];

  for (const specifier of extractImportSpecifiers(file.contents)) {
    for (const matcher of forbiddenImportMatchers) {
      if (specifier.includes(matcher)) {
        issues.push({
          details: `Forbidden AuditTrail-specific import '${specifier}' detected.`,
          path: file.path,
          type: "forbidden-import"
        });
      }
    }
  }

  return issues;
}

function collectForbiddenIdentityIssues(file: PendingScaffoldFile) {
  if (isSafetyExemptPath(file.path)) {
    return [];
  }

  if (!shouldInspectAsText(file.path)) {
    return [];
  }

  const issues: ScaffoldSafetyIssue[] = [];

  for (const matcher of forbiddenIdentityMatchers) {
    if (!file.contents.includes(matcher)) {
      continue;
    }

    issues.push({
      details: `AuditTrail-specific identity '${matcher}' remained in generated output.`,
      path: file.path,
      type: "product-identity"
    });
  }

  return issues;
}

function collectUnresolvedPlaceholderIssues(file: PendingScaffoldFile) {
  if (isSafetyExemptPath(file.path)) {
    return [];
  }

  if (!shouldInspectAsText(file.path)) {
    return [];
  }

  const issues: ScaffoldSafetyIssue[] = [];

  for (const matcher of unresolvedPlaceholderMatchers) {
    if (!file.contents.includes(matcher) && !file.path.includes(matcher)) {
      continue;
    }

    issues.push({
      details: `Unresolved placeholder '${matcher}' remained in generated output.`,
      path: file.path,
      type: "unresolved-placeholder"
    });
  }

  return issues;
}

function shouldInspectAsText(path: string) {
  const extension = extname(path);

  return extension.length === 0 || textFileExtensions.has(extension);
}

function isSafetyExemptPath(path: string) {
  return path.startsWith("tools/saas/");
}

function isExcludedStagedPath(path: string) {
  return path.startsWith("packages/domain/src/audit-events/");
}

function extractImportSpecifiers(contents: string) {
  const matches = contents.matchAll(
    /import(?:\s+type)?(?:[\s\w{},*]+from\s+)?["']([^"']+)["']/g
  );

  return [...matches].map((match) => match[1]);
}

function applyTextReplacements(
  contents: string,
  replacements: readonly { from: string; to: string }[]
) {
  return applySimpleReplacements(contents, replacements);
}

function applySimpleReplacements(
  contents: string,
  replacements: readonly { from: string; to: string }[]
) {
  let updated = contents;

  for (const replacement of replacements) {
    updated = updated.split(replacement.from).join(replacement.to);
  }

  return updated;
}

function dedupeFiles(files: readonly PendingScaffoldFile[]) {
  const filesByPath = new Map<string, PendingScaffoldFile>();

  for (const file of files) {
    filesByPath.set(file.path, file);
  }

  return [...filesByPath.values()];
}

function walkFiles(root: string): string[] {
  if (!existsSync(root)) {
    return [];
  }

  return readdirSync(root).flatMap((entry) => {
    const absolutePath = resolve(root, entry);
    const stats = statSync(absolutePath);

    if (stats.isDirectory()) {
      return walkFiles(absolutePath);
    }

    return [absolutePath];
  });
}

function buildScaffoldCommand(input: {
  appName: string;
  outputPath: string;
  packageName?: string;
  productName?: string;
}) {
  const parts = [
    "pnpm saas generate scaffold",
    input.appName,
    "--output",
    input.outputPath
  ];

  if (input.packageName) {
    parts.push("--package-name", input.packageName);
  }

  if (input.productName) {
    parts.push("--product-name", input.productName);
  }

  return parts.join(" ");
}

function createProductSetupPaths(appName: string) {
  return [
    `packages/domain/src/${appName}/index.ts`,
    `packages/domain/src/${appName}/product.ts`,
    `apps/web/app/${appName}-navigation.ts`,
    `apps/web/app/getting-started/${appName}-onboarding.ts`
  ] as const;
}

function derivePackageScope(packageName: string) {
  if (packageName.startsWith("@")) {
    return packageName.split("/")[0] ?? packageName;
  }

  return `@${packageName}`;
}

function joinOutputPath(outputPath: string, filePath: string) {
  return `${outputPath}/${filePath}`;
}

function ensureTrailingNewline(value: string) {
  return value.endsWith("\n") ? value : `${value}\n`;
}

function toPascalCase(value: string) {
  return value
    .split("-")
    .filter((segment) => segment.length > 0)
    .map((segment) => `${segment[0]?.toUpperCase() ?? ""}${segment.slice(1)}`)
    .join("");
}

function toCamelCase(value: string) {
  const pascalCase = toPascalCase(value);

  return `${pascalCase[0]?.toLowerCase() ?? ""}${pascalCase.slice(1)}`;
}

function toTitleCase(value: string) {
  return value
    .split("-")
    .filter((segment) => segment.length > 0)
    .map((segment) => `${segment[0]?.toUpperCase() ?? ""}${segment.slice(1)}`)
    .join(" ");
}

function formatSafetyIssues(issues: readonly ScaffoldSafetyIssue[]) {
  return [
    "Scaffold generation aborted because safety checks failed.",
    ...issues.map((issue) => `- ${issue.type}: ${issue.path} (${issue.details})`)
  ].join("\n");
}

function countOrigins(files: readonly ScaffoldGeneratedFile[]) {
  return files.reduce(
    (counts, file) => {
      counts[file.origin] += 1;
      return counts;
    },
    {
      copied: 0,
      generated: 0,
      placeholder: 0,
      templated: 0
    }
  );
}
