import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";

import * as schema from "@auditrail/db/schema";

import { loadEnvFiles } from "../../../../env-files.js";
import { createPostgresPlatformBillingRepo } from "../postgres-repo.js";
import type { AppDatabase } from "../../../../plugins/database.js";

const integrationEnv = z
  .object({
    TEST_DATABASE_URL: z.string().url()
  })
  .parse(loadEnvFiles());
const databaseUrl = integrationEnv.TEST_DATABASE_URL;

describe("createPostgresPlatformBillingRepo integration", () => {
  const currentTime = new Date("2026-06-26T12:00:00.000Z");
  const pool = new pg.Pool({
    connectionString: databaseUrl
  });
  const db = drizzle(pool, {
    schema
  }) as AppDatabase;
  const repo = createPostgresPlatformBillingRepo(db, {
    now: () => currentTime
  });

  beforeEach(async () => {
    try {
      await pool.query(
        'TRUNCATE TABLE "billing_subscriptions", "billing_customers", "organizations" RESTART IDENTITY CASCADE'
      );
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

  it("upserts and finds billing customers by organization and provider id", async () => {
    const organization = await createOrganization("Acme");

    const created = await repo.upsertBillingCustomer({
      organizationId: organization.id,
      provider: "stripe",
      providerCustomerId: "cus_123"
    });

    expect(created).toMatchObject({
      organizationId: organization.id,
      provider: "stripe",
      providerCustomerId: "cus_123"
    });
    await expect(
      repo.findBillingCustomerByOrganization({
        organizationId: organization.id,
        provider: "stripe"
      })
    ).resolves.toEqual(created);
    await expect(
      repo.findBillingCustomerByProviderCustomerId({
        provider: "stripe",
        providerCustomerId: "cus_123"
      })
    ).resolves.toEqual(created);
  });

  it("upserts subscriptions and finds them by provider subscription id", async () => {
    const organization = await createOrganization("Acme");
    const customer = await repo.upsertBillingCustomer({
      organizationId: organization.id,
      provider: "stripe",
      providerCustomerId: "cus_123"
    });

    const subscription = await repo.upsertSubscription({
      billingCustomerId: customer.id,
      billingPlanId: "billing-pro-monthly",
      cancelAtPeriodEnd: false,
      currentPeriodEnd: "2026-07-01T00:00:00.000Z",
      currentPeriodStart: "2026-06-01T00:00:00.000Z",
      entitlementPlanId: "growth",
      organizationId: organization.id,
      provider: "stripe",
      providerPriceId: "price_123",
      providerProductId: "prod_123",
      providerSubscriptionId: "sub_123",
      status: "active"
    });

    expect(subscription).toMatchObject({
      billingCustomerId: customer.id,
      billingPlanId: "billing-pro-monthly",
      entitlementPlanId: "growth",
      organizationId: organization.id,
      provider: "stripe",
      providerPriceId: "price_123",
      providerProductId: "prod_123",
      providerSubscriptionId: "sub_123",
      status: "active"
    });
    await expect(
      repo.findSubscriptionByProviderSubscriptionId({
        provider: "stripe",
        providerSubscriptionId: "sub_123"
      })
    ).resolves.toEqual(subscription);
  });

  it("returns the current subscription for the requested organization only", async () => {
    const firstOrganization = await createOrganization("Acme");
    const secondOrganization = await createOrganization("Bravo");
    const firstCustomer = await repo.upsertBillingCustomer({
      organizationId: firstOrganization.id,
      provider: "stripe",
      providerCustomerId: "cus_123"
    });
    const secondCustomer = await repo.upsertBillingCustomer({
      organizationId: secondOrganization.id,
      provider: "stripe",
      providerCustomerId: "cus_456"
    });

    await repo.upsertSubscription({
      billingCustomerId: firstCustomer.id,
      billingPlanId: "billing-starter-monthly",
      currentPeriodEnd: "2026-06-15T00:00:00.000Z",
      currentPeriodStart: "2026-05-15T00:00:00.000Z",
      entitlementPlanId: "starter",
      organizationId: firstOrganization.id,
      provider: "stripe",
      providerPriceId: "price_old",
      providerSubscriptionId: "sub_old",
      status: "active"
    });
    const currentSubscription = await repo.upsertSubscription({
      billingCustomerId: firstCustomer.id,
      billingPlanId: "billing-growth-monthly",
      currentPeriodEnd: "2026-07-01T00:00:00.000Z",
      currentPeriodStart: "2026-06-01T00:00:00.000Z",
      entitlementPlanId: "growth",
      organizationId: firstOrganization.id,
      provider: "stripe",
      providerPriceId: "price_current",
      providerSubscriptionId: "sub_current",
      status: "trialing"
    });
    await repo.upsertSubscription({
      billingCustomerId: secondCustomer.id,
      billingPlanId: "billing-scale-monthly",
      currentPeriodEnd: "2026-07-01T00:00:00.000Z",
      currentPeriodStart: "2026-06-01T00:00:00.000Z",
      entitlementPlanId: "scale",
      organizationId: secondOrganization.id,
      provider: "stripe",
      providerPriceId: "price_other_org",
      providerSubscriptionId: "sub_other_org",
      status: "active"
    });

    await expect(
      repo.findCurrentSubscriptionByOrganization(firstOrganization.id)
    ).resolves.toEqual(currentSubscription);
    await expect(
      repo.findCurrentSubscriptionByOrganization(secondOrganization.id)
    ).resolves.toMatchObject({
      organizationId: secondOrganization.id,
      providerSubscriptionId: "sub_other_org"
    });
  });

  it("updates subscription status and billing periods", async () => {
    const organization = await createOrganization("Acme");
    const customer = await repo.upsertBillingCustomer({
      organizationId: organization.id,
      provider: "stripe",
      providerCustomerId: "cus_123"
    });
    await repo.upsertSubscription({
      billingCustomerId: customer.id,
      billingPlanId: "billing-pro-monthly",
      currentPeriodEnd: "2026-07-01T00:00:00.000Z",
      currentPeriodStart: "2026-06-01T00:00:00.000Z",
      entitlementPlanId: "growth",
      organizationId: organization.id,
      provider: "stripe",
      providerPriceId: "price_123",
      providerSubscriptionId: "sub_123",
      status: "active"
    });

    const updated = await repo.updateSubscriptionState({
      cancelAtPeriodEnd: true,
      currentPeriodEnd: "2026-08-01T00:00:00.000Z",
      currentPeriodStart: "2026-07-01T00:00:00.000Z",
      provider: "stripe",
      providerSubscriptionId: "sub_123",
      status: "past_due"
    });

    expect(updated).toMatchObject({
      cancelAtPeriodEnd: true,
      currentPeriodEnd: "2026-08-01T00:00:00.000Z",
      currentPeriodStart: "2026-07-01T00:00:00.000Z",
      providerSubscriptionId: "sub_123",
      status: "past_due"
    });
  });

  it("keeps one billing customer row per organization and provider when upserting", async () => {
    const organization = await createOrganization("Acme");

    const first = await repo.upsertBillingCustomer({
      organizationId: organization.id,
      provider: "stripe",
      providerCustomerId: "cus_123"
    });
    const second = await repo.upsertBillingCustomer({
      organizationId: organization.id,
      provider: "stripe",
      providerCustomerId: "cus_456"
    });

    expect(second.id).toBe(first.id);
    expect(second.providerCustomerId).toBe("cus_456");
    await expect(countRows("billing_customers")).resolves.toBe(1);
  });

  it("enforces unique provider customer ids and provider subscription ids", async () => {
    const firstOrganization = await createOrganization("Acme");
    const secondOrganization = await createOrganization("Bravo");
    const customer = await repo.upsertBillingCustomer({
      organizationId: firstOrganization.id,
      provider: "stripe",
      providerCustomerId: "cus_123"
    });

    await expect(
      pool.query(
        `insert into "billing_customers" ("organization_id", "provider", "provider_customer_id")
         values ($1, $2, $3)`,
        [secondOrganization.id, "stripe", "cus_123"]
      )
    ).rejects.toThrow();

    await repo.upsertSubscription({
      billingCustomerId: customer.id,
      billingPlanId: "billing-pro-monthly",
      entitlementPlanId: "growth",
      organizationId: firstOrganization.id,
      provider: "stripe",
      providerPriceId: "price_123",
      providerSubscriptionId: "sub_123",
      status: "active"
    });

    await expect(
      pool.query(
        `insert into "billing_subscriptions" (
          "organization_id",
          "billing_customer_id",
          "provider",
          "provider_subscription_id",
          "provider_price_id",
          "billing_plan_id",
          "entitlement_plan_id",
          "status"
        ) values ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          firstOrganization.id,
          customer.id,
          "stripe",
          "sub_123",
          "price_456",
          "billing-scale-monthly",
          "scale",
          "active"
        ]
      )
    ).rejects.toThrow();
  });

  async function createOrganization(name: string) {
    const [organization] = await db
      .insert(schema.organizations)
      .values({
        name
      })
      .returning();

    return organization;
  }

  async function countRows(tableName: "billing_customers" | "billing_subscriptions") {
    const result = await pool.query<{ count: string }>(
      `select count(*)::text as "count" from "${tableName}"`
    );

    return Number(result.rows[0]?.count ?? 0);
  }
});
