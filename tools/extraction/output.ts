import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync
} from "node:fs";
import { dirname, extname, relative, resolve } from "node:path";

import {
  createExtractionDryRunPlan,
  formatExtractionDryRunReport,
  type ExtractionDryRunPlan,
  type ExtractionPlannerOptions,
  type PlannedExtractionFile
} from "./planner.js";

export const defaultExtractionOutputPath = ".generated/saas-boilerplate";
export const extractionReadmePath = "EXTRACTION_README.md";
export const extractionReportPath = "extraction-report.json";

const allowedOutputPrefixes = [".generated", "tmp"] as const;

export interface ExtractionOutputOptions
  extends ExtractionPlannerOptions {
  clean?: boolean;
  outputPath?: string;
}

export interface ExtractionOutputResult {
  outputPath: string;
  plan: ExtractionDryRunPlan;
  copiedFiles: readonly string[];
  templatedFiles: readonly string[];
  generatedFiles: readonly string[];
}

export function generateExtractionOutput(
  options: ExtractionOutputOptions
): ExtractionOutputResult {
  const plan = createExtractionDryRunPlan(options);

  if (plan.errors.length > 0) {
    throw new Error(formatExtractionOutputFailure(plan));
  }

  const outputPath = resolveSafeOutputPath({
    repoRoot: options.repoRoot,
    outputPath: options.outputPath
  });

  if (options.clean ?? true) {
    rmSync(resolve(options.repoRoot, outputPath), {
      force: true,
      recursive: true
    });
  }

  mkdirSync(resolve(options.repoRoot, outputPath), {
    recursive: true
  });

  const copiedFiles = writeCopiedFiles({
    outputPath,
    plan,
    repoRoot: options.repoRoot
  });
  const templatedFiles = writeTemplatedFiles({
    outputPath,
    plan,
    repoRoot: options.repoRoot
  });
  const generatedFiles = writeExtractionMetadata({
    outputPath,
    plan,
    repoRoot: options.repoRoot
  });

  return {
    outputPath,
    plan,
    copiedFiles,
    templatedFiles,
    generatedFiles
  };
}

export function formatExtractionOutputSummary(
  result: ExtractionOutputResult
): string {
  const lines = [
    "Extraction output generated",
    "",
    `- output directory: ${result.outputPath}`,
    `- copied files: ${result.copiedFiles.length}`,
    `- templated files: ${result.templatedFiles.length}`,
    `- excluded files: ${result.plan.summary.byAction.exclude}`,
    `- manual-review files: ${result.plan.summary.byAction["manual-review"]}`,
    `- report: ${joinOutputPath(result.outputPath, extractionReportPath)}`,
    `- notes: ${joinOutputPath(result.outputPath, extractionReadmePath)}`
  ];

  if (result.plan.summary.byAction["manual-review"] > 0) {
    lines.push(
      "- next step: review the manual-review paths listed in the generated report before treating this output as reusable boilerplate"
    );
  }

  return lines.join("\n");
}

export function resolveSafeOutputPath(input: {
  outputPath?: string;
  repoRoot: string;
}): string {
  const repoRoot = resolve(input.repoRoot);
  const requestedPath = input.outputPath ?? defaultExtractionOutputPath;
  const absoluteOutputPath = resolve(repoRoot, requestedPath);
  const relativeOutputPath = relative(repoRoot, absoluteOutputPath).replace(
    /\\/g,
    "/"
  );

  if (
    relativeOutputPath.length === 0 ||
    relativeOutputPath === "." ||
    relativeOutputPath.startsWith("../")
  ) {
    throw new Error(
      `Unsafe extraction output path '${requestedPath}'. Output must stay inside the repository.`
    );
  }

  const [prefix] = relativeOutputPath.split("/");

  if (!allowedOutputPrefixes.includes(prefix as (typeof allowedOutputPrefixes)[number])) {
    throw new Error(
      `Unsafe extraction output path '${requestedPath}'. Output must live under '.generated/' or 'tmp/'.`
    );
  }

  if (relativeOutputPath === prefix) {
    throw new Error(
      `Unsafe extraction output path '${requestedPath}'. Output must target a dedicated subdirectory, not the root '${prefix}/'.`
    );
  }

  return relativeOutputPath;
}

function writeCopiedFiles(input: {
  outputPath: string;
  plan: ExtractionDryRunPlan;
  repoRoot: string;
}) {
  const copiedFiles: string[] = [];

  for (const file of input.plan.filesByAction.copy) {
    const sourcePath = resolve(input.repoRoot, file.path);
    const destinationPath = resolve(input.repoRoot, input.outputPath, file.path);

    mkdirSync(dirname(destinationPath), {
      recursive: true
    });
    copyFileSync(sourcePath, destinationPath);
    chmodSync(destinationPath, statSync(sourcePath).mode);
    copiedFiles.push(file.path);
  }

  return copiedFiles;
}

