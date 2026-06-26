import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, posix, relative, resolve } from "node:path";

import {
  architectureBoundaryRules,
  type ArchitectureBoundaryCategory,
  type ArchitectureBoundaryCategoryId
} from "./architecture-boundaries/rules.js";

interface ImportReference {
  kind: "dynamic-import" | "export" | "import";
  specifier: string;
}

interface BoundaryCategoryMatch {
  category: ArchitectureBoundaryCategory;
  prefixLength: number;
}

interface Violation {
  importingFile: string;
  importedSpecifier: string;
  resolvedTarget?: string;
  sourceCategory: ArchitectureBoundaryCategoryId | "unclassified";
  targetCategory: ArchitectureBoundaryCategoryId | "unclassified";
  violatedRule: string;
}

const repoRoot = resolve(dirname(new URL(import.meta.url).pathname), "..");
const scanRoots = ["apps", "packages"];
const sourceExtensions = [".ts", ".tsx", ".mts", ".cts"];
const ignoredDirectories = new Set([".git", ".next", "coverage", "dist", "node_modules"]);
const workspacePackageRoots = new Map([
  ["architecture-boundaries", "packages/architecture-boundaries/src"],
  ["config", "packages/config/src"],
  ["db", "packages/db/src"],
  ["domain", "packages/domain/src"],
  ["testkit", "packages/testkit/src"]
]);

const files = scanRoots.flatMap((root) => walk(join(repoRoot, root)));
const violations: Violation[] = [];

for (const absoluteFilePath of files) {
  const source = readFileSync(absoluteFilePath, "utf8");
  const importingFile = toRepoPath(absoluteFilePath);
  const sourceCategory = classifyPath(importingFile);

  for (const reference of getImportReferences(source)) {
    const resolvedTarget = resolveImportTarget(absoluteFilePath, reference.specifier);

    if (!resolvedTarget) {
      continue;
    }

    const resolvedTargetPath = toRepoPath(resolvedTarget);
    const targetCategory = classifyPath(resolvedTargetPath);
    const violatedRule = getViolatedRule({
      importingFile,
      resolvedTargetPath,
      sourceCategoryId: sourceCategory?.id ?? "unclassified",
      targetCategoryId: targetCategory?.id ?? "unclassified"
    });

    if (!violatedRule) {
      continue;
    }

    violations.push({
      importingFile,
      importedSpecifier: reference.specifier,
      resolvedTarget: resolvedTargetPath,
      sourceCategory: sourceCategory?.id ?? "unclassified",
      targetCategory: targetCategory?.id ?? "unclassified",
      violatedRule
    });
  }
}

if (violations.length > 0) {
  console.error(
    violations
      .map(
        (violation) =>
          [
            `Forbidden architecture import: ${violation.importingFile}`,
            `  imported specifier: ${violation.importedSpecifier}`,
            `  resolved target: ${violation.resolvedTarget ?? "(unresolved)"}`,
            `  source category: ${violation.sourceCategory}`,
            `  target category: ${violation.targetCategory}`,
            `  violated rule: ${violation.violatedRule}`
          ].join("\n")
      )
      .join("\n\n")
  );
  process.exit(1);
}

console.log("Architecture boundary check passed. No forbidden imports found.");

function walk(directory: string): string[] {
  if (!statSync(directory).isDirectory()) {
    return [];
  }

  return readdirSync(directory).flatMap((entry) => {
    if (ignoredDirectories.has(entry)) {
      return [];
    }

    const path = join(directory, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      return walk(path);
    }

    return isSourceFile(path) ? [path] : [];
  });
}

function isSourceFile(path: string): boolean {
  return sourceExtensions.some((extension) => path.endsWith(extension));
}

function getImportReferences(source: string): ImportReference[] {
  const references = new Map<string, ImportReference>();
  const patterns: Array<readonly [ImportReference["kind"], RegExp]> = [
    ["import", /\bimport\s+[\s\S]*?\sfrom\s*["']([^"']+)["']/g],
    ["import", /\bimport\s*["']([^"']+)["']/g],
    ["export", /\bexport\s+[\s\S]*?\sfrom\s*["']([^"']+)["']/g],
    ["dynamic-import", /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g]
  ];

  for (const [kind, pattern] of patterns) {
    for (const match of source.matchAll(pattern)) {
      const specifier = match[1];
      const key = `${kind}:${specifier}:${match.index ?? 0}`;

      references.set(key, {
        kind,
        specifier
      });
    }
  }

  return [...references.values()];
}

