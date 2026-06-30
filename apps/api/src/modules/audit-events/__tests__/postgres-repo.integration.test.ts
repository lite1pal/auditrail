import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";

import * as schema from "@auditrail/db/schema";

import { loadEnvFiles } from "../../../env-files.js";
import { createPostgresAuditEventRepo } from "../postgres-repo.js";
import type { AppDatabase } from "../../../plugins/database.js";

const integrationEnv = z
  .object({
    TEST_DATABASE_URL: z.string().url()
  })
  .parse(loadEnvFiles());
const databaseUrl = integrationEnv.TEST_DATABASE_URL;

describe("createPostgresAuditEventRepo integration", () => {
  const pool = new pg.Pool({
    connectionString: databaseUrl
  });
  const db = drizzle(pool, {
    schema
  }) as AppDatabase;
  const repo = createPostgresAuditEventRepo(db, {
    now: () => new Date("2026-06-30T12:00:00.000Z")
  });

  beforeEach(async () => {
    try {
      await pool.query(`
        TRUNCATE TABLE
          "job_outbox",
          project_webhook_deliveries,
          project_webhook_endpoints,
          audit_events,
          organization_monthly_usage,
          api_keys,
          auth_sessions,
          auth_magic_links,
          organization_memberships,
          organization_invitations,
          user_organization_onboarding_states,
          projects,
          organizations,
          users
        RESTART IDENTITY CASCADE
      `);
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "3D000"
      ) {
        throw new Error(
          "TEST_DATABASE_URL database does not exist. Run `pnpm db:create:test && pnpm db:migrate:test` first."
        );
      }

      throw error;
    }
  });

  afterAll(async () => {
    await pool.end();
  });

  it("fails closed for mismatched organization scope on event reads", async () => {
    const scoped = await createOrganizationProjectPair("Acme", "Production");
    const unscoped = await createOrganizationProjectPair("Other", "Staging");

    await pool.query(
      `insert into "audit_events"
         ("organization_id", "project_id", "event_type", "metadata", "created_at")
       values ($1, $2, $3, $4::jsonb, $5)`,
      [
        scoped.organizationId,
        unscoped.projectId,
        "tenant.corrupted",
        JSON.stringify({ leaked: true }),
        "2026-06-30T12:00:00.000Z"
      ]
    );

    await expect(
      repo.list(
        {
          organizationId: scoped.organizationId,
          projectId: unscoped.projectId
        },
        {
          limit: 10
        }
      )
    ).resolves.toEqual([]);
    await expect(
      repo.summarize(
        {
          organizationId: scoped.organizationId,
          projectId: unscoped.projectId
        },
        {
          top: 5
        }
      )
    ).resolves.toEqual({
      totalEvents: 0,
      topEventTypes: []
    });
    await expect(
      repo.timeseries(
        {
          organizationId: scoped.organizationId,
          projectId: unscoped.projectId
        },
        {
          bucket: "hour",
          from: "2026-06-30T00:00:00.000Z",
          to: "2026-07-01T00:00:00.000Z"
        }
      )
    ).resolves.toEqual([]);
  });

  it("rejects event writes when the project does not belong to the organization", async () => {
    const scoped = await createOrganizationProjectPair("Acme", "Production");
    const unscoped = await createOrganizationProjectPair("Other", "Staging");

    await expect(
      repo.append(
        {
          organizationId: scoped.organizationId,
          projectId: unscoped.projectId
        },
        {
          event: "tenant.write_attempted",
          metadata: {}
        }
      )
    ).rejects.toThrow("project_not_found");
    await expect(countAuditEvents()).resolves.toBe(0);
    await expect(countUsageRows()).resolves.toBe(0);
  });

  async function createOrganizationProjectPair(
    organizationName: string,
    projectName: string
  ) {
    const organizationResult = await pool.query<{ id: string }>(
      `insert into "organizations" ("name")
       values ($1)
       returning "id"`,
      [organizationName]
    );
    const organizationId = organizationResult.rows[0]!.id;
    const projectResult = await pool.query<{ id: string }>(
      `insert into "projects" ("organization_id", "name", "environment")
       values ($1, $2, 'production')
       returning "id"`,
      [organizationId, projectName]
    );

    return {
      organizationId,
      projectId: projectResult.rows[0]!.id
    };
  }

  async function countAuditEvents() {
    const result = await pool.query<{ count: string }>(
      'select cast(count(*) as text) as "count" from "audit_events"'
    );

    return Number(result.rows[0]?.count ?? "0");
  }

  async function countUsageRows() {
    const result = await pool.query<{ count: string }>(
      'select cast(count(*) as text) as "count" from "organization_monthly_usage"'
    );

    return Number(result.rows[0]?.count ?? "0");
  }
});
