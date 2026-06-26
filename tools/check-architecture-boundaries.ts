import {
  architectureBoundaryRules
} from "./architecture-boundaries/rules.js";
import {
  formatArchitectureBoundaryViolations,
  getDefaultArchitectureRepoRoot,
  scanArchitectureBoundaries
} from "../packages/architecture-boundaries/src/index.js";

const violations = scanArchitectureBoundaries({
  repoRoot: getDefaultArchitectureRepoRoot(),
  rules: architectureBoundaryRules
});

if (violations.length > 0) {
  console.error(formatArchitectureBoundaryViolations(violations));
  process.exit(1);
}

console.log("Architecture boundary check passed. No forbidden imports found.");
