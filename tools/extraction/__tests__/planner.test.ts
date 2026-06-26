import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  createExtractionDryRunPlan,
  formatExtractionDryRunReport
} from "../planner.js";
import type { ExtractionManifest } from "../manifest.js";

describe("extraction dry-run planner", () => {
  const createdRoots: string[] = [];

  afterEach(() => {
    createdRoots.length = 0;
  });

  it("produces a deterministic plan for a valid manifest", () => {
    const repoRoot = createRepo({
      "apps/api/src/modules/platform/service.ts": "export const value = 1;\n",
      "apps/api/src/modules/audit-events/service.ts": "export const value = 1;\n",
      "docs/guide.md": "# guide\n",
      "tools/extraction/manifest.ts": "export {};\n"
    });
    const manifest = createManifest({
      copyToBoilerplate: ["apps/api/src/modules/platform/**"],
      excludeFromBoilerplate: ["apps/api/src/modules/audit-events/**"],
      requiresManualReview: ["docs/**", "tools/extraction/**"],
      platformCore: ["apps/api/src/modules/platform/**"],
      productSpecific: ["apps/api/src/modules/audit-events/**"]
    });

    const plan = createExtractionDryRunPlan({
      manifest,
      monitoredRoots: ["apps", "docs", "tools"],
      repoRoot
    });

    expect(plan.errors).toEqual([]);
    expect(plan.filesByAction.copy.map((file) => file.path)).toEqual([
      "apps/api/src/modules/platform/service.ts"
    ]);
    expect(plan.filesByAction.exclude.map((file) => file.path)).toEqual([
      "apps/api/src/modules/audit-events/service.ts"
    ]);
    expect(plan.filesByAction["manual-review"].map((file) => file.path)).toEqual([
      "docs/guide.md",
      "tools/extraction/manifest.ts"
    ]);
  });

  it("fails when a required manifest entry matches nothing", () => {
    const repoRoot = createRepo({
      "apps/api/src/modules/platform/service.ts": "export const value = 1;\n"
    });
    const manifest = createManifest({
      copyToBoilerplate: [
        "apps/api/src/modules/platform/**",
        "apps/api/src/modules/auth/**"
      ],
      platformCore: [
        "apps/api/src/modules/platform/**",
        "apps/api/src/modules/auth/**"
      ]
    });

    const plan = createExtractionDryRunPlan({
      manifest,
      monitoredRoots: ["apps"],
      repoRoot
    });

    expect(plan.errors).toContain(
      "Manifest entry 'apps/api/src/modules/auth/**' in section 'copyToBoilerplate' matched no files."
    );
  });

  it("fails on conflicting primary actions without explicit precedence", () => {
    const repoRoot = createRepo({
      "apps/api/src/modules/platform/service.ts": "export const value = 1;\n"
    });
    const manifest = createManifest({
      copyToBoilerplate: ["apps/api/src/modules/platform/**"],
      requiresManualReview: ["apps/api/src/modules/platform/**"],
      platformCore: ["apps/api/src/modules/platform/**"]
    });

    const plan = createExtractionDryRunPlan({
      manifest,
      monitoredRoots: ["apps"],
      repoRoot
    });

    expect(plan.errors.join("\n")).toContain(
      "File 'apps/api/src/modules/platform/service.ts' matched conflicting primary extraction actions."
    );
  });

  it("fails when a product-specific path resolves to copy", () => {
    const repoRoot = createRepo({
      "packages/domain/src/audit-events/product.ts": "export const product = {};\n"
    });
    const manifest = createManifest({
      copyToBoilerplate: ["packages/domain/src/audit-events/**"],
      platformCore: ["packages/domain/src/audit-events/**"],
      productSpecific: ["packages/domain/src/audit-events/**"]
    });

    const plan = createExtractionDryRunPlan({
      manifest,
      monitoredRoots: ["packages"],
      repoRoot
    });

    expect(plan.errors).toContain(
      "Product-specific path 'packages/domain/src/audit-events/product.ts' must be excluded or templated, but resolved to action 'copy'."
    );
  });

  it("reports manual-review paths", () => {
    const repoRoot = createRepo({
      "docs/guide.md": "# guide\n"
    });
    const manifest = createManifest({
      requiresManualReview: ["docs/**"]
    });

    const plan = createExtractionDryRunPlan({
      manifest,
      monitoredRoots: ["docs"],
      repoRoot
    });

    expect(plan.filesByAction["manual-review"].map((file) => file.path)).toEqual([
      "docs/guide.md"
    ]);
    expect(formatExtractionDryRunReport(plan)).toContain(
      "MANUAL-REVIEW (1)"
    );
  });

  it("formats output in deterministic sorted order", () => {
    const repoRoot = createRepo({
      "docs/z-last.md": "# z\n",
      "docs/a-first.md": "# a\n"
    });
    const manifest = createManifest({
      requiresManualReview: ["docs/**"]
    });

    const plan = createExtractionDryRunPlan({
      manifest,
      monitoredRoots: ["docs"],
      repoRoot
    });
    const report = formatExtractionDryRunReport(plan);

    expect(plan.filesByAction["manual-review"].map((file) => file.path)).toEqual([
      "docs/a-first.md",
      "docs/z-last.md"
    ]);
    expect(report.indexOf("docs/a-first.md")).toBeLessThan(
      report.indexOf("docs/z-last.md")
    );
  });
});

