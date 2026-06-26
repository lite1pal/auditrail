import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  architectureBoundaryRules,
  formatArchitectureBoundaryViolations,
  scanArchitectureBoundaries,
  type ArchitectureBoundaryRuleSet
} from "../index.js";

const fixturesRoot = resolve(
  process.cwd(),
  "../../tools/architecture-boundaries/__fixtures__"
);

describe("architecture boundary scanner", () => {
  it("allows audit-product depending on platform-core", () => {
    const violations = scanArchitectureBoundaries({
      repoRoot: resolve(fixturesRoot, "allowed-audit-product-to-platform-core")
    });

    expect(violations).toEqual([]);
  });

  it("reports platform-core depending on audit-product with readable details", () => {
    const violations = scanArchitectureBoundaries({
      repoRoot: resolve(fixturesRoot, "forbidden-platform-core-to-audit-product")
    });

    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({
      importingFile: "apps/api/src/modules/platform/consumer.ts",
      importedSpecifier: "../audit-events/source.js",
      sourceCategory: "platform-core",
      targetCategory: "audit-product",
      violatedRule: "platform-core must not depend on audit-product"
    });

    expect(formatArchitectureBoundaryViolations(violations)).toContain(
      "Forbidden architecture import: apps/api/src/modules/platform/consumer.ts"
    );
    expect(formatArchitectureBoundaryViolations(violations)).toContain(
      "imported specifier: ../audit-events/source.js"
    );
    expect(formatArchitectureBoundaryViolations(violations)).toContain(
      "source category: platform-core"
    );
    expect(formatArchitectureBoundaryViolations(violations)).toContain(
      "target category: audit-product"
    );
    expect(formatArchitectureBoundaryViolations(violations)).toContain(
      "violated rule: platform-core must not depend on audit-product"
    );
  });

  it("reports platform-extension depending on audit-product", () => {
    const violations = scanArchitectureBoundaries({
      repoRoot: resolve(fixturesRoot, "forbidden-platform-extension-to-audit-product"),
      rules: withPlatformExtensionFixtureRoot("apps/api/src/modules/extensions/**")
    });

    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({
      importingFile: "apps/api/src/modules/extensions/consumer.ts",
      importedSpecifier: "../audit-events/source.js",
      sourceCategory: "platform-extension",
      targetCategory: "audit-product",
      violatedRule: "platform-extension must not depend on audit-product"
    });
  });

  it("reports generic domain paths depending on audit domain paths", () => {
    const violations = scanArchitectureBoundaries({
      repoRoot: resolve(fixturesRoot, "forbidden-generic-domain-to-audit-product")
    });

    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({
      importingFile: "packages/domain/src/index.ts",
      importedSpecifier: "./audit-events/index.js",
      sourceCategory: "mixed",
      targetCategory: "audit-product",
      violatedRule:
        "generic domain paths must not depend on packages/domain/src/audit-events/**"
    });
  });
});

function withPlatformExtensionFixtureRoot(
  fixtureGlobPattern: string
): ArchitectureBoundaryRuleSet {
  return {
    version: architectureBoundaryRules.version,
    categories: architectureBoundaryRules.categories.map((category) =>
      category.id === "platform-extension"
        ? {
            ...category,
            globPatterns: [...category.globPatterns, fixtureGlobPattern]
          }
        : category
    )
  };
}
