import { createExtractionDryRunPlan, formatExtractionDryRunReport } from "./planner.js";

const plan = createExtractionDryRunPlan({
  repoRoot: process.cwd()
});

console.log(formatExtractionDryRunReport(plan));

if (plan.errors.length > 0) {
  process.exit(1);
}

