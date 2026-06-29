import { createDoctorReport, formatDoctorReport } from "./doctor.js";
import {
  createResourcePlanFromFile,
  formatResourcePlanReport
} from "./resource-planner.js";

export interface SaasCliExecutionResult {
  exitCode: number;
  stderr: string;
  stdout: string;
}

export function executeSaasCli(input: {
  args: readonly string[];
  repoRoot: string;
}): SaasCliExecutionResult {
  const [command] = input.args;

  if (command === "doctor") {
    const report = createDoctorReport({
      repoRoot: input.repoRoot
    });

    return {
      exitCode: report.exitCode,
      stderr: "",
      stdout: formatDoctorReport(report)
    };
  }

  if (command === "plan" && input.args[1] === "resource") {
    return executePlanResourceCommand({
      args: input.args.slice(2),
      repoRoot: input.repoRoot
    });
  }

  return {
    exitCode: 1,
    stderr: [
      "Unknown or missing command.",
      "Usage:",
      "  pnpm saas doctor",
      "  pnpm saas plan resource <path-to-resource-spec.json> [--json]"
    ].join("\n"),
    stdout: ""
  };
}

if (isExecutedAsScript()) {
  const result = executeSaasCli({
    args: process.argv.slice(2),
    repoRoot: process.cwd()
  });

  if (result.stdout.length > 0) {
    console.log(result.stdout);
  }

  if (result.stderr.length > 0) {
    console.error(result.stderr);
  }

  process.exit(result.exitCode);
}

function isExecutedAsScript() {
  const entryPath = process.argv[1];

  if (!entryPath) {
    return false;
  }

  return entryPath.endsWith("tools/saas/cli.ts");
}

function executePlanResourceCommand(input: {
  args: readonly string[];
  repoRoot: string;
}): SaasCliExecutionResult {
  const options = new Set(input.args.filter((argument) => argument.startsWith("--")));
  const positionalArgs = input.args.filter((argument) => !argument.startsWith("--"));
  const [specPath] = positionalArgs;

  if (!specPath) {
    return {
      exitCode: 1,
      stderr: "Missing resource spec path. Usage: pnpm saas plan resource <path-to-resource-spec.json> [--json]",
      stdout: ""
    };
  }

  try {
    const report = createResourcePlanFromFile({
      repoRoot: input.repoRoot,
      specPath
    });

    return {
      exitCode: 0,
      stderr: "",
      stdout: options.has("--json")
        ? JSON.stringify(report, null, 2)
        : formatResourcePlanReport(report)
    };
  } catch (error) {
    return {
      exitCode: 1,
      stderr:
        error instanceof Error
          ? error.message
          : "Resource planning failed.",
      stdout: ""
    };
  }
}
