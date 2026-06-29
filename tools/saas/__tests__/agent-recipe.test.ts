import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { executeSaasCli } from "../cli.js";
import {
  createResourceInstallRecipeFromFile,
  formatResourceInstallRecipeMarkdown
} from "../agent-recipe.js";

describe("saas agent recipe", () => {
  const createdRoots: string[] = [];

  afterEach(() => {
    for (const root of createdRoots) {
      rmSync(root, {
        force: true,
        recursive: true
      });
    }
  });

  it("emits deterministic markdown for a valid resource", () => {
    const repoRoot = createRepo(createdRoots, {
      "specs/customer.json": readFixture("customer.json")
    });

    const first = createResourceInstallRecipeFromFile({
      repoRoot,
      specPath: "specs/customer.json"
    });
    const second = createResourceInstallRecipeFromFile({
      repoRoot,
      specPath: "specs/customer.json"
    });

    expect(formatResourceInstallRecipeMarkdown(first.bundle)).toEqual(
      formatResourceInstallRecipeMarkdown(second.bundle)
    );
    expect(formatResourceInstallRecipeMarkdown(first.bundle)).toContain(
      "# AI Agent Recipe: Generated Resource Install"
    );
    expect(formatResourceInstallRecipeMarkdown(first.bundle)).toContain(
      "recipe template: `tools/saas/recipes/generated-resource-install.md`"
    );
  });

  it("emits deterministic JSON through the CLI", () => {
    const repoRoot = createRepo(createdRoots, {
      "specs/customer.json": readFixture("customer.json")
    });

    const first = executeSaasCli({
      args: ["agent", "recipe", "resource-install", "specs/customer.json", "--json"],
      repoRoot
    });
    const second = executeSaasCli({
      args: ["agent", "recipe", "resource-install", "specs/customer.json", "--json"],
      repoRoot
    });

    expect(first.exitCode).toBe(0);
    expect(first.stdout).toEqual(second.stdout);

    const payload = JSON.parse(first.stdout) as {
      recipe: { kind: string };
      requiredChecks: string[];
      task: { taskType: string };
    };

    expect(payload.recipe.kind).toBe("resource-install");
    expect(payload.task.taskType).toBe("generated-resource");
    expect(payload.requiredChecks).toContain("pnpm saas check generated-resource");
  });

  it("fails before recipe generation when the spec is invalid", () => {
    const repoRoot = createRepo(createdRoots, {
      "specs/customer.json": JSON.stringify(
        {
          fields: [
            {
              name: "status",
              required: true,
              type: "enum"
            }
          ],
          label: "Customer",
          ownership: "organization",
          resource: "customer"
        },
        null,
        2
      )
    });

    const result = executeSaasCli({
      args: ["agent", "recipe", "resource-install", "specs/customer.json"],
      repoRoot
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("values");
  });

  it("surfaces planner warnings in the recipe", () => {
    const repoRoot = createRepo(createdRoots, {
      "specs/customer.json": JSON.stringify(
        {
          crud: {
            delete: true
          },
          fields: [
            {
              name: "name",
              required: true,
              type: "string"
            }
          ],
          label: "Customer",
          ownership: "organization",
          resource: "customer"
        },
        null,
        2
      )
    });

    const result = createResourceInstallRecipeFromFile({
      repoRoot,
      specPath: "specs/customer.json"
    });
    const markdown = formatResourceInstallRecipeMarkdown(result.bundle);

    expect(markdown).toContain("delete-enabled");
    expect(markdown).toContain("planner warnings");
  });

  it("derives allowed paths from the planned generated-resource file groups", () => {
    const repoRoot = createRepo(createdRoots, {
      "specs/customer.json": readFixture("customer.json")
    });
    const result = createResourceInstallRecipeFromFile({
      repoRoot,
      specPath: "specs/customer.json"
    });

    expect(result.bundle.allowedPaths).toEqual(
      expect.arrayContaining([
        "packages/domain/src/generated/customer/**",
        "packages/db/src/schema/customer.ts",
        "apps/api/src/modules/generated/customer/**",
        "apps/web/src/features/customer/**",
        "apps/web/app/customers/**",
        "docs/resources/customer-customization.md"
      ])
    );
  });

  it("includes AuditTrail product modules in forbidden paths", () => {
    const repoRoot = createRepo(createdRoots, {
      "specs/customer.json": readFixture("customer.json")
    });
    const result = createResourceInstallRecipeFromFile({
      repoRoot,
      specPath: "specs/customer.json"
    });

    expect(result.bundle.forbiddenPaths).toEqual(
      expect.arrayContaining([
        "apps/api/src/modules/audit-events/**",
        "apps/web/src/features/audit-events/**",
        "packages/domain/src/audit-events/**"
      ])
    );
  });

  it("includes planner, generator, smoke, apply, framework, and workspace checks", () => {
    const repoRoot = createRepo(createdRoots, {
      "specs/customer.json": readFixture("customer.json")
    });
    const result = createResourceInstallRecipeFromFile({
      repoRoot,
      specPath: "specs/customer.json"
    });

    expect(result.bundle.requiredChecks).toEqual(
      expect.arrayContaining([
        "pnpm saas doctor",
        "pnpm saas plan resource specs/customer.json",
        "pnpm saas agent context resource specs/customer.json",
        "pnpm saas add resource specs/customer.json --output .generated/resource-preview/customer",
        "pnpm saas check generators",
        "pnpm saas check generated-resource",
        "pnpm saas apply resource specs/customer.json --target .generated/apply-preview/customer",
        "pnpm --filter @auditrail/framework test",
        "pnpm --filter @auditrail/framework typecheck",
        "pnpm check:boundaries",
        "pnpm typecheck",
        "pnpm verify"
      ])
    );
  });

  it("emits stop conditions for unsupported central-file patching and AuditTrail imports", () => {
    const repoRoot = createRepo(createdRoots, {
      "specs/customer.json": readFixture("customer.json")
    });
    const result = createResourceInstallRecipeFromFile({
      repoRoot,
      specPath: "specs/customer.json"
    });

    expect(result.bundle.stopConditions).toEqual(
      expect.arrayContaining([
        expect.stringContaining("apps/api/src/app.ts"),
        expect.stringContaining("AuditTrail-specific modules")
      ])
    );
  });

  it("references docs by path instead of copying large doc contents", () => {
    const repoRoot = createRepo(createdRoots, {
      "specs/customer.json": readFixture("customer.json")
    });
    const result = createResourceInstallRecipeFromFile({
      repoRoot,
      specPath: "specs/customer.json"
    });
    const markdown = formatResourceInstallRecipeMarkdown(result.bundle);

    expect(markdown).toContain("AGENTS.md");
    expect(markdown).not.toContain("## Task Queue Rule");
    expect(markdown).not.toContain(
      "AuditTrail should be difficult to extend without tests."
    );
  });

  it("writes optional output files only to safe directories", () => {
    const repoRoot = createRepo(createdRoots, {
      "specs/customer.json": readFixture("customer.json")
    });
    const success = executeSaasCli({
      args: [
        "agent",
        "recipe",
        "resource-install",
        "specs/customer.json",
        "--output",
        ".generated/agent-recipes/customer.md"
      ],
      repoRoot
    });
    const failure = executeSaasCli({
      args: [
        "agent",
        "recipe",
        "resource-install",
        "specs/customer.json",
        "--output",
        "docs/customer.md"
      ],
      repoRoot
    });

    expect(success.exitCode).toBe(0);
    expect(
      readGenerated(repoRoot, ".generated/agent-recipes/customer.md")
    ).toContain("# AI Agent Recipe: Generated Resource Install");
    expect(failure.exitCode).toBe(1);
    expect(failure.stderr).toContain("Unsafe extraction output path");
  });
});

function createRepo(createdRoots: string[], files: Record<string, string>) {
  const root = mkdtempSync(join(tmpdir(), "auditrail-agent-recipe-"));

  createdRoots.push(root);

  for (const [path, contents] of Object.entries(files)) {
    const absolutePath = join(root, path);

    mkdirSync(join(absolutePath, ".."), {
      recursive: true
    });
    writeFileSync(absolutePath, contents);
  }

  return root;
}

function readFixture(name: string) {
  return readFileSync(
    resolve(process.cwd(), "tools/saas/__fixtures__/resources", name),
    "utf8"
  );
}

function readGenerated(repoRoot: string, path: string) {
  return readFileSync(resolve(repoRoot, path), "utf8");
}
