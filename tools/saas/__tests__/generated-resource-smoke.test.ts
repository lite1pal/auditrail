import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { executeSaasCli } from "../cli.js";
import {
  formatGeneratedResourceSmokeReport,
  runGeneratedResourceSmokeCheck
} from "../generated-resource-smoke.js";

describe("generated resource smoke check", () => {
  const createdRoots: string[] = [];

  afterEach(() => {
    for (const root of createdRoots) {
      rmSync(root, {
        force: true,
        recursive: true
      });
    }
  });

  it("passes for the current fixture output", () => {
    const repoRoot = createSeededRepo(createdRoots);

    const report = runGeneratedResourceSmokeCheck({
      repoRoot
    });

    expect(report.exitCode).toBe(0);
    expect(report.results[0]?.status).toBe("pass");
    expect(report.results[0]?.validatedGroups).toEqual(
      expect.arrayContaining([
        "domain",
        "db-schema-or-stub",
        "api-module",
        "api-tests",
        "web-feature",
        "web-tests-or-stubs",
        "docs-customization-guidance"
      ])
    );
  });

  it("fails when an expected generated file is missing", () => {
    const repoRoot = createSeededRepo(createdRoots);

    const report = runGeneratedResourceSmokeCheck({
      afterGenerate({ fixture, outputPaths, repoRoot: currentRepoRoot }) {
        if (fixture.id !== "customer") {
          return;
        }

        unlinkSync(
          resolve(
            currentRepoRoot,
            outputPaths[0],
            "apps/api/src/modules/generated/customer/routes.ts"
          )
        );
      },
      repoRoot
    });

    expect(report.exitCode).toBe(1);
    expect(report.results[0]?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "apps/api/src/modules/generated/customer/routes.ts",
          type: "planner-alignment"
        })
      ])
    );
  });

  it("fails when generated output contains a forbidden AuditTrail-specific import", () => {
    const repoRoot = createSeededRepo(createdRoots);

    const report = runGeneratedResourceSmokeCheck({
      afterGenerate({ fixture, outputPaths, repoRoot: currentRepoRoot }) {
        if (fixture.id !== "customer") {
          return;
        }

        const path = resolve(
          currentRepoRoot,
          outputPaths[0],
          "apps/api/src/modules/generated/customer/routes.ts"
        );

        writeFileSync(
          path,
          'import "packages/domain/src/audit-events/product.js";\n' +
            readFileSync(path, "utf8")
        );
      },
      repoRoot
    });

    expect(report.exitCode).toBe(1);
    expect(report.results[0]?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "apps/api/src/modules/generated/customer/routes.ts",
          type: "forbidden-import"
        })
      ])
    );
  });

  it("fails when unresolved template placeholders remain", () => {
    const repoRoot = createSeededRepo(createdRoots);

    const report = runGeneratedResourceSmokeCheck({
      afterGenerate({ fixture, outputPaths, repoRoot: currentRepoRoot }) {
        if (fixture.id !== "customer") {
          return;
        }

        const path = resolve(
          currentRepoRoot,
          outputPaths[0],
          "docs/resources/customer-customization.md"
        );

        writeFileSync(
          path,
          readFileSync(path, "utf8") + "\nPlaceholder: <resource>\n"
        );
      },
      repoRoot
    });

    expect(report.exitCode).toBe(1);
    expect(report.results[0]?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "docs/resources/customer-customization.md",
          type: "unresolved-placeholder"
        })
      ])
    );
  });

  it("fails when repeated generation is not deterministic", () => {
    const repoRoot = createSeededRepo(createdRoots);

    const report = runGeneratedResourceSmokeCheck({
      afterGenerate({ outputPaths, repoRoot: currentRepoRoot }) {
        writeFileSync(
          resolve(
            currentRepoRoot,
            outputPaths[1],
            "docs/resources/customer.md"
          ),
          "drifted output\n"
        );
      },
      repoRoot
    });

    expect(report.exitCode).toBe(1);
    expect(
      report.results[0]?.issues.some((issue) => issue.type === "golden-drift")
    ).toBe(true);
  });

  it("fails before smoke validation for unsupported resource specs", () => {
    const repoRoot = createRepo(createdRoots, {
      "tools/saas/__fixtures__/generated/customer/.gitkeep": "\n",
      "tools/saas/__fixtures__/resources/customer.json": JSON.stringify(
        {
          fields: [{ name: "name", required: true, type: "string" }],
          label: "Customer",
          ownership: "user",
          resource: "customer"
        },
        null,
        2
      )
    });

    expect(() =>
      runGeneratedResourceSmokeCheck({
        repoRoot
      })
    ).toThrow(/organization-owned resources only/i);
    expect(() =>
      statSync(resolve(repoRoot, "tmp/saas-generated-resource-smoke/customer"))
    ).toThrow();
  });

  it("does not mutate real app source files", () => {
    const repoRoot = createSeededRepo(createdRoots, {
      "apps/api/src/app.ts": "export const untouched = true;\n",
      "packages/domain/src/index.ts": "export const domainUntouched = true;\n"
    });
    const before = readFileSync(resolve(repoRoot, "apps/api/src/app.ts"), "utf8");

    const report = runGeneratedResourceSmokeCheck({
      repoRoot
    });

    expect(report.exitCode).toBe(0);
    expect(readFileSync(resolve(repoRoot, "apps/api/src/app.ts"), "utf8")).toBe(
      before
    );
  });

  it("fails when the isolated smoke run mutates real app source", () => {
    const repoRoot = createSeededRepo(createdRoots, {
      "apps/api/src/app.ts": "export const untouched = true;\n"
    });

    const report = runGeneratedResourceSmokeCheck({
      afterGenerate({ repoRoot: currentRepoRoot }) {
        writeFileSync(
          resolve(currentRepoRoot, "apps/api/src/app.ts"),
          "export const mutated = true;\n"
        );
      },
      repoRoot
    });

    expect(report.exitCode).toBe(1);
    expect(report.results[0]?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "apps/api/src/app.ts",
          type: "runtime-mutation"
        })
      ])
    );
  });

  it("enforces temp output path safety", () => {
    const repoRoot = createSeededRepo(createdRoots);

    expect(() =>
      runGeneratedResourceSmokeCheck({
        fixtures: [
          {
            fixturePath: "tools/saas/__fixtures__/generated/customer",
            id: "../../..",
            specPath: "tools/saas/__fixtures__/resources/customer.json"
          }
        ],
        repoRoot
      })
    ).toThrow(/Unsafe extraction output path/i);
  });

  it("cleans up temp output directories after success", () => {
    const repoRoot = createSeededRepo(createdRoots);

    const report = runGeneratedResourceSmokeCheck({
      repoRoot
    });

    expect(report.exitCode).toBe(0);
    expect(() =>
      statSync(resolve(repoRoot, "tmp/saas-generated-resource-smoke/customer"))
    ).toThrow();
  });

  it("supports the CLI smoke-check command", () => {
    const repoRoot = createSeededRepo(createdRoots);

    const result = executeSaasCli({
      args: ["check", "generated-resource"],
      repoRoot
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Generated resource smoke check");
    expect(formatGeneratedResourceSmokeReport(runGeneratedResourceSmokeCheck({ repoRoot }))).toContain(
      "validated groups"
    );
  });
});

