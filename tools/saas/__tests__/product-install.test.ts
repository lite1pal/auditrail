import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { executeSaasCli } from "../cli.js";

describe("saas product install", () => {
  const createdRoots: string[] = [];

  afterEach(() => {
    for (const root of createdRoots) {
      rmSync(root, {
        force: true,
        recursive: true
      });
    }
  });

  it("installs a simple todo product without manual runtime edits", () => {
    const repoRoot = createSeededRepo(createdRoots);

    const initResult = executeSaasCli({
      args: [
        "init",
        "product",
        "todo",
        "--template",
        "todo",
        "--output",
        "specs/todo.product.json"
      ],
      repoRoot
    });
    const installResult = executeSaasCli({
      args: ["install", "product", "specs/todo.product.json"],
      repoRoot
    });

    expect(initResult.exitCode).toBe(0);
    expect(installResult.exitCode).toBe(0);
    expect(installResult.stdout).toContain("Installed product: todo");
    expect(installResult.stdout).toContain("resources: todo");
    expect(readGenerated(repoRoot, "apps/api/src/product-module.ts")).toContain(
      'import { todoProductModule } from "@auditrail/domain/todo";'
    );
    expect(readGenerated(repoRoot, "apps/web/app/product-module.ts")).toContain(
      'import { todoProductModule } from "@auditrail/domain/todo";'
    );
    expect(readGenerated(repoRoot, "packages/domain/package.json")).toContain(
      '"./todo"'
    );
    expect(readGenerated(repoRoot, "packages/domain/src/index.ts")).toContain(
      'export * from "./todo/index.js";'
    );
    expect(readGenerated(repoRoot, "packages/domain/src/todo/product.ts")).toContain(
      "todoProduct"
    );
    expect(readGenerated(repoRoot, "apps/web/app/todo/page.tsx")).toContain(
      'getProductMetadata("todo")'
    );
    expect(readGenerated(repoRoot, "apps/web/app/todo/todos/page.tsx")).toContain(
      "createTodoWorkspaceAction"
    );
    expect(
      readGenerated(repoRoot, "apps/web/app/todo/todos/[todoId]/page.tsx")
    ).toContain("loadTodoWorkspaceDetailPage");
    expect(
      readGenerated(repoRoot, "apps/web/app/todo/todos/[todoId]/edit/page.tsx")
    ).toContain("updateTodoWorkspaceAction");
    expect(
      readGenerated(repoRoot, "apps/web/app/todo/todos/[todoId]/page.tsx")
    ).toContain("deleteTodoWorkspaceAction");
    expect(
      readGenerated(repoRoot, "apps/web/src/features/todo/components/todo-form.tsx")
    ).toContain("defaultValues?: Partial<TodoRecord>;");
    expect(
      readGenerated(repoRoot, "apps/api/src/modules/generated/todo/routes.ts")
    ).toContain('app.delete("/v1/organizations/:organizationId/todos/:id"');
    expect(readGenerated(repoRoot, "apps/api/src/app.ts")).toContain(
      "registerTodoRoutes"
    );
    expect(readGenerated(repoRoot, "apps/api/src/__tests__/product-module.test.ts")).toContain(
      'id: "todo"'
    );
    expect(() =>
      statSync(resolve(repoRoot, "apps/web/app/todos/page.tsx"))
    ).toThrow();
  });

  it("can reinstall the same generated product with --force", () => {
    const repoRoot = createSeededRepo(createdRoots);

    executeSaasCli({
      args: [
        "init",
        "product",
        "todo",
        "--template",
        "todo",
        "--output",
        "specs/todo.product.json"
      ],
      repoRoot
    });

    const firstInstall = executeSaasCli({
      args: ["install", "product", "specs/todo.product.json"],
      repoRoot
    });
    const secondInstall = executeSaasCli({
      args: ["install", "product", "specs/todo.product.json", "--force"],
      repoRoot
    });

    expect(firstInstall.exitCode).toBe(0);
    expect(secondInstall.exitCode).toBe(0);
    expect(readGenerated(repoRoot, "apps/api/src/product-module.ts")).toContain(
      'import { todoProductModule } from "@auditrail/domain/todo";'
    );
    expect(
      readGenerated(repoRoot, "apps/api/src/product-module.ts").match(
        /todoProductModule/g
      )?.length
    ).toBe(2);
  });

  it("installs relation-aware product pages for generated resource targets", () => {
    const repoRoot = createSeededRepo(createdRoots);

    writeRepoFile(
      repoRoot,
      "specs/crm.product.json",
      JSON.stringify(
        {
          id: "crm",
          name: "CRM",
          resources: [
            {
              listPath: "/crm/companies",
              navLabel: "Companies",
              resource: {
                api: {
                  filters: [],
                  pagination: true,
                  prefix: "/v1/organizations/:organizationId/companies",
                  public: false
                },
                crud: {
                  create: true,
                  delete: false,
                  list: true,
                  read: true,
                  update: true
                },
                fields: [
                  {
                    name: "name",
                    required: true,
                    searchable: true,
                    sortable: true,
                    type: "string"
                  }
                ],
                label: "Company",
                ownership: "organization",
                permissions: {},
                pluralLabel: "Companies",
                relations: [],
                resource: "company",
                timestamps: {
                  createdAtField: "createdAt",
                  enabled: true,
                  updatedAtField: "updatedAt"
                },
                ui: {
                  createPage: false,
                  detailPage: false,
                  editPage: false,
                  listPage: false,
                  nav: false,
                  navLabel: "Companies"
                }
              }
            },
            {
              listPath: "/crm/deals",
              navLabel: "Deals",
              resource: {
                api: {
                  filters: [],
                  pagination: true,
                  prefix: "/v1/organizations/:organizationId/deals",
                  public: false
                },
                crud: {
                  create: true,
                  delete: false,
                  list: true,
                  read: true,
                  update: true
                },
                fields: [
                  {
                    name: "title",
                    required: true,
                    searchable: true,
                    sortable: true,
                    type: "string"
                  }
                ],
                label: "Deal",
                ownership: "organization",
                permissions: {},
                pluralLabel: "Deals",
                relations: [
                  {
                    kind: "belongs-to",
                    name: "company",
                    required: true,
                    target: "company",
                    targetScope: "generated"
                  }
                ],
                resource: "deal",
                timestamps: {
                  createdAtField: "createdAt",
                  enabled: true,
                  updatedAtField: "updatedAt"
                },
                ui: {
                  createPage: false,
                  detailPage: false,
                  editPage: false,
                  listPage: false,
                  nav: false,
                  navLabel: "Deals"
                }
              }
            }
          ]
        },
        null,
        2
      ) + "\n"
    );

    const installResult = executeSaasCli({
      args: ["install", "product", "specs/crm.product.json"],
      repoRoot
    });

    expect(installResult.exitCode).toBe(0);
    expect(
      readGenerated(repoRoot, "apps/web/src/features/crm-product/server/deal-workspace.ts")
    ).toContain(
      'import { createResourceClient as createCompanyResourceClient } from "@/src/features/company/api/company-client";'
    );
    expect(
      readGenerated(repoRoot, "apps/web/src/features/crm-product/server/deal-workspace.ts")
    ).toContain("resolveDealRelationPresentations");
    expect(
      readGenerated(repoRoot, "apps/web/app/crm/deals/page.tsx")
    ).toContain("relationPresentations={data.relationPresentations}");
    expect(
      readGenerated(repoRoot, "apps/web/app/crm/deals/[dealId]/page.tsx")
    ).toContain("renderRelationAwareDetailValue");
  });
});

function createSeededRepo(createdRoots: string[]) {
  const root = mkdtempSync(join(tmpdir(), "auditrail-product-install-"));

  createdRoots.push(root);

  const requiredFiles = [
    "apps/api/src/app.ts",
    "apps/api/src/product-module.ts",
    "apps/api/src/__tests__/product-module.test.ts",
    "apps/web/app/product-module.ts",
    "packages/db/src/migrations/meta/_journal.json",
    "packages/db/src/schema/index.ts",
    "packages/domain/package.json",
    "packages/domain/src/index.ts"
  ] as const;

  for (const filePath of requiredFiles) {
    writeRepoFile(root, filePath, readGenerated(process.cwd(), filePath));
  }

  return root;
}

function writeRepoFile(repoRoot: string, filePath: string, contents: string) {
  const absolutePath = resolve(repoRoot, filePath);

  mkdirSync(join(absolutePath, ".."), {
    recursive: true
  });
  writeFileSync(absolutePath, contents);
}

function readGenerated(repoRoot: string, filePath: string) {
  return readFileSync(resolve(repoRoot, filePath), "utf8");
}
