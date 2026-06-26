import { describe, expect, it } from "vitest";

import { createPostgresJobOutboxRepo } from "../postgres-repo.js";

describe("createPostgresJobOutboxRepo", () => {
  it("enqueues jobs with default attempts and timestamp normalization", async () => {
    const insertedJob = createJobRow();
    const db = createFakeDb({
      insertResults: [insertedJob]
    });
    const repo = createPostgresJobOutboxRepo(db.asDatabase(), {
      now: () => new Date("2026-06-26T10:00:00.000Z")
    });

    await expect(
      repo.enqueue({
        name: "email.delivery.requested",
        payload: {
          recipient: "user@example.com"
        }
      })
    ).resolves.toEqual({
      attemptCount: 0,
      availableAt: "2026-06-26T10:00:00.000Z",
      createdAt: "2026-06-26T10:00:00.000Z",
      id: "job-1",
      lastError: undefined,
      maxAttempts: 10,
      name: "email.delivery.requested",
      payload: {
        recipient: "user@example.com"
      },
      processedAt: undefined,
      status: "pending",
      updatedAt: "2026-06-26T10:00:00.000Z"
    });
    expect(db.insertValues[0]).toMatchObject({
      maxAttempts: 10,
      name: "email.delivery.requested"
    });
  });

  it("claims jobs from raw SQL results and returns undefined when none are available", async () => {
    const db = createFakeDb({
      executeRows: [
        [
          {
            ...createJobRow({
              attemptCount: 1,
              status: "processing"
            }),
            availableAt: "2026-06-26T10:00:00.000Z",
            createdAt: "2026-06-26T10:00:00.000Z",
            updatedAt: "2026-06-26T10:00:00.000Z"
          }
        ],
        []
      ]
    });
    const repo = createPostgresJobOutboxRepo(db.asDatabase());

    await expect(
      repo.claimNext({
        name: "email.delivery.requested",
        now: "2026-06-26T10:00:00.000Z"
      })
    ).resolves.toMatchObject({
      attemptCount: 1,
      id: "job-1",
      status: "processing"
    });
    await expect(repo.claimNext()).resolves.toBeUndefined();
    expect(db.executeCalls).toBe(2);
  });

  it("marks claimed jobs as completed", async () => {
    const db = createFakeDb({
      updateResults: [
        [
          createJobRow({
            processedAt: new Date("2026-06-26T10:01:00.000Z"),
            status: "completed",
            updatedAt: new Date("2026-06-26T10:01:00.000Z")
          })
        ]
      ]
    });
    const repo = createPostgresJobOutboxRepo(db.asDatabase());

    await expect(
      repo.markCompleted({
        id: "job-1",
        processedAt: "2026-06-26T10:01:00.000Z"
      })
    ).resolves.toMatchObject({
      processedAt: "2026-06-26T10:01:00.000Z",
      status: "completed"
    });
  });

  it("marks failed jobs as retryable when attempts remain", async () => {
    const db = createFakeDb({
      selectResults: [
        [
          createJobRow({
            attemptCount: 1,
            maxAttempts: 3,
            status: "processing"
          })
        ]
      ],
      updateResults: [
        [
          createJobRow({
            attemptCount: 1,
            availableAt: new Date("2026-06-26T10:05:00.000Z"),
            lastError: "smtp_unavailable",
            maxAttempts: 3,
            status: "pending"
          })
        ]
      ]
    });
    const repo = createPostgresJobOutboxRepo(db.asDatabase());

    await expect(
      repo.markFailed({
        error: "smtp_unavailable",
        id: "job-1",
        retryAt: "2026-06-26T10:05:00.000Z"
      })
    ).resolves.toMatchObject({
      lastError: "smtp_unavailable",
      processedAt: undefined,
      status: "pending"
    });
    expect(db.updateValues[0]).toMatchObject({
      lastError: "smtp_unavailable",
      processedAt: null,
      status: "pending"
    });
  });

  it("marks failed jobs as terminal when attempts are exhausted or missing", async () => {
    const exhaustedDb = createFakeDb({
      selectResults: [
        [
          createJobRow({
            attemptCount: 3,
            maxAttempts: 3,
            status: "processing"
          })
        ]
      ],
      updateResults: [
        [
          createJobRow({
            attemptCount: 3,
            lastError: "smtp_unavailable",
            maxAttempts: 3,
            processedAt: new Date("2026-06-26T10:05:00.000Z"),
            status: "failed",
            updatedAt: new Date("2026-06-26T10:05:00.000Z")
          })
        ]
      ]
    });
    const missingDb = createFakeDb({
      selectResults: [[]]
    });

    await expect(
      createPostgresJobOutboxRepo(exhaustedDb.asDatabase()).markFailed({
        error: "smtp_unavailable",
        id: "job-1",
        retryAt: "2026-06-26T10:05:00.000Z"
      })
    ).resolves.toMatchObject({
      processedAt: "2026-06-26T10:05:00.000Z",
      status: "failed"
    });
    await expect(
      createPostgresJobOutboxRepo(missingDb.asDatabase()).markFailed({
        error: "missing",
        id: "job-404"
      })
    ).resolves.toBeUndefined();
  });

  it("lists and counts pending jobs", async () => {
    const pendingJob = createJobRow();
    const db = createFakeDb({
      selectResults: [[pendingJob], [pendingJob], [{ count: 1 }], []]
    });
    const repo = createPostgresJobOutboxRepo(db.asDatabase());

    await expect(
      repo.listPending({
        limit: 1,
        name: "email.delivery.requested"
      })
    ).resolves.toEqual([
      {
        attemptCount: 0,
        availableAt: "2026-06-26T10:00:00.000Z",
        createdAt: "2026-06-26T10:00:00.000Z",
        id: "job-1",
        lastError: undefined,
        maxAttempts: 10,
        name: "email.delivery.requested",
        payload: {
          recipient: "user@example.com"
        },
        processedAt: undefined,
        status: "pending",
        updatedAt: "2026-06-26T10:00:00.000Z"
      }
    ]);
    await expect(repo.listPending()).resolves.toEqual([
      {
        attemptCount: 0,
        availableAt: "2026-06-26T10:00:00.000Z",
        createdAt: "2026-06-26T10:00:00.000Z",
        id: "job-1",
        lastError: undefined,
        maxAttempts: 10,
        name: "email.delivery.requested",
        payload: {
          recipient: "user@example.com"
        },
        processedAt: undefined,
        status: "pending",
        updatedAt: "2026-06-26T10:00:00.000Z"
      }
    ]);
    await expect(
      repo.countPending({
        name: "email.delivery.requested"
      })
    ).resolves.toBe(1);
    await expect(repo.countPending()).resolves.toBe(0);
  });
});

