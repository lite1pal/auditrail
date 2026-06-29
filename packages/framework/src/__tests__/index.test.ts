import { describe, expect, it } from "vitest";

import {
  frameworkAgentTaskDefinitionSchema,
  frameworkGeneratorPlanSchema,
  frameworkOwnershipDefinitionSchema,
  frameworkResourceDefinitionSchema
} from "../index.js";

describe("framework contracts", () => {
  it("accepts a valid generic resource definition", () => {
    expect(
      frameworkResourceDefinitionSchema.parse({
        crud: {
          enabledOperations: ["list", "create", "read", "update"]
        },
        fields: [
          {
            name: "id",
            required: true,
            type: "uuid",
            unique: true
          },
          {
            name: "status",
            enumValues: ["draft", "active"],
            required: true,
            type: "enum"
          }
        ],
        id: "workspace",
        moduleId: "workspace-platform",
        moduleKind: "platform-core",
        name: "Workspace",
        ownership: {
          mode: "organization",
          ownerField: "organizationId"
        },
        routes: [
          {
            authStrategy: "session",
            id: "list-workspaces",
            method: "GET",
            path: "/workspaces",
            resourceId: "workspace"
          }
        ]
      })
    ).toMatchObject({
      id: "workspace",
      ownership: {
        mode: "organization",
        ownerField: "organizationId"
      }
    });
  });

  it("rejects invalid field types", () => {
    expect(() =>
      frameworkResourceDefinitionSchema.parse({
        fields: [
          {
            name: "title",
            required: true,
            type: "markdown"
          }
        ],
        id: "note",
        moduleId: "notes",
        moduleKind: "product",
        name: "Note",
        ownership: {
          mode: "user",
          ownerField: "userId"
        }
      })
    ).toThrow();
  });

  it("rejects invalid ownership modes", () => {
    expect(() =>
      frameworkOwnershipDefinitionSchema.parse({
        mode: "workspace",
        ownerField: "workspaceId"
      })
    ).toThrow();
  });

  it("accepts a generator plan with generated file entries", () => {
    expect(
      frameworkGeneratorPlanSchema.parse({
        agentContext: {
          checkIds: ["framework-typecheck"],
          contextFiles: ["packages/framework/src/index.ts"],
          moduleIds: ["framework-contracts"],
          resourceIds: ["workspace"],
          summary: "Generate platform-owned framework contract scaffolding only.",
          taskIds: ["framework-contract-review"]
        },
        agentTasks: [
          {
            allowedPaths: ["packages/framework/**"],
            contextFiles: ["packages/framework/src/index.ts"],
            forbiddenPaths: ["apps/api/**", "apps/web/**"],
            goal: "Keep the contract package pure and generic.",
            id: "framework-contract-review",
            reportFields: ["files changed", "checks run"],
            requiredChecks: ["framework-typecheck"],
            stopConditions: ["unexpected runtime dependency", "product import detected"],
            taskType: "implementation"
          }
        ],
        checks: [
          {
            appliesToPaths: ["packages/framework/**"],
            command: "pnpm --filter @auditrail/framework typecheck",
            id: "framework-typecheck",
            required: true
          }
        ],
        generatedFiles: [
          {
            action: "create",
            moduleKind: "tooling",
            path: "packages/framework/src/index.ts",
            reason: "Expose the framework contract vocabulary.",
            requiresManualReview: false,
            templateId: "framework-contracts/index"
          }
        ],
        modules: [
          {
            id: "framework-contracts",
            kind: "tooling",
            resourceIds: ["workspace"],
            rootPath: "packages/framework/src"
          }
        ],
        resources: [
          {
            fields: [
              {
                name: "id",
                required: true,
                type: "uuid"
              }
            ],
            id: "workspace",
            moduleId: "framework-contracts",
            moduleKind: "tooling",
            name: "Workspace",
            ownership: {
              mode: "organization",
              ownerField: "organizationId"
            }
          }
        ]
      })
    ).toMatchObject({
      generatedFiles: [
        {
          action: "create",
          path: "packages/framework/src/index.ts"
        }
      ]
    });
  });

  it("accepts an agent task with allowed and forbidden paths", () => {
    expect(
      frameworkAgentTaskDefinitionSchema.parse({
        allowedPaths: ["packages/framework/**", "docs/**"],
        contextFiles: ["docs/02-architecture.md", "tasks/workflow.txt"],
        forbiddenPaths: ["apps/api/**", "packages/domain/src/audit-events/**"],
        goal: "Define the reusable framework contract layer without runtime changes.",
        id: "framework-contract-task",
        reportFields: ["boundary scanner result", "next suggested task"],
        requiredChecks: ["framework-typecheck", "boundaries"],
        stopConditions: ["runtime route change", "database migration required"],
        taskType: "implementation"
      })
    ).toMatchObject({
      allowedPaths: ["packages/framework/**", "docs/**"],
      forbiddenPaths: ["apps/api/**", "packages/domain/src/audit-events/**"]
    });
  });
});
