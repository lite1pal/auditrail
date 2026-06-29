import {
  existsSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync
} from "node:fs";
import { resolve } from "node:path";

import { requiredPlaceholderScaffoldFiles } from "../extraction/placeholder-product.js";
import { resolveSafeOutputPath } from "../extraction/output.js";
import {
  compareGeneratorFixtureDirectories,
  type GeneratorGoldenComparison
} from "./generator-golden.js";
import {
  generateScaffold,
  scaffoldReadmePath,
  scaffoldReportPath,
  type ScaffoldGenerationResult
} from "./scaffold-generator.js";

const scaffoldSmokeTempRoot = "tmp/saas-scaffold-smoke";
const defaultScaffoldSmokeAppName = "scaffold-smoke-app";
const forbiddenImportMatchers = [
  "@auditrail/domain/audit-events",
  "packages/domain/src/audit-events",
  "apps/api/src/modules/audit-events",
  "apps/web/src/features/audit-events",
  "audit-product",
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
const forbiddenGeneratedPathMatchers = [
  "packages/domain/src/audit-events/",
  "apps/api/src/modules/audit-events/",
  "apps/web/src/features/audit-events/"
] as const;
const reportExcludedSafetyPaths = new Set([scaffoldReportPath]);
const expectedGroupChecks = [
  {
    id: "root-workspace",
    paths: ["package.json", "pnpm-workspace.yaml", ".gitignore"]
  },
  {
    id: "scaffold-metadata",
    paths: [scaffoldReadmePath, scaffoldReportPath]
  },
  {
    id: "platform-required",
    paths: [...requiredPlaceholderScaffoldFiles]
  },
  {
    id: "placeholder-product",
    paths: [
      "packages/domain/src/<app-name>/index.ts",
      "packages/domain/src/<app-name>/product.ts",
      "apps/web/app/<app-name>-navigation.ts",
      "apps/web/app/getting-started/<app-name>-onboarding.ts"
    ]
  }
] as const;

export interface ScaffoldSmokeIssue {
  details?: string;
  path?: string;
  type:
    | "determinism"
    | "forbidden-import"
    | "forbidden-path"
    | "generated-file-set"
    | "missing-file"
    | "runtime-mutation"
    | "unresolved-placeholder";
}

export interface ScaffoldSmokeResult {
  appName: string;
  cleanedUp: boolean;
  comparison: GeneratorGoldenComparison;
  issues: readonly ScaffoldSmokeIssue[];
  outputPaths: readonly string[];
  status: "fail" | "pass";
  validatedGroups: readonly string[];
}

export interface ScaffoldSmokeReport {
  exitCode: number;
  results: readonly ScaffoldSmokeResult[];
}

export interface GeneratedScaffoldOutputValidation {
  files: readonly string[];
  issues: readonly ScaffoldSmokeIssue[];
  validatedGroups: readonly string[];
}

export function runScaffoldSmokeCheck(input: {
  afterGenerate?: (context: {
    appName: string;
    outputPaths: readonly string[];
    repoRoot: string;
    results: readonly ScaffoldGenerationResult[];
  }) => void;
  appName?: string;
  repoRoot: string;
}): ScaffoldSmokeReport {
  const repoRoot = resolve(input.repoRoot);
  const appName = input.appName ?? defaultScaffoldSmokeAppName;
  const outputPaths = [
    resolveSmokeOutputPath({
      appName,
      repoRoot,
      runId: "run-a"
    }),
    resolveSmokeOutputPath({
      appName,
      repoRoot,
      runId: "run-b"
    })
  ];
  const baselineFiles = createRuntimeMutationBaseline({
    repoRoot
  });
  const issues: ScaffoldSmokeIssue[] = [];
  let comparison: GeneratorGoldenComparison = {
    drift: [],
    expectedFiles: [],
    generatedFiles: [],
    matches: false
  };
  let validatedGroups: string[] = [];

  try {
    for (const outputPath of outputPaths) {
      rmSync(resolve(repoRoot, outputPath), {
        force: true,
        recursive: true
      });
    }

    const first = generateScaffold({
      appName,
      force: true,
      outputPath: outputPaths[0],
      repoRoot
    });
    const second = generateScaffold({
      appName,
      force: true,
      outputPath: outputPaths[1],
      repoRoot
    });

    input.afterGenerate?.({
      appName,
      outputPaths,
      repoRoot,
      results: [first, second]
    });

    const firstValidation = validateGeneratedScaffoldOutput({
      appName,
      generatedRoot: resolve(repoRoot, outputPaths[0]),
      plannedPaths: first.generatedFiles.map((file) => file.path)
    });

    issues.push(...firstValidation.issues);
    validatedGroups = [...firstValidation.validatedGroups];

    comparison = compareDeterministicScaffoldDirectories({
      generatedRoot: resolve(repoRoot, outputPaths[1]),
      outputPaths,
      expectedRoot: resolve(repoRoot, outputPaths[0])
    });

    for (const drift of comparison.drift) {
      issues.push({
        details:
          drift.details ?? "Repeated scaffold generation changed file structure or content.",
        path: drift.path,
        type: "determinism"
      });
    }

    issues.push(
      ...collectRuntimeMutationIssues({
        baselineFiles,
        repoRoot
      })
    );

    return {
      exitCode: issues.length > 0 ? 1 : 0,
      results: [
        {
          appName,
          cleanedUp: true,
          comparison,
          issues: issues.sort((left, right) =>
            `${left.path ?? ""}:${left.type}`.localeCompare(
              `${right.path ?? ""}:${right.type}`
            )
          ),
          outputPaths,
          status: issues.length > 0 ? "fail" : "pass",
          validatedGroups
        }
      ]
    };
  } finally {
    for (const outputPath of outputPaths) {
      rmSync(resolve(repoRoot, outputPath), {
        force: true,
        recursive: true
      });
    }

    rmSync(resolve(repoRoot, scaffoldSmokeTempRoot, appName), {
      force: true,
      recursive: true
    });
  }
}

export function formatScaffoldSmokeReport(report: ScaffoldSmokeReport) {
  const lines = ["Scaffold smoke check", ""];

  for (const result of report.results) {
    lines.push(
      `[${result.status.toUpperCase()}] ${result.appName}`,
      `- temp output root: ${scaffoldSmokeTempRoot}/${result.appName}`,
      `- repeated generation: ${result.outputPaths.join(", ")}`,
      `- determinism drift entries: ${result.comparison.drift.length}`,
      `- validated groups: ${result.validatedGroups.join(", ") || "none"}`,
      `- cleaned up: ${result.cleanedUp ? "yes" : "no"}`
    );

    if (result.issues.length > 0) {
      lines.push("- issues:");

      for (const issue of result.issues) {
        lines.push(
          `  - ${issue.type}${issue.path ? `: ${issue.path}` : ""}${
            issue.details ? ` (${issue.details})` : ""
          }`
        );
      }
    }

    lines.push("");
  }

  lines.push(
    "Summary",
    `- runs: ${report.results.length}`,
    `- pass: ${report.results.filter((result) => result.status === "pass").length}`,
    `- fail: ${report.results.filter((result) => result.status === "fail").length}`,
    `- exit code: ${report.exitCode}`
  );

  return lines.join("\n");
}

export function validateGeneratedScaffoldOutput(input: {
  appName: string;
  generatedRoot: string;
  plannedPaths?: readonly string[];
}): GeneratedScaffoldOutputValidation {
  const files = collectDirectoryFiles(input.generatedRoot);
  const issues: ScaffoldSmokeIssue[] = [];
  const requiredFiles = [
    "package.json",
    "pnpm-workspace.yaml",
    ".gitignore",
    scaffoldReadmePath,
    scaffoldReportPath,
    ...requiredPlaceholderScaffoldFiles,
    ...createProductSetupPaths(input.appName)
  ].sort((left, right) => left.localeCompare(right));

  if (input.plannedPaths) {
    issues.push(
      ...collectGeneratedFileSetIssues({
        actualFiles: files,
        plannedPaths: input.plannedPaths
      })
    );
  }

  issues.push(...collectMissingRequiredFileIssues(files, requiredFiles));
  issues.push(...collectForbiddenGeneratedPathIssues(files));
  issues.push(
    ...collectGeneratedFileContentIssues({
      files,
      generatedRoot: input.generatedRoot
    })
  );

  const validatedGroups = collectValidatedGroups({
    appName: input.appName,
    files
  });
  issues.push(...collectMissingGroupIssues(validatedGroups));

  return {
    files,
    issues,
    validatedGroups
  };
}

function resolveSmokeOutputPath(input: {
  appName: string;
  repoRoot: string;
  runId: string;
}) {
  return resolveSafeOutputPath({
    outputPath: `${scaffoldSmokeTempRoot}/${input.appName}/${input.runId}`,
    repoRoot: input.repoRoot
  });
}

function createRuntimeMutationBaseline(input: {
  repoRoot: string;
}) {
  const candidatePaths = [
    ".gitignore",
    "package.json",
    "pnpm-workspace.yaml",
    "apps/api/src/app.ts",
    "apps/web/app/layout.tsx",
    "packages/db/src/schema/index.ts",
    "packages/domain/src/index.ts"
  ];

  return candidatePaths
    .filter((path) => existsSync(resolve(input.repoRoot, path)))
    .map((path) => ({
      contents: readFileSync(resolve(input.repoRoot, path), "utf8"),
      path
    }));
}

function collectGeneratedFileSetIssues(input: {
  actualFiles: readonly string[];
  plannedPaths: readonly string[];
}) {
  const actualSet = new Set(input.actualFiles);
  const plannedSet = new Set(input.plannedPaths);
  const issues: ScaffoldSmokeIssue[] = [];

  for (const path of [...plannedSet].sort((left, right) => left.localeCompare(right))) {
    if (!actualSet.has(path)) {
      issues.push({
        details: "Generated scaffold file was expected but not written.",
        path,
        type: "generated-file-set"
      });
    }
  }

  for (const path of [...actualSet].sort((left, right) => left.localeCompare(right))) {
    if (!plannedSet.has(path)) {
      issues.push({
        details: "Generated scaffold file was written outside the declared writable file set.",
        path,
        type: "generated-file-set"
      });
    }
  }

  return issues;
}

function collectMissingRequiredFileIssues(
  files: readonly string[],
  requiredFiles: readonly string[]
) {
  const fileSet = new Set(files);

  return requiredFiles
    .filter((path) => !fileSet.has(path))
    .map((path) => ({
      details: "Required scaffold file is missing from the isolated output.",
      path,
      type: "missing-file" as const
    }));
}

function collectForbiddenGeneratedPathIssues(files: readonly string[]) {
  return files
    .filter((path) =>
      forbiddenGeneratedPathMatchers.some((matcher) => path.includes(matcher))
    )
    .map((path) => ({
      details: "AuditTrail product path leaked into generated scaffold output.",
      path,
      type: "forbidden-path" as const
    }));
}

function collectGeneratedFileContentIssues(input: {
  files: readonly string[];
  generatedRoot: string;
}) {
  const issues: ScaffoldSmokeIssue[] = [];

  for (const path of input.files) {
    if (reportExcludedSafetyPaths.has(path) || isSafetyExemptPath(path)) {
      continue;
    }

    const contents = readFileSync(resolve(input.generatedRoot, path), "utf8");

    for (const specifier of extractImportSpecifiers(contents)) {
      if (
        forbiddenImportMatchers.some((matcher) =>
          specifier.toLowerCase().includes(matcher.toLowerCase())
        )
      ) {
        issues.push({
          details: `Forbidden import '${specifier}'.`,
          path,
          type: "forbidden-import"
        });
      }
    }

    for (const placeholder of unresolvedPlaceholderMatchers) {
      if (!contents.includes(placeholder) && !path.includes(placeholder)) {
        continue;
      }

      issues.push({
        details: `Unresolved placeholder '${placeholder}' detected.`,
        path,
        type: "unresolved-placeholder"
      });
    }
  }

  return issues;
}

function collectValidatedGroups(input: {
  appName: string;
  files: readonly string[];
}) {
  const fileSet = new Set(input.files);

  return expectedGroupChecks
    .filter((check) =>
      check.paths.every((path) =>
        fileSet.has(path.replaceAll("<app-name>", input.appName))
      )
    )
    .map((check) => check.id);
}

function collectMissingGroupIssues(validatedGroups: readonly string[]) {
  const groupSet = new Set(validatedGroups);

  return expectedGroupChecks
    .filter((check) => !groupSet.has(check.id))
    .map((check) => ({
      details: "Expected scaffold file group is missing from the isolated output.",
      path: check.id,
      type: "missing-file" as const
    }));
}

function collectRuntimeMutationIssues(input: {
  baselineFiles: readonly {
    contents: string;
    path: string;
  }[];
  repoRoot: string;
}) {
  return input.baselineFiles.flatMap((file) => {
    const currentContents = readFileSync(resolve(input.repoRoot, file.path), "utf8");

    if (currentContents === file.contents) {
      return [];
    }

    return [
      {
        details: "Scaffold smoke validation mutated a real source file.",
        path: file.path,
        type: "runtime-mutation" as const
      }
    ];
  });
}

function compareDeterministicScaffoldDirectories(input: {
  expectedRoot: string;
  generatedRoot: string;
  outputPaths: readonly string[];
}): GeneratorGoldenComparison {
  const comparison = compareGeneratorFixtureDirectories({
    expectedRoot: input.expectedRoot,
    generatedRoot: input.generatedRoot
  });

  if (comparison.matches) {
    return comparison;
  }

  const normalizedDrift = comparison.drift.filter((drift) => {
    if (drift.type !== "changed") {
      return true;
    }

    const expectedPath = resolve(input.expectedRoot, drift.path);
    const generatedPath = resolve(input.generatedRoot, drift.path);
    const expectedContents = normalizeDeterministicScaffoldContents({
      contents: readFileSync(expectedPath, "utf8"),
      outputPaths: input.outputPaths
    });
    const generatedContents = normalizeDeterministicScaffoldContents({
      contents: readFileSync(generatedPath, "utf8"),
      outputPaths: input.outputPaths
    });

    if (expectedContents === generatedContents) {
      return false;
    }

    return true;
  });

  return {
    ...comparison,
    drift: normalizedDrift,
    matches: normalizedDrift.length === 0
  };
}

function collectDirectoryFiles(root: string): string[] {
  if (!existsSync(root)) {
    return [];
  }

  return walkFiles(root)
    .map((absolutePath) => absolutePath.replace(`${root}/`, ""))
    .sort((left, right) => left.localeCompare(right));
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

function createProductSetupPaths(appName: string) {
  return [
    `packages/domain/src/${appName}/index.ts`,
    `packages/domain/src/${appName}/product.ts`,
    `apps/web/app/${appName}-navigation.ts`,
    `apps/web/app/getting-started/${appName}-onboarding.ts`
  ] as const;
}

function isSafetyExemptPath(path: string) {
  return path.startsWith("tools/saas/");
}

function normalizeDeterministicScaffoldContents(input: {
  contents: string;
  outputPaths: readonly string[];
}) {
  let normalized = input.contents;

  for (const outputPath of input.outputPaths) {
    normalized = normalized.split(outputPath).join("<scaffold-output-path>");
  }

  return normalized;
}

function extractImportSpecifiers(contents: string) {
  const matches = contents.matchAll(
    /import(?:\s+type)?(?:[\s\w{},*]+from\s+)?["']([^"']+)["']/g
  );

  return [...matches].map((match) => match[1]);
}