function createRepo(files: Record<string, string>) {
  const root = mkdtempSync(join(tmpdir(), "auditrail-extraction-"));

  for (const [path, contents] of Object.entries(files)) {
    const absolutePath = join(root, path);
    const directory = join(absolutePath, "..");

    mkdirSync(directory, {
      recursive: true
    });
    writeFileSync(absolutePath, contents);
  }

  return root;
}

function createManifest(input: Partial<{
  copyToBoilerplate: readonly string[];
  excludeFromBoilerplate: readonly string[];
  replaceWithTemplate: readonly string[];
  requiresManualReview: readonly string[];
  productSpecific: readonly string[];
  platformCore: readonly string[];
  platformExtension: readonly string[];
}>): ExtractionManifest {
  return {
    version: 1,
    status: "advisory",
    extractionSupport: "planned-not-implemented",
    futureScriptPolicy: {
      failClosedOnUnknownPaths: true,
      requireExplicitTemplateEntries: true,
      requireManualReviewForMixedOwnership: true
    },
    copyToBoilerplate: {
      description: "copy",
      entries: createEntries(input.copyToBoilerplate ?? [], "copy", "platform-core")
    },
    excludeFromBoilerplate: {
      description: "exclude",
      entries: createEntries(input.excludeFromBoilerplate ?? [], "exclude", "audit-product")
    },
    replaceWithTemplate: {
      description: "template",
      entries: createEntries(input.replaceWithTemplate ?? [], "template", "branding")
    },
    requiresManualReview: {
      description: "manual",
      entries: createEntries(input.requiresManualReview ?? [], "manual-review", "mixed")
    },
    productSpecific: {
      description: "product",
      entries: createEntries(input.productSpecific ?? [], "exclude", "audit-product")
    },
    platformCore: {
      description: "core",
      entries: createEntries(input.platformCore ?? [], "copy", "platform-core")
    },
    platformExtension: {
      description: "extension",
      entries: createEntries(input.platformExtension ?? [], "copy", "platform-extension")
    }
  };
}

function createEntries(
  paths: readonly string[],
  action: "copy" | "exclude" | "template" | "manual-review",
  category:
    | "platform-core"
    | "platform-extension"
    | "audit-product"
    | "mixed"
    | "branding"
) {
  return paths.map((path) => ({
    path,
    pathKind: path.endsWith("/**") ? "glob" : "file",
    category,
    extractionAction: action,
    reason: `${action}:${path}`,
    notes: ["test"],
    requiredForMinimalScaffold: true
  })) satisfies ExtractionManifest["copyToBoilerplate"]["entries"];
}