function resolveImportTarget(importingFile: string, specifier: string): string | undefined {
  if (specifier.startsWith(".")) {
    return resolveLocalPath(dirname(importingFile), specifier);
  }

  if (specifier.startsWith("@/")) {
    return resolveLocalPath(join(repoRoot, "apps/web"), specifier.slice(2));
  }

  if (specifier.startsWith("@auditrail/")) {
    const trimmedSpecifier = specifier.slice("@auditrail/".length);
    const [packageName, ...subpathParts] = trimmedSpecifier.split("/");
    const packageRoot = workspacePackageRoots.get(packageName);

    if (!packageRoot) {
      return undefined;
    }

    if (subpathParts.length === 0) {
      return resolveLocalPath(repoRoot, `${packageRoot}/index`);
    }

    return resolveLocalPath(repoRoot, `${packageRoot}/${subpathParts.join("/")}`);
  }

  return undefined;
}

function resolveLocalPath(basePath: string, specifier: string): string | undefined {
  const absoluteBasePath = resolve(basePath, specifier);
  const normalizedPath = absoluteBasePath.replace(/\\/g, "/");
  const extension = posix.extname(normalizedPath);
  const extensionlessPath =
    extension === ".js" || extension === ".mjs" || extension === ".cjs"
      ? normalizedPath.slice(0, -extension.length)
      : normalizedPath;
  const candidates =
    extension.length > 0
      ? [extensionlessPath]
      : [extensionlessPath, `${extensionlessPath}/index`];

  for (const candidate of candidates) {
    for (const sourceExtension of sourceExtensions) {
      const resolvedCandidate = `${candidate}${sourceExtension}`;

      try {
        if (statSync(resolvedCandidate).isFile()) {
          return resolvedCandidate;
        }
      } catch {}
    }
  }

  return undefined;
}

function toRepoPath(absolutePath: string): string {
  return relative(repoRoot, absolutePath).replace(/\\/g, "/");
}

function classifyPath(path: string): ArchitectureBoundaryCategory | undefined {
  const matches = architectureBoundaryRules.categories
    .flatMap((category) =>
      category.globPatterns.flatMap((pattern) => {
        const prefix = normalizeBoundaryPrefix(pattern);

        if (!pathMatchesBoundaryPrefix(path, prefix)) {
          return [];
        }

        return [
          {
            category,
            prefixLength: prefix.length
          } satisfies BoundaryCategoryMatch
        ];
      })
    )
    .sort((left, right) => right.prefixLength - left.prefixLength);

  return matches[0]?.category;
}

function normalizeBoundaryPrefix(pattern: string): string {
  return pattern.endsWith("/**") ? pattern.slice(0, -3) : pattern;
}

function pathMatchesBoundaryPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

function getViolatedRule(input: {
  importingFile: string;
  resolvedTargetPath: string;
  sourceCategoryId: ArchitectureBoundaryCategoryId | "unclassified";
  targetCategoryId: ArchitectureBoundaryCategoryId | "unclassified";
}): string | undefined {
  if (
    (input.sourceCategoryId === "platform-core" ||
      input.sourceCategoryId === "platform-extension") &&
    input.targetCategoryId === "audit-product"
  ) {
    return `${input.sourceCategoryId} must not depend on audit-product`;
  }

  if (
    isGenericDomainPath(input.importingFile) &&
    isAuditDomainPath(input.resolvedTargetPath)
  ) {
    return "generic domain paths must not depend on packages/domain/src/audit-events/**";
  }

  return undefined;
}

function isGenericDomainPath(path: string): boolean {
  return pathMatchesBoundaryPrefix(path, "packages/domain/src") && !isAuditDomainPath(path);
}

function isAuditDomainPath(path: string): boolean {
  return pathMatchesBoundaryPrefix(path, "packages/domain/src/audit-events");
}