function writeTemplatedFiles(input: {
  outputPath: string;
  plan: ExtractionDryRunPlan;
  repoRoot: string;
}) {
  const templatedFiles: string[] = [];

  for (const file of input.plan.filesByAction.template) {
    const sourcePath = resolve(input.repoRoot, file.path);
    const destinationPath = resolve(input.repoRoot, input.outputPath, file.path);

    mkdirSync(dirname(destinationPath), {
      recursive: true
    });
    writeFileSync(
      destinationPath,
      renderTemplateContents({
        file
      })
    );
    chmodSync(destinationPath, statSync(sourcePath).mode);
    templatedFiles.push(file.path);
  }

  return templatedFiles;
}

function writeExtractionMetadata(input: {
  outputPath: string;
  plan: ExtractionDryRunPlan;
  repoRoot: string;
}) {
  const files = [extractionReadmePath, extractionReportPath];
  const readmeAbsolutePath = resolve(
    input.repoRoot,
    input.outputPath,
    extractionReadmePath
  );
  const reportAbsolutePath = resolve(
    input.repoRoot,
    input.outputPath,
    extractionReportPath
  );

  writeFileSync(
    readmeAbsolutePath,
    createExtractionReadme({
      outputPath: input.outputPath,
      plan: input.plan
    })
  );
  writeFileSync(
    reportAbsolutePath,
    JSON.stringify(createExtractionReport(input.plan), null, 2) + "\n"
  );

  return files;
}

function createExtractionReadme(input: {
  outputPath: string;
  plan: ExtractionDryRunPlan;
}) {
  return [
    "# Boilerplate Candidate Output",
    "",
    "This directory is generated locally from the extraction manifest.",
    "It is a candidate output only and is not a supported published boilerplate.",
    "",
    "Safety rules:",
    "- product-specific files are excluded unless they are explicitly marked as templates",
    "- unknown or conflicting classifications fail before any files are written",
    "- manual-review paths are intentionally omitted from copied output and must be handled explicitly later",
    "",
    "Summary:",
    `- copy: ${input.plan.summary.byAction.copy}`,
    `- exclude: ${input.plan.summary.byAction.exclude}`,
    `- template: ${input.plan.summary.byAction.template}`,
    `- manual-review: ${input.plan.summary.byAction["manual-review"]}`,
    `- report: ${extractionReportPath}`,
    "",
    "The generated report is the source of truth for remaining manual-review paths and excluded product-owned files."
  ].join("\n");
}

function createExtractionReport(plan: ExtractionDryRunPlan) {
  return {
    status: "candidate-output",
    outputSupport: "local-only-not-published",
    summary: plan.summary,
    trackedFileCount: plan.trackedFileCount,
    copy: plan.filesByAction.copy.map(serializePlannedFile),
    exclude: plan.filesByAction.exclude.map(serializePlannedFile),
    template: plan.filesByAction.template.map(serializePlannedFile),
    manualReview: plan.filesByAction["manual-review"].map(serializePlannedFile),
    warnings: plan.warnings,
    errors: plan.errors,
    dryRunReport: formatExtractionDryRunReport(plan)
  };
}

function serializePlannedFile(file: PlannedExtractionFile) {
  return {
    path: file.path,
    action: file.action,
    category: file.category,
    matchedBy: file.matchedBy,
    matchedPrimaryEntries: file.matchedPrimaryEntries,
    ownershipSections: file.ownershipSections,
    requiredForMinimalScaffold: file.requiredForMinimalScaffold
  };
}

function renderTemplateContents(input: {
  file: PlannedExtractionFile;
}) {
  const extension = extname(input.file.path);

  if (extension === ".md") {
    return [
      "# Boilerplate Placeholder",
      "",
      "This file was generated as a placeholder from the extraction manifest.",
      "Replace it with generic boilerplate content before reusing this candidate output."
    ].join("\n") + "\n";
  }

  if (extension === ".sql") {
    return [
      "-- Generated placeholder for a boilerplate migration seam.",
      "-- TODO: replace this file with a generic scaffold migration before using the extracted output."
    ].join("\n") + "\n";
  }

  if (
    extension === ".ts" ||
    extension === ".tsx" ||
    extension === ".mts" ||
    extension === ".cts"
  ) {
    return [
      "/**",
      " * Generated placeholder for a boilerplate template seam.",
      " * TODO: replace this stub with generic scaffold content before publishing this output.",
      " */",
      "export {};"
    ].join("\n") + "\n";
  }

  return [
    "Generated placeholder for a boilerplate template seam.",
    "TODO: replace this stub with generic scaffold content before publishing this output."
  ].join("\n") + "\n";
}

function formatExtractionOutputFailure(plan: ExtractionDryRunPlan) {
  return [
    "Extraction output generation aborted because the dry-run planner reported fail-closed errors.",
    formatExtractionDryRunReport(plan)
  ].join("\n\n");
}

function joinOutputPath(outputPath: string, fileName: string) {
  return `${outputPath}/${fileName}`;
}

export function readGeneratedFile(input: {
  outputPath: string;
  path: string;
  repoRoot: string;
}) {
  return readFileSync(resolve(input.repoRoot, input.outputPath, input.path), "utf8");
}
