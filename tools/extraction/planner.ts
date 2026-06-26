import { readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import {
  extractionManifest,
  type ExtractionAction,
  type ExtractionCategory,
  type ExtractionManifest,
  type ExtractionManifestEntry
} from "./manifest.js";

export type ExtractionPrimarySectionName =
  | "copyToBoilerplate"
  | "excludeFromBoilerplate"
  | "replaceWithTemplate"
  | "requiresManualReview";

export type ExtractionOwnershipSectionName =
  | "productSpecific"
  | "platformCore"
  | "platformExtension";

export interface PlannedExtractionFile {
  path: string;
  action: ExtractionAction;
  category: ExtractionCategory;
  matchedBy: string;
  matchedPrimaryEntries: readonly string[];
  ownershipSections: readonly ExtractionOwnershipSectionName[];
  requiredForMinimalScaffold: boolean;
}

export interface ExtractionDryRunPlan {
  repoRoot: string;
  monitoredRoots: readonly string[];
  trackedFileCount: number;
  files: readonly PlannedExtractionFile[];
  filesByAction: Readonly<Record<ExtractionAction, readonly PlannedExtractionFile[]>>;
  summary: {
    byAction: Readonly<Record<ExtractionAction, number>>;
    byCategory: Readonly<Record<ExtractionCategory, number>>;
    byOwnershipSection: Readonly<Record<ExtractionOwnershipSectionName, number>>;
  };
  warnings: readonly string[];
  errors: readonly string[];
}

export interface ExtractionPlannerOptions {
  manifest?: ExtractionManifest;
  monitoredRoots?: readonly string[];
  repoRoot: string;
}

interface SectionEntryMatch {
  entry: ExtractionManifestEntry;
  sectionName:
    | ExtractionPrimarySectionName
    | ExtractionOwnershipSectionName;
  matchedFiles: readonly string[];
}

const ignoredDirectories = new Set([
  ".git",
  ".next",
  "__pycache__",
  "coverage",
  "dist",
  "node_modules"
]);

const defaultMonitoredRoots = [
  "apps/api/src",
  "apps/web/app",
  "apps/web/src",
  "apps/worker/src",
  "packages/architecture-boundaries/src",
  "packages/config/src",
  "packages/db/src",
  "packages/domain/src",
  "packages/testkit/src",
  "tools",
  "docs"
] as const;

const primarySectionNames = [
  "copyToBoilerplate",
  "excludeFromBoilerplate",
  "replaceWithTemplate",
  "requiresManualReview"
] as const satisfies readonly ExtractionPrimarySectionName[];

const ownershipSectionNames = [
  "productSpecific",
  "platformCore",
  "platformExtension"
] as const satisfies readonly ExtractionOwnershipSectionName[];

export function createExtractionDryRunPlan(
  options: ExtractionPlannerOptions
): ExtractionDryRunPlan {
  const manifest = options.manifest ?? extractionManifest;
  const repoRoot = resolve(options.repoRoot);
  const monitoredRoots = options.monitoredRoots ?? defaultMonitoredRoots;
  const trackedFiles = collectTrackedFiles({
    monitoredRoots,
    repoRoot
  });
  const trackedFileSet = new Set(trackedFiles);
  const warnings: string[] = [];
  const errors: string[] = [];
  const primaryMatches = collectSectionMatches({
    errors,
    manifest,
    repoRoot,
    sectionNames: primarySectionNames
  });
  const ownershipMatches = collectSectionMatches({
    errors,
    manifest,
    repoRoot,
    sectionNames: ownershipSectionNames
  });
  const primaryMatchesByPath = groupMatchesByPath(primaryMatches);
  const ownershipMatchesByPath = groupMatchesByPath(ownershipMatches);

  const files: PlannedExtractionFile[] = [];

  for (const path of [...primaryMatchesByPath.keys()].sort()) {
    const matches = primaryMatchesByPath.get(path) ?? [];
    const selected = selectPrimaryEntry({
      errors,
      path,
      matches
    });

    if (!selected) {
      continue;
    }

    files.push({
      path,
      action: selected.entry.extractionAction,
      category: selected.entry.category,
      matchedBy: selected.entry.path,
      matchedPrimaryEntries: matches
        .map((match) => match.entry.path)
        .sort(),
      ownershipSections: getOwnershipSectionsForPath(
        ownershipMatchesByPath.get(path) ?? []
      ),
      requiredForMinimalScaffold: selected.entry.requiredForMinimalScaffold
    });
  }

  const filesByPath = new Map(files.map((file) => [file.path, file]));
  const unclassifiedFiles = trackedFiles.filter((path) => !filesByPath.has(path));

  if (unclassifiedFiles.length > 0) {
    errors.push(
      [
        "Tracked files are missing extraction classification:",
        ...unclassifiedFiles.map((path) => `  - ${path}`)
      ].join("\n")
    );
  }

  validateOwnershipMatches({
    errors,
    filesByPath,
    ownershipMatchesByPath
  });

  for (const file of files) {
    if (file.action === "copy" && file.category === "audit-product") {
      errors.push(
        `AuditTrail product-specific file '${file.path}' must not appear in the boilerplate copy set.`
      );
    }
  }

  const filesByAction = {
    copy: files.filter((file) => file.action === "copy"),
    exclude: files.filter((file) => file.action === "exclude"),
    template: files.filter((file) => file.action === "template"),
    "manual-review": files.filter((file) => file.action === "manual-review")
  } as const satisfies Readonly<
    Record<ExtractionAction, readonly PlannedExtractionFile[]>
  >;

  const summary = {
    byAction: {
      copy: filesByAction.copy.length,
      exclude: filesByAction.exclude.length,
      template: filesByAction.template.length,
      "manual-review": filesByAction["manual-review"].length
    },
    byCategory: countByCategory(files),
    byOwnershipSection: {
      productSpecific: countFilesByOwnershipSection(files, "productSpecific"),
      platformCore: countFilesByOwnershipSection(files, "platformCore"),
      platformExtension: countFilesByOwnershipSection(files, "platformExtension")
    }
  } as const;

  if (errors.length > 0) {
    warnings.push(
      "Suggested remediation: add or narrow explicit manifest entries so every tracked file lands in exactly one primary action, and keep product-owned files out of the copy set unless they are explicitly templated."
    );
  }

  return {
    repoRoot,
    monitoredRoots,
    trackedFileCount: trackedFiles.length,
    files,
    filesByAction,
    summary,
    warnings,
    errors
  };
}

export function formatExtractionDryRunReport(plan: ExtractionDryRunPlan): string {
  const lines = [
    "Extraction dry run plan",
    "",
    "Summary",
    `- tracked files: ${plan.trackedFileCount}`,
    `- copy: ${plan.summary.byAction.copy}`,
    `- exclude: ${plan.summary.byAction.exclude}`,
    `- template: ${plan.summary.byAction.template}`,
    `- manual-review: ${plan.summary.byAction["manual-review"]}`,
    `- platform-core files: ${plan.summary.byOwnershipSection.platformCore}`,
    `- platform-extension files: ${plan.summary.byOwnershipSection.platformExtension}`,
    `- product-specific files: ${plan.summary.byOwnershipSection.productSpecific}`
  ];

  const sortedCategories = [...new Set(plan.files.map((file) => file.category))].sort();

  if (sortedCategories.length > 0) {
    lines.push("", "Category counts");

    for (const category of sortedCategories) {
      lines.push(`- ${category}: ${plan.summary.byCategory[category]}`);
    }
  }

  for (const action of [
    "copy",
    "exclude",
    "template",
    "manual-review"
  ] as const satisfies readonly ExtractionAction[]) {
    const files = plan.filesByAction[action];

    lines.push("", `${action.toUpperCase()} (${files.length})`);

    for (const file of files) {
      lines.push(
        `- ${file.path} [${file.category}] via ${file.matchedBy}`
      );
    }
  }

  if (plan.warnings.length > 0) {
    lines.push("", "Warnings");

    for (const warning of plan.warnings) {
      lines.push(`- ${warning}`);
    }
  }

  if (plan.errors.length > 0) {
    lines.push("", "Errors");

    for (const error of plan.errors) {
      lines.push(`- ${error}`);
    }
  }

  return lines.join("\n");
}

function collectSectionMatches<
  TSectionName extends
    | ExtractionPrimarySectionName
    | ExtractionOwnershipSectionName
>(input: {
  errors: string[];
  manifest: ExtractionManifest;
  repoRoot: string;
  sectionNames: readonly TSectionName[];
}) {
  const matches: SectionEntryMatch[] = [];

  for (const sectionName of input.sectionNames) {
    const entries = input.manifest[sectionName].entries;

    for (const entry of entries) {
      const matchedFiles = expandManifestEntry({
        entry,
        repoRoot: input.repoRoot
      });

      if (matchedFiles.length === 0 && !entry.allowEmptyMatch) {
        input.errors.push(
          `Manifest entry '${entry.path}' in section '${sectionName}' matched no files.`
        );
      }

      matches.push({
        entry,
        sectionName,
        matchedFiles
      });
    }
  }

  return matches;
}

function expandManifestEntry(input: {
  entry: ExtractionManifestEntry;
  repoRoot: string;
}) {
  const repoRoot = input.repoRoot;
  const entry = input.entry;

  if (entry.pathKind === "file") {
    return expandFilePath({
      path: entry.path,
      repoRoot
    });
  }

  if (entry.pathKind === "directory") {
    return walkFiles(join(repoRoot, entry.path)).map((absolutePath) =>
      toRepoPath(repoRoot, absolutePath)
    );
  }

  return expandGlobPath({
    path: entry.path,
    repoRoot
  });
}

function expandFilePath(input: {
  path: string;
  repoRoot: string;
}) {
  const absolutePath = join(input.repoRoot, input.path);

  try {
    return statSync(absolutePath).isFile() ? [input.path] : [];
  } catch {
    return [];
  }
}

function expandGlobPath(input: {
  path: string;
  repoRoot: string;
}) {
  if (!input.path.endsWith("/**")) {
    throw new Error(
      `Unsupported manifest glob '${input.path}'. Only '/**' recursive globs are currently supported.`
    );
  }

  const prefix = input.path.slice(0, -3);
  const absolutePrefix = join(input.repoRoot, prefix);

  try {
    if (!statSync(absolutePrefix).isDirectory()) {
      return [];
    }
  } catch {
    return [];
  }

  return walkFiles(absolutePrefix)
    .map((absolutePath) => toRepoPath(input.repoRoot, absolutePath))
    .sort();
}

function walkFiles(directory: string): string[] {
  try {
    if (!statSync(directory).isDirectory()) {
      return [];
    }
  } catch {
    return [];
  }

  return readdirSync(directory).flatMap((entry) => {
    if (ignoredDirectories.has(entry)) {
      return [];
    }

    const path = join(directory, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      return walkFiles(path);
    }

    return [path];
  });
}

function collectTrackedFiles(input: {
  monitoredRoots: readonly string[];
  repoRoot: string;
}) {
  const files = input.monitoredRoots
    .flatMap((root) => walkFiles(join(input.repoRoot, root)))
    .map((absolutePath) => toRepoPath(input.repoRoot, absolutePath));

  return [...new Set(files)].sort();
}

function groupMatchesByPath(matches: readonly SectionEntryMatch[]) {
  const matchesByPath = new Map<string, SectionEntryMatch[]>();

  for (const match of matches) {
    for (const path of match.matchedFiles) {
      const existingMatches = matchesByPath.get(path) ?? [];

      existingMatches.push(match);
      matchesByPath.set(path, existingMatches);
    }
  }

  return matchesByPath;
}

function selectPrimaryEntry(input: {
  errors: string[];
  path: string;
  matches: readonly SectionEntryMatch[];
}) {
  const matchesByAction = new Map<ExtractionAction, SectionEntryMatch[]>();

  for (const match of input.matches) {
    const actionMatches = matchesByAction.get(match.entry.extractionAction) ?? [];

    actionMatches.push(match);
    matchesByAction.set(match.entry.extractionAction, actionMatches);
  }

  if (matchesByAction.size === 1) {
    return chooseMostSpecificMatch(input.matches);
  }

  const templateMatches = matchesByAction.get("template") ?? [];

  if (templateMatches.length > 0) {
    const templateWinner = chooseMostSpecificMatch(templateMatches);
    const nonTemplateMatches = input.matches.filter(
      (match) => match.entry.extractionAction !== "template"
    );
    const strongestNonTemplateMatch = chooseMostSpecificMatch(nonTemplateMatches);

    if (
      templateWinner &&
      strongestNonTemplateMatch &&
      getEntrySpecificity(templateWinner.entry) >
        getEntrySpecificity(strongestNonTemplateMatch.entry)
    ) {
      return templateWinner;
    }
  }

  input.errors.push(
    [
      `File '${input.path}' matched conflicting primary extraction actions.`,
      ...[...matchesByAction.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([action, matches]) => {
          const paths = matches
            .map((match) => match.entry.path)
            .sort()
            .join(", ");

          return `  - ${action}: ${paths}`;
        })
    ].join("\n")
  );

  return undefined;
}

function chooseMostSpecificMatch(matches: readonly SectionEntryMatch[]) {
  return [...matches].sort((left, right) => {
    const specificityDelta =
      getEntrySpecificity(right.entry) - getEntrySpecificity(left.entry);

    if (specificityDelta !== 0) {
      return specificityDelta;
    }

    return left.entry.path.localeCompare(right.entry.path);
  })[0];
}

function getEntrySpecificity(entry: ExtractionManifestEntry) {
  if (entry.pathKind === "glob" && entry.path.endsWith("/**")) {
    return entry.path.slice(0, -3).length;
  }

  return entry.path.length;
}

function getOwnershipSectionsForPath(matches: readonly SectionEntryMatch[]) {
  return [...new Set(matches.map((match) => match.sectionName))]
    .filter((sectionName): sectionName is ExtractionOwnershipSectionName =>
      ownershipSectionNames.includes(sectionName as ExtractionOwnershipSectionName)
    )
    .sort();
}

function validateOwnershipMatches(input: {
  errors: string[];
  filesByPath: ReadonlyMap<string, PlannedExtractionFile>;
  ownershipMatchesByPath: ReadonlyMap<string, readonly SectionEntryMatch[]>;
}) {
  for (const [path, matches] of input.ownershipMatchesByPath.entries()) {
    const plannedFile = input.filesByPath.get(path);

    if (!plannedFile) {
      continue;
    }

    const ownershipSections = getOwnershipSectionsForPath(matches);

    if (
      ownershipSections.includes("productSpecific") &&
      plannedFile.action !== "exclude" &&
      plannedFile.action !== "template"
    ) {
      input.errors.push(
        `Product-specific path '${path}' must be excluded or templated, but resolved to action '${plannedFile.action}'.`
      );
    }

    if (
      ownershipSections.includes("platformCore") &&
      plannedFile.action !== "copy" &&
      plannedFile.action !== "template"
    ) {
      input.errors.push(
        `Platform-core path '${path}' must resolve to copy or template, but resolved to action '${plannedFile.action}'.`
      );
    }

    if (
      ownershipSections.includes("platformExtension") &&
      plannedFile.action !== "copy" &&
      plannedFile.action !== "template"
    ) {
      input.errors.push(
        `Platform-extension path '${path}' must resolve to copy or template, but resolved to action '${plannedFile.action}'.`
      );
    }
  }
}

function countByCategory(files: readonly PlannedExtractionFile[]) {
  const counts = new Map<ExtractionCategory, number>();

  for (const file of files) {
    counts.set(file.category, (counts.get(file.category) ?? 0) + 1);
  }

  return Object.fromEntries(
    [...counts.entries()].sort(([left], [right]) => left.localeCompare(right))
  ) as Readonly<Record<ExtractionCategory, number>>;
}

function countFilesByOwnershipSection(
  files: readonly PlannedExtractionFile[],
  sectionName: ExtractionOwnershipSectionName
) {
  return files.filter((file) => file.ownershipSections.includes(sectionName)).length;
}

function toRepoPath(repoRoot: string, absolutePath: string) {
  return relative(repoRoot, absolutePath).replace(/\\/g, "/");
}
