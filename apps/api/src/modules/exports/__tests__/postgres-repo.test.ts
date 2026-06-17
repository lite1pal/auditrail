import { describe, expect, it } from "vitest";

import { createPostgresExportJobRepo } from "../postgres-repo.js";

describe("createPostgresExportJobRepo", () => {
  it("creates and lists export jobs", async () => {
    const db = createFakeDb({
      insertResults: [
        {
          error: null,
          filters: { event: "user.created" },
          id: "export-1",
          objectKey: null,
          organizationId: "org-1",
          projectId: "project-1",
          requestedByUserId: "user-1",
          status: "pending"
        }
      ],
      selectResults: [
        [
          {
            error: "failed",
            filters: {},
            id: "export-2",
            objectKey: "exports/export-2.csv",
            organizationId: "org-1",
            projectId: "project-1",
            requestedByUserId: "user-1",
            status: "completed"
          }
        ]
      ]
    });
    const repo = createPostgresExportJobRepo(db.asDatabase());

    await expect(
      repo.create({
        filters: { event: "user.created" },
        organizationId: "org-1",
        projectId: "project-1",
        requestedByUserId: "user-1"
      })
    ).resolves.toEqual({
      error: undefined,
      filters: { event: "user.created" },
      id: "export-1",
      objectKey: undefined,
      organizationId: "org-1",
      projectId: "project-1",
      requestedByUserId: "user-1",
      status: "pending"
    });
    await expect(
      repo.listByProject({ organizationId: "org-1", projectId: "project-1" })
    ).resolves.toEqual([
      {
        error: "failed",
        filters: {},
        id: "export-2",
        objectKey: "exports/export-2.csv",
        organizationId: "org-1",
        projectId: "project-1",
        requestedByUserId: "user-1",
        status: "completed"
      }
    ]);
  });
});

function createFakeDb(options: {
  insertResults?: unknown[];
  selectResults?: unknown[][];
}) {
  const insertResults = [...(options.insertResults ?? [])];
  const selectResults = [...(options.selectResults ?? [])];

  return {
    asDatabase() {
      return {
        insert() {
          return {
            values() {
              return {
                async returning() {
                  return [insertResults.shift()];
                }
              };
            }
          };
        },
        select() {
          return {
            from() {
              return {
                async where() {
                  return selectResults.shift() ?? [];
                }
              };
            }
          };
        }
      } as never;
    }
  };
}
