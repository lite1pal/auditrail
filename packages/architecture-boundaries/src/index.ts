export {
  architectureBoundaryCategories,
  architectureBoundaryCategoryIds,
  architectureBoundaryRules
} from "./rules.js";
export {
  formatArchitectureBoundaryViolations,
  getDefaultArchitectureRepoRoot,
  scanArchitectureBoundaries
} from "./scanner.js";

export type {
  ArchitectureBoundaryCategory,
  ArchitectureBoundaryCategoryId,
  ArchitectureBoundaryRuleSet
} from "./rules.js";
export type {
  ArchitectureBoundaryScannerOptions,
  ArchitectureBoundaryViolation,
  ImportReference
} from "./scanner.js";
