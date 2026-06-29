import { createDoctorReport, formatDoctorReport } from "./doctor.js";

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

  if (command !== "doctor") {
    return {
      exitCode: 1,
      stderr: [
        "Unknown or missing command.",
        "Usage: pnpm saas doctor"
      ].join("\n"),
      stdout: ""
    };
  }

  const report = createDoctorReport({
    repoRoot: input.repoRoot
  });

  return {
    exitCode: report.exitCode,
    stderr: "",
    stdout: formatDoctorReport(report)
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
