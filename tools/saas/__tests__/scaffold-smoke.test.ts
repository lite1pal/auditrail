import {
  existsSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync
} from "node:fs";
import { resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { executeSaasCli } from "../cli.js";
import { runScaffoldSmokeCheck } from "../scaffold-smoke.js";

describe("scaffold smoke check", () => {
  const mutatedFiles = new Map<string, string>();

  afterEach(() => {
    for (const [path, contents] of mutatedFiles) {
      writeFileSync(resolve(process.cwd(), path), contents);
    }

    mutatedFiles.clear();
    rmSync(resolve(process.cwd(), "tmp/saas-scaffold-smoke"), {
      force: true,
      recursive: true
    });
  });

  it("passes for the current scaffold output", () => {
    const report = runScaffoldSmokeCheck({
      appName: "scaffold-smoke-pass-app",
      repoRoot: process.cwd()
    });

    expect(report.exitCode).toBe(0);
    expect(report.results[0]?.status).toBe("pass");
    expect(report.results[0]?.validatedGroups).toEqual(
      expect.arrayContaining([
        "root-workspace",
        "scaffold-metadata",
        "platform-required",
        "placeholder-product"
      ])
    );
  });

  it("fails when a required scaffold file is missing", () => {
    const report = runScaffoldSmokeCheck({
      afterGenerate({ outputPaths, repoRoot }) {
        unlinkSync(
          resolve(
            repoRoot,
            outputPaths[0],
            "apps/web/src/components/layout/app-shell.tsx"
          )
        );
      },
      appName: "scaffold-smoke-missing-file-app",
      repoRoot: process.cwd()
    });

    expect(report.exitCode).toBe(1);
    expect(report.results[0]?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "apps/web/src/components/layout/app-shell.tsx",
          type: "missing-file"
        })
      ])
    );
  });

  it("fails when generated scaffold output contains a forbidden import", () => {
    const report = runScaffoldSmokeCheck({
      afterGenerate({ outputPaths, repoRoot }) {
        const path = resolve(
          repoRoot,
          outputPaths[0],
          "packages/domain/src/scaffold-smoke-import-app/product.ts"
        );

        writeFileSync(
          path,
          'import { auditTrailProduct } from "@auditrail/domain/audit-events";\n' +
            readFileSync(path, "utf8")
        );
      },
      appName: "scaffold-smoke-import-app",
      repoRoot: process.cwd()
    });

    expect(report.exitCode).toBe(1);
    expect(report.results[0]?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "packages/domain/src/scaffold-smoke-import-app/product.ts",
          type: "forbidden-import"
        })
      ])
    );
  });

  it("fails when unresolved placeholders remain", () => {
    const report = runScaffoldSmokeCheck({
      afterGenerate({ outputPaths, repoRoot }) {
        const path = resolve(repoRoot, outputPaths[0], "README.md");

        writeFileSync(
          path,
          `${readFileSync(path, "utf8")}\nPlaceholder: <resource>\n`
        );
      },
      appName: "scaffold-smoke-placeholder-app",
      repoRoot: process.cwd()
    });

    expect(report.exitCode).toBe(1);
    expect(report.results[0]?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "README.md",
          type: "unresolved-placeholder"
        })
      ])
    );
  });

  it("fails when repeated generation is not deterministic", () => {
    const report = runScaffoldSmokeCheck({
      afterGenerate({ outputPaths, repoRoot }) {
        writeFileSync(
          resolve(repoRoot, outputPaths[1], "README.md"),
          "drifted scaffold output\n"
        );
      },
      appName: "scaffold-smoke-determinism-app",
      repoRoot: process.cwd()
    });

    expect(report.exitCode).toBe(1);
    expect(
      report.results[0]?.issues.some((issue) => issue.type === "determinism")
    ).toBe(true);
  });

  it("does not mutate real app source files", () => {
    const appSourcePath = resolve(process.cwd(), "apps/api/src/app.ts");
    const before = readFileSync(appSourcePath, "utf8");

    const report = runScaffoldSmokeCheck({
      appName: "scaffold-smoke-no-mutation-app",
      repoRoot: process.cwd()
    });

    expect(report.exitCode).toBe(0);
    expect(readFileSync(appSourcePath, "utf8")).toBe(before);
  });

  it("fails when isolated scaffold validation mutates real app source", () => {
    const path = "apps/api/src/app.ts";
    mutatedFiles.set(path, readFileSync(resolve(process.cwd(), path), "utf8"));

    const report = runScaffoldSmokeCheck({
      afterGenerate({ repoRoot }) {
        writeFileSync(
          resolve(repoRoot, path),
          "export const mutatedByScaffoldSmoke = true;\n"
        );
      },
      appName: "scaffold-smoke-runtime-mutation-app",
      repoRoot: process.cwd()
    });

    expect(report.exitCode).toBe(1);
    expect(report.results[0]?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path,
          type: "runtime-mutation"
        })
      ])
    );
  });

  it("cleans up temp output directories after success", () => {
    const report = runScaffoldSmokeCheck({
      appName: "scaffold-smoke-cleanup-app",
      repoRoot: process.cwd()
    });

    expect(report.exitCode).toBe(0);
    expect(
      existsSync(
        resolve(
          process.cwd(),
          "tmp/saas-scaffold-smoke/scaffold-smoke-cleanup-app"
        )
      )
    ).toBe(false);
  });

  it("exposes the command through the CLI", () => {
    const result = executeSaasCli({
      args: ["check", "scaffold", "scaffold-smoke-cli-app"],
      repoRoot: process.cwd()
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Scaffold smoke check");
  });
});