function createFakeDb(options: {
  insertResults?: unknown[];
  executeRows?: unknown[][];
  selectResults?: unknown[][];
  updateResults?: unknown[][];
}) {
  const insertResults = [...(options.insertResults ?? [])];
  const executeRows = [...(options.executeRows ?? [])];
  const selectResults = [...(options.selectResults ?? [])];
  const updateResults = [...(options.updateResults ?? [])];
  const insertValues: unknown[] = [];
  const updateValues: unknown[] = [];
  let executeCalls = 0;

  function nextSelectResult() {
    return Promise.resolve(selectResults.shift() ?? []);
  }

  const queryResult = {
    limit() {
      return nextSelectResult();
    },
    orderBy() {
      return queryResult;
    },
    then(onfulfilled: (value: unknown[]) => unknown, onrejected?: (reason: unknown) => unknown) {
      return nextSelectResult().then(onfulfilled, onrejected);
    }
  };

  return {
    insertValues,
    updateValues,
    asDatabase() {
      return {
        execute() {
          executeCalls += 1;

          return Promise.resolve({
            rows: executeRows.shift() ?? []
          });
        },
        insert() {
          return {
            values(value: unknown) {
              insertValues.push(value);

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
                where() {
                  return queryResult;
                }
              };
            }
          };
        },
        update() {
          return {
            set(value: unknown) {
              updateValues.push(value);

              return {
                where() {
                  return {
                    async returning() {
                      return updateResults.shift() ?? [];
                    }
                  };
                }
              };
            }
          };
        }
      } as never;
    },
    get executeCalls() {
      return executeCalls;
    }
  };
}

function createJobRow(
  overrides: Partial<{
    attemptCount: number;
    availableAt: Date;
    createdAt: Date;
    id: string;
    lastError: string | null;
    maxAttempts: number;
    name: "audit-event.created" | "billing.webhook.received" | "email.delivery.requested";
    payload: Record<string, unknown>;
    processedAt: Date | null;
    status: "pending" | "processing" | "completed" | "failed" | "cancelled";
    updatedAt: Date;
  }> = {}
) {
  return {
    attemptCount: 0,
    availableAt: new Date("2026-06-26T10:00:00.000Z"),
    createdAt: new Date("2026-06-26T10:00:00.000Z"),
    id: "job-1",
    lastError: null,
    maxAttempts: 10,
    name: "email.delivery.requested" as const,
    payload: {
      recipient: "user@example.com"
    },
    processedAt: null,
    status: "pending" as const,
    updatedAt: new Date("2026-06-26T10:00:00.000Z"),
    ...overrides
  };
}
