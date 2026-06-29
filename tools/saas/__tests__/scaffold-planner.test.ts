import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { executeSaasCli } from "../cli.js";
import {
  createScaffoldPlan,
  formatScaffoldPlanMarkdown
} from "../scaffold-planner.js";

describe("saas scaffold planner", () => {
  it("produces a deterministic plan for a valid scaffold name", () => {
    const first = createScaffoldPlan({
      appName: "my-saas-app",
      repoRoot: process.cwd()
    });
    const second = createScaffoldPlan({
      appName: "my-saas-app",
      repoRoot: process.cwd()
    });

    expect(formatScaffoldPlanMarkdown(first)).toEqual(
      formatScaffoldPlanMarkdown(second)
    );
    expect(formatScaffoldPlanMarkdown(first)).toContain(
      "Scaffold plan: my-saas-app"
    );
  });

  it("fails for an invalid app name", () => {
    expect(() =>
      createScaffoldPlan({
        appName: "My SaaS App",
        repoRoot: process.cwd()
      })
    ).toThrow(/Invalid app name/i);
  });

  it("fails for an unsafe output directory", () => {
    expect(() =>
      createScaffoldPlan({
        appName: "my-saas-app",
        outputDirectory: "apps/api",
        repoRoot: process.cwd()
      })
    ).toThrow(/Unsafe scaffold output directory/i);
  });

  it("fails clearly for unsupported options", () => {
    const result = executeSaasCli({
      args: ["plan", "scaffold", "my-saas-app", "--database", "sqlite"],
      repoRoot: process.cwd()
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Unsupported database provider");
  });

  it("includes extraction, placeholder, and product setup groups", () => {
    const plan = createScaffoldPlan({
      appName: "my-saas-app",
      repoRoot: process.cwd()
    });

    expect(plan.source.copiedFromBoilerplateCandidate.length).toBeGreaterThan(0);
    expect(plan.source.generatedFromPlaceholderTemplates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "apps/web/app/getting-started/placeholder-product-onboarding.ts"
        })
      ])
    );
    expect(plan.productSetup.placeholderProductId).toBe("placeholder-product");
  });

  it("includes required quality gates", () => {
    const plan = createScaffoldPlan({
      appName: "my-saas-app",
      repoRoot: process.cwd()
    });

    expect(plan.qualityGates.checks.map((check) => check.command)).toEqual(
      expect.arrayContaining([
        "pnpm check:boundaries",
        "pnpm check:extraction",
        "pnpm check:extraction:placeholder",
        "pnpm saas doctor",
        "pnpm typecheck",
        "pnpm test",
        "pnpm verify"
      ])
    );
  });

  it("includes AI workflow hints", () => {
    const plan = createScaffoldPlan({
      appName: "my-saas-app",
      repoRoot: process.cwd()
    });

    expect(plan.aiWorkflow.recommendedCommands).toEqual(
      expect.arrayContaining([
        "pnpm saas agent context resource <resource-spec.json>",
        "pnpm saas agent recipe resource-install <resource-spec.json>"
      ])
    );
    expect(plan.aiWorkflow.stopConditions).toEqual(
      expect.arrayContaining([
        expect.stringContaining("actual scaffold generation"),
        expect.stringContaining("output directory")
      ])
    );
  });

  it("emits deterministic JSON through the CLI", () => {
    const first = executeSaasCli({
      args: ["plan", "scaffold", "my-saas-app", "--json"],
      repoRoot: process.cwd()
    });
    const second = executeSaasCli({
      args: ["plan", "scaffold", "my-saas-app", "--json"],
      repoRoot: process.cwd()
    });

    expect(first.exitCode).toBe(0);
    expect(first.stdout).toEqual(second.stdout);

    const payload = JSON.parse(first.stdout) as {
      planner: { appName: string; databaseProvider: string };
      source: { manualReview: Array<{ path: string }> };
    };

    expect(payload.planner).toMatchObject({
      appName: "my-saas-app",
      databaseProvider: "postgres"
    });
    expect(payload.source.manualReview.length).toBeGreaterThan(0);
  });

  it("keeps output ordering deterministic", () => {
    const plan = createScaffoldPlan({
      appName: "my-saas-app",
      repoRoot: process.cwd()
    });
    const copyPaths = plan.source.copiedFromBoilerplateCandidate.map(
      (entry) => entry.path
    );
    const sorted = [...copyPaths].sort((left, right) => left.localeCompare(right));

    expect(copyPaths).toEqual(sorted);
  });

  it("does not write scaffold files", () => {
    const outputDirectory = "tmp/scaffold-plan-no-write-check";

    if (existsSync(resolve(process.cwd(), outputDirectory))) {
      throw new Error(
        `Test precondition failed because '${outputDirectory}' already exists.`
      );
    }

    createScaffoldPlan({
      appName: "my-saas-app",
      outputDirectory,
      repoRoot: process.cwd()
    });

    expect(existsSync(resolve(process.cwd(), outputDirectory))).toBe(false);
  });
});
