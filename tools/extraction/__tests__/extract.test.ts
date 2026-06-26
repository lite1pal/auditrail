import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import type { ExtractionManifest } from "../manifest.js";
import {
  extractionReadmePath,
  extractionReportPath,
  generateExtractionOutput,
  resolveSafeOutputPath
} from "../output.js";

describe("extraction output generator", () => {
  const createdRoots: string[] = [];

  afterEach(() => {
    for (const root of createdRoots) {
      rmSync(root, {
        force: true,
        recursive: true
      });
    }
  });

  it("reuses dry-run validation before writing output", () => {
    const repoRoot = createRepo(createdRoots, {
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

    expect(() =>
      generateExtractionOutput({
        manifest,
        monitoredRoots: ["apps"],
        outputPath: ".generated/test-output",
        repoRoot
      })
    ).toThrow("Manifest entry 'apps/api/src/modules/auth/**'");
    expect(existsSync(join(repoRoot, ".generated/test-output"))).toBe(false);
  });

  it("rejects unsafe output paths", () => {
    expect(() =>
      resolveSafeOutputPath({
        outputPath: "apps/api",
        repoRoot: "/repo"
      })
    ).toThrow("Output must live under '.generated/' or 'tmp/'.");
  });

  it("copies platform files and skips product-specific files", () => {
    const repoRoot = createRepo(createdRoots, {
      "apps/api/src/modules/platform/service.ts": "export const value = 1;\n",
      "apps/api/src/modules/audit-events/service.ts": "export const audit = 1;\n"
    });
    const manifest = createManifest({
      copyToBoilerplate: ["apps/api/src/modules/platform/**"],
      excludeFromBoilerplate: ["apps/api/src/modules/audit-events/**"],
      platformCore: ["apps/api/src/modules/platform/**"],
      productSpecific: ["apps/api/src/modules/audit-events/**"]
    });

    const result = generateExtractionOutput({
      manifest,
      monitoredRoots: ["apps"],
      outputPath: ".generated/test-output",
      repoRoot
    });

    expect(result.copiedFiles).toEqual([
      "apps/api/src/modules/platform/service.ts"
    ]);
    expect(
      readFileSync(
        join(
          repoRoot,
          ".generated/test-output/apps/api/src/modules/platform/service.ts"
        ),
        "utf8"
      )
    ).toBe("export const value = 1;\n");
    expect(
      existsSync(
        join(
          repoRoot,
          ".generated/test-output/apps/api/src/modules/audit-events/service.ts"
        )
      )
    ).toBe(false);
  });

  it("writes template placeholders plus generated README and report", () => {
    const repoRoot = createRepo(createdRoots, {
      "README.md": "# AuditTrail\n",
      "packages/domain/src/audit-events/product.ts": "export const product = {};\n"
    });
    const manifest = createManifest({
      replaceWithTemplate: ["README.md", "packages/domain/src/audit-events/product.ts"],
      productSpecific: ["packages/domain/src/audit-events/product.ts"]
    });

    const result = generateExtractionOutput({
      manifest,
      monitoredRoots: ["README.md", "packages"],
      outputPath: ".generated/test-output",
      repoRoot
    });

    expect(result.templatedFiles).toEqual([
      "README.md",
      "packages/domain/src/audit-events/product.ts"
    ]);
    expect(
      readFileSync(join(repoRoot, ".generated/test-output/README.md"), "utf8")
    ).toContain("# Boilerplate Placeholder");
    expect(
      readFileSync(
        join(
          repoRoot,
          ".generated/test-output/packages/domain/src/audit-events/product.ts"
        ),
        "utf8"
      )
    ).toContain("Generated placeholder for a boilerplate template seam.");
    expect(
      readFileSync(
        join(repoRoot, `.generated/test-output/${extractionReadmePath}`),
        "utf8"
      )
    ).toContain("candidate output only");
    const report = JSON.parse(
      readFileSync(
        join(repoRoot, `.generated/test-output/${extractionReportPath}`),
        "utf8"
      )
    ) as {
      template: Array<{ path: string }>;
    };

    expect(report.template.map((file) => file.path)).toEqual([
      "README.md",
      "packages/domain/src/audit-events/product.ts"
    ]);
  });

  it("keeps copied output ordering deterministic", () => {
    const repoRoot = createRepo(createdRoots, {
      "apps/api/src/modules/platform/z-last.ts": "export const z = 1;\n",
      "apps/api/src/modules/platform/a-first.ts": "export const a = 1;\n"
    });
    const manifest = createManifest({
      copyToBoilerplate: ["apps/api/src/modules/platform/**"],
      platformCore: ["apps/api/src/modules/platform/**"]
    });

    const result = generateExtractionOutput({
      manifest,
      monitoredRoots: ["apps"],
      outputPath: ".generated/test-output",
      repoRoot
    });

    expect(result.copiedFiles).toEqual([
      "apps/api/src/modules/platform/a-first.ts",
      "apps/api/src/modules/platform/z-last.ts"
    ]);
    expect(
      statSync(
        join(
          repoRoot,
          ".generated/test-output/apps/api/src/modules/platform/a-first.ts"
        )
      ).isFile()
    ).toBe(true);
  });
});

function createRepo(createdRoots: string[], files: Record<string, string>) {
  const root = mkdtempSync(join(tmpdir(), "auditrail-extract-output-"));

  createdRoots.push(root);

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