function createSeededRepo(
  createdRoots: string[],
  extraFiles: Record<string, string> = {}
) {
  return createRepo(createdRoots, {
    "tools/saas/__fixtures__/resources/customer.json": readFixtureResource(
      "customer.json"
    ),
    "tools/saas/__fixtures__/resources/task.json": readFixtureResource("task.json"),
    ...readFixtureDirectory("customer"),
    ...readFixtureDirectory("task"),
    ...extraFiles
  });
}

function createRepo(createdRoots: string[], files: Record<string, string>) {
  const root = mkdtempSync(join(tmpdir(), "auditrail-generated-resource-smoke-"));

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

function readFixtureResource(name: string) {
  return readFileSync(
    resolve(process.cwd(), "tools/saas/__fixtures__/resources", name),
    "utf8"
  );
}

function readFixtureDirectory(name: string) {
  const root = resolve(process.cwd(), "tools/saas/__fixtures__/generated", name);
  const files = walkFixtureDirectory(root);

  return Object.fromEntries(
    files.map((path) => [
      `tools/saas/__fixtures__/generated/${name}/${path}`,
      readFileSync(resolve(root, path), "utf8")
    ])
  );
}

function walkFixtureDirectory(root: string, currentPath = ""): string[] {
  const absolutePath = resolve(root, currentPath);
  const entries = statSync(absolutePath).isDirectory()
    ? readdirSync(absolutePath).sort((left, right) => left.localeCompare(right))
    : [];
  const files: string[] = [];

  for (const entry of entries) {
    const nextPath = currentPath.length > 0 ? `${currentPath}/${entry}` : entry;
    const nextAbsolutePath = resolve(root, nextPath);

    if (statSync(nextAbsolutePath).isDirectory()) {
      files.push(...walkFixtureDirectory(root, nextPath));
      continue;
    }

    files.push(nextPath.replace(/\\/g, "/"));
  }

  return files;
}
