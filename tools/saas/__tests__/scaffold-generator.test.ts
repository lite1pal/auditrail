import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync
} from "node:fs";
import { resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { executeSaasCli } from "../cli.js";
import {
  createDefaultScaffoldOutputPath,
  generateScaffold
} from "../scaffold-generator.js";

describe("saas scaffold generator", () => {
  const createdPaths: string[] = [];

  afterEach(() => {
    for (const path of createdPaths) {
      rmSync(resolve(process.cwd(), path), {
        force: true,
        recursive: true
      });
    }
  });

  it("writes deterministic scaffold output to an ignored target", () => {
    const outputPath = registerPath(
      createdPaths,
      ".generated/test-scaffolds/deterministic-app"
    );
    const first = generateScaffold({
      appName: "deterministic-app",
      force: true,
      outputPath,
      packageName: "@candidate/deterministic-app",
      productName: "Deterministic App",
      repoRoot: process.cwd()
    });
    const firstSnapshot = readDirectorySnapshot(outputPath);
    const second = generateScaffold({
      appName: "deterministic-app",
      force: true,
      outputPath,
      packageName: "@candidate/deterministic-app",
      productName: "Deterministic App",
      repoRoot: process.cwd()
    });
    const secondSnapshot = readDirectorySnapshot(outputPath);

    expect(first.outputPath).toBe(outputPath);
    expect(second.outputPath).toBe(outputPath);
    expect(firstSnapshot).toEqual(secondSnapshot);
  });

  it("fails for an invalid app name", () => {
    expect(() =>
      generateScaffold({
        appName: "Invalid App",
        repoRoot: process.cwd()
      })
    ).toThrow(/Invalid app name/i);
  });

  it("fails for an unsafe output path", () => {
    expect(() =>
      generateScaffold({
        appName: "unsafe-output-app",
        outputPath: "../outside-repo",
        repoRoot: process.cwd()
      })
    ).toThrow(/Unsafe extraction output path/i);
  });

  it("fails for an existing non-generated output path even with force", () => {
    const outputPath = registerPath(
      createdPaths,
      "tmp/test-scaffolds/existing-non-generated-app"
    );

    mkdirSync(resolve(process.cwd(), outputPath), {
      recursive: true
    });
    writeFileSync(
      resolve(process.cwd(), outputPath, "README.md"),
      "hand-created directory\n"
    );

    expect(() =>
      generateScaffold({
        appName: "existing-non-generated-app",
        force: true,
        outputPath,
        repoRoot: process.cwd()
      })
    ).toThrow(/non-generated scaffold output/i);
  });

  it("writes the generated README, report, and placeholder product config", () => {
    const outputPath = registerPath(
      createdPaths,
      "tmp/test-scaffolds/generated-files-app"
    );
    const result = generateScaffold({
      appName: "generated-files-app",
      outputPath,
      packageName: "@candidate/generated-files-app",
      productName: "Generated Files App",
      repoRoot: process.cwd()
    });

    expect(
      existsSync(resolve(process.cwd(), outputPath, result.scaffoldReadmePath))
    ).toBe(true);
    expect(
      existsSync(resolve(process.cwd(), outputPath, result.reportPath))
    ).toBe(true);
    expect(
      existsSync(
        resolve(
          process.cwd(),
          outputPath,
          "packages/domain/src/generated-files-app/product.ts"
        )
      )
    ).toBe(true);
  });

  it("replaces package, app, and product identity", () => {
    const outputPath = registerPath(
      createdPaths,
      "tmp/test-scaffolds/identity-app"
    );

    generateScaffold({
      appName: "identity-app",
      outputPath,
      packageName: "@candidate/identity-app",
      productName: "Identity App",
      repoRoot: process.cwd()
    });

    const packageJson = readFileSync(
      resolve(process.cwd(), outputPath, "package.json"),
      "utf8"
    );
    const productFile = readFileSync(
      resolve(process.cwd(), outputPath, "packages/domain/src/identity-app/product.ts"),
      "utf8"
    );

    expect(packageJson).toContain('"name": "@candidate/identity-app"');
    expect(productFile).toContain('"id": "identity-app"');
    expect(productFile).toContain('"name": "Identity App"');
    expect(productFile).not.toContain("placeholder-product");
    expect(productFile).not.toContain("Placeholder Product");
  });

  it("does not copy AuditTrail-specific product paths", () => {
    const outputPath = registerPath(
      createdPaths,
      "tmp/test-scaffolds/no-product-leak-app"
    );

    generateScaffold({
      appName: "no-product-leak-app",
      outputPath,
      repoRoot: process.cwd()
    });

    const snapshot = readDirectorySnapshot(outputPath);

    expect(
      Object.keys(snapshot).some((path) => path.includes("audit-events"))
    ).toBe(false);
  });

  it("fails when generated output contains an AuditTrail-specific import", () => {
    const outputPath = registerPath(
      createdPaths,
      "tmp/test-scaffolds/forbidden-import-app"
    );

    expect(() =>
      generateScaffold({
        appName: "forbidden-import-app",
        mutateFilesForTest(files) {
          files.push({
            contents: 'import "@auditrail/domain/audit-events";\n',
            origin: "generated",
            path: "apps/web/src/generated/forbidden-import.ts"
          });
        },
        outputPath,
        repoRoot: process.cwd()
      })
    ).toThrow(/forbidden-import/i);
  });

  it("fails when unresolved placeholders remain", () => {
    const outputPath = registerPath(
      createdPaths,
      "tmp/test-scaffolds/unresolved-placeholder-app"
    );

    expect(() =>
      generateScaffold({
        appName: "unresolved-placeholder-app",
        mutateFilesForTest(files) {
          files.push({
            contents: "TODO <resource>\n",
            origin: "generated",
            path: "docs/unresolved.md"
          });
        },
        outputPath,
        repoRoot: process.cwd()
      })
    ).toThrow(/unresolved-placeholder/i);
  });

  it("does not mutate real app source files during generation", () => {
    const outputPath = registerPath(
      createdPaths,
      "tmp/test-scaffolds/no-runtime-mutation-app"
    );
    const appSourcePath = resolve(process.cwd(), "apps/api/src/app.ts");
    const before = readFileSync(appSourcePath, "utf8");

    generateScaffold({
      appName: "no-runtime-mutation-app",
      outputPath,
      repoRoot: process.cwd()
    });

    expect(readFileSync(appSourcePath, "utf8")).toBe(before);
  });

  it("exposes the command through the CLI", () => {
    const outputPath = registerPath(
      createdPaths,
      createDefaultScaffoldOutputPath("cli-scaffold-app")
    );
    const result = executeSaasCli({
      args: [
        "generate",
        "scaffold",
        "cli-scaffold-app",
        "--output",
        outputPath
      ],
      repoRoot: process.cwd()
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Generated local scaffold candidate: cli-scaffold-app");
  });
});

function readDirectorySnapshot(outputPath: string) {
  const root = resolve(process.cwd(), outputPath);
  const files = walkFiles(root);

  return Object.fromEntries(
    files.map((absolutePath) => [
      absolutePath.replace(`${root}/`, ""),
      readFileSync(absolutePath, "utf8")
    ])
  );
}

function walkFiles(root: string): string[] {
  if (!existsSync(root)) {
    return [];
  }

  return readdirSync(root)
    .sort((left, right) => left.localeCompare(right))
    .flatMap((entry) => {
    const absolutePath = resolve(root, entry);
    const stats = statSync(absolutePath);

    if (stats.isDirectory()) {
      return walkFiles(absolutePath);
    }

    return [absolutePath];
  });
}

function registerPath(createdPaths: string[], path: string) {
  createdPaths.push(path);
  return path;
}
