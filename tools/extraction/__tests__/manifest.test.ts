import { describe, expect, it } from "vitest";

import { extractionManifest } from "../manifest.js";

describe("extraction manifest", () => {
  it("explicitly excludes source-repo-only extraction tooling", () => {
    const excludedPaths = extractionManifest.excludeFromBoilerplate.entries.map(
      (entry) => entry.path
    );
    const manualReviewPaths = extractionManifest.requiresManualReview.entries.map(
      (entry) => entry.path
    );

    expect(excludedPaths).toEqual(
      expect.arrayContaining([
        "tools/check-extraction-manifest.ts",
        "tools/architecture-boundaries/__fixtures__/**",
        "tools/extraction/**"
      ])
    );
    expect(manualReviewPaths).not.toEqual(
      expect.arrayContaining([
        "tools/check-extraction-manifest.ts",
        "tools/architecture-boundaries/__fixtures__/**",
        "tools/extraction/**"
      ])
    );
  });
});
