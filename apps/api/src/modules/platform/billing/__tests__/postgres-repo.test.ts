import { describe, expect, it } from "vitest";

import { createPostgresPlatformBillingRepo } from "../postgres-repo.js";

describe("createPostgresPlatformBillingRepo", () => {
  it("upserts and finds billing customers", async () => {
    const db = createFakeDb({
      insertResults: [
        {
          createdAt: new Date("2026-06-26T12:00:00.000Z"),
          id: "customer-1",
          organizationId: "org-1",
          provider: "stripe",
          providerCustomerId: "cus_123",
          updatedAt: new Date("2026-06-26T12:00:00.000Z")
        }
      ],
      selectResults: [
        [
          {
            createdAt: "2026-06-26T12:00:00.000Z",
            id: "customer-1",
            organizationId: "org-1",
            provider: "stripe",
            providerCustomerId: "cus_123",
            updatedAt: "2026-06-26T12:00:00.000Z"
          }
        ],
        [
          {
            createdAt: new Date("2026-06-26T12:00:00.000Z"),
            id: "customer-1",
            organizationId: "org-1",
            provider: "stripe",
            providerCustomerId: "cus_123",
            updatedAt: new Date("2026-06-26T12:00:00.000Z")
          }
        ],
        [],
        []
      ]
    });
    const repo = createPostgresPlatformBillingRepo(db.asDatabase(), {
      now: () => new Date("2026-06-26T12:00:00.000Z")
    });

    await expect(
      repo.upsertBillingCustomer({
        organizationId: "org-1",
        provider: "stripe",
        providerCustomerId: "cus_123"
      })
    ).resolves.toEqual({
      createdAt: "2026-06-26T12:00:00.000Z",
      id: "customer-1",
      organizationId: "org-1",
      provider: "stripe",
      providerCustomerId: "cus_123",
      updatedAt: "2026-06-26T12:00:00.000Z"
    });
    await expect(
      repo.findBillingCustomerByOrganization({
        organizationId: "org-1",
        provider: "stripe"
      })
    ).resolves.toEqual({
      createdAt: "2026-06-26T12:00:00.000Z",
      id: "customer-1",
      organizationId: "org-1",
      provider: "stripe",
      providerCustomerId: "cus_123",
      updatedAt: "2026-06-26T12:00:00.000Z"
    });
    await expect(
      repo.findBillingCustomerByProviderCustomerId({
        provider: "stripe",
        providerCustomerId: "cus_123"
      })
    ).resolves.toEqual({
      createdAt: "2026-06-26T12:00:00.000Z",
      id: "customer-1",
      organizationId: "org-1",
      provider: "stripe",
      providerCustomerId: "cus_123",
      updatedAt: "2026-06-26T12:00:00.000Z"
    });
    await expect(
      repo.findBillingCustomerByProviderCustomerId({
        provider: "stripe",
        providerCustomerId: "cus_missing"
      })
    ).resolves.toBeUndefined();
    await expect(
      repo.findBillingCustomerByOrganization({
        organizationId: "org-404",
        provider: "stripe"
      })
    ).resolves.toBeUndefined();

    expect(db.insertValues[0]).toMatchObject({
      organizationId: "org-1",
      provider: "stripe",
      providerCustomerId: "cus_123"
    });
  });

  it("upserts, finds, and updates subscriptions", async () => {
    const db = createFakeDb({
      insertResults: [
        {
          billingCustomerId: "customer-1",
          billingPlanId: "billing-growth-monthly",
          cancelAtPeriodEnd: false,
          createdAt: new Date("2026-06-26T12:00:00.000Z"),
          currentPeriodEnd: new Date("2026-07-01T00:00:00.000Z"),
          currentPeriodStart: new Date("2026-06-01T00:00:00.000Z"),
          entitlementPlanId: "growth",
          id: "subscription-1",
          organizationId: "org-1",
          provider: "stripe",
          providerPriceId: "price_123",
          providerProductId: "prod_123",
          providerSubscriptionId: "sub_123",
          status: "active",
          updatedAt: new Date("2026-06-26T12:00:00.000Z")
        }
      ],
      selectResults: [
        [
          {
            billingCustomerId: "customer-1",
            billingPlanId: "billing-growth-monthly",
            cancelAtPeriodEnd: false,
            createdAt: "2026-06-26T12:00:00.000Z",
            currentPeriodEnd: "2026-07-01T00:00:00.000Z",
            currentPeriodStart: "2026-06-01T00:00:00.000Z",
            entitlementPlanId: "growth",
            id: "subscription-1",
            organizationId: "org-1",
            provider: "stripe",
            providerPriceId: "price_123",
            providerProductId: null,
            providerSubscriptionId: "sub_123",
            status: "active",
            updatedAt: "2026-06-26T12:00:00.000Z"
          }
        ],
        [
          {
            billingCustomerId: "customer-1",
            billingPlanId: "billing-growth-monthly",
            cancelAtPeriodEnd: false,
            createdAt: new Date("2026-06-26T12:00:00.000Z"),
            currentPeriodEnd: new Date("2026-07-01T00:00:00.000Z"),
            currentPeriodStart: new Date("2026-06-01T00:00:00.000Z"),
            entitlementPlanId: "growth",
            id: "subscription-1",
            organizationId: "org-1",
            provider: "stripe",
            providerPriceId: "price_123",
            providerProductId: "prod_123",
            providerSubscriptionId: "sub_123",
            status: "trialing",
            updatedAt: new Date("2026-06-26T12:00:00.000Z")
          }
        ],
        []
      ],
      updateResults: [
        [
          {
            billingCustomerId: "customer-1",
            billingPlanId: "billing-growth-monthly",
            cancelAtPeriodEnd: true,
            createdAt: new Date("2026-06-26T12:00:00.000Z"),
            currentPeriodEnd: new Date("2026-08-01T00:00:00.000Z"),
            currentPeriodStart: new Date("2026-07-01T00:00:00.000Z"),
            entitlementPlanId: "growth",
            id: "subscription-1",
            organizationId: "org-1",
            provider: "stripe",
            providerPriceId: "price_123",
            providerProductId: "prod_123",
            providerSubscriptionId: "sub_123",
            status: "past_due",
            updatedAt: new Date("2026-06-26T12:30:00.000Z")
          }
        ],
        []
      ]
    });
    const repo = createPostgresPlatformBillingRepo(db.asDatabase(), {
      now: () => new Date("2026-06-26T12:30:00.000Z")
    });

    await expect(
      repo.upsertSubscription({
        billingCustomerId: "customer-1",
        billingPlanId: "billing-growth-monthly",
        cancelAtPeriodEnd: false,
        currentPeriodEnd: "2026-07-01T00:00:00.000Z",
        currentPeriodStart: "2026-06-01T00:00:00.000Z",
        entitlementPlanId: "growth",
        organizationId: "org-1",
        provider: "stripe",
        providerPriceId: "price_123",
        providerProductId: "prod_123",
        providerSubscriptionId: "sub_123",
        status: "active"
      })
    ).resolves.toMatchObject({
      billingCustomerId: "customer-1",
      providerSubscriptionId: "sub_123",
      status: "active"
    });
    await expect(
      repo.findSubscriptionByProviderSubscriptionId({
        provider: "stripe",
        providerSubscriptionId: "sub_123"
      })
    ).resolves.toEqual({
      billingCustomerId: "customer-1",
      billingPlanId: "billing-growth-monthly",
      cancelAtPeriodEnd: false,
      createdAt: "2026-06-26T12:00:00.000Z",
      currentPeriodEnd: "2026-07-01T00:00:00.000Z",
      currentPeriodStart: "2026-06-01T00:00:00.000Z",
      entitlementPlanId: "growth",
      id: "subscription-1",
      organizationId: "org-1",
      provider: "stripe",
      providerPriceId: "price_123",
      providerProductId: undefined,
      providerSubscriptionId: "sub_123",
      status: "active",
      updatedAt: "2026-06-26T12:00:00.000Z"
    });
    await expect(
      repo.findCurrentSubscriptionByOrganization("org-1")
    ).resolves.toMatchObject({
      providerSubscriptionId: "sub_123",
      status: "trialing"
    });
    await expect(
      repo.findCurrentSubscriptionByOrganization("org-404")
    ).resolves.toBeUndefined();
    await expect(
      repo.updateSubscriptionState({
        cancelAtPeriodEnd: true,
        currentPeriodEnd: "2026-08-01T00:00:00.000Z",
        currentPeriodStart: "2026-07-01T00:00:00.000Z",
        provider: "stripe",
        providerSubscriptionId: "sub_123",
        status: "past_due"
      })
    ).resolves.toMatchObject({
      cancelAtPeriodEnd: true,
      currentPeriodEnd: "2026-08-01T00:00:00.000Z",
      currentPeriodStart: "2026-07-01T00:00:00.000Z",
      providerSubscriptionId: "sub_123",
      status: "past_due",
      updatedAt: "2026-06-26T12:30:00.000Z"
    });
    await expect(
      repo.updateSubscriptionState({
        cancelAtPeriodEnd: false,
        provider: "stripe",
        providerSubscriptionId: "missing",
        status: "canceled"
      })
    ).resolves.toBeUndefined();

    expect(db.updateValues[0]).toMatchObject({
      cancelAtPeriodEnd: true,
      status: "past_due"
    });
  });

  it("normalizes missing optional subscription fields", async () => {
    const db = createFakeDb({
      insertResults: [
        {
          billingCustomerId: "customer-2",
          billingPlanId: "billing-starter-monthly",
          cancelAtPeriodEnd: false,
          createdAt: "2026-06-26T12:00:00.000Z",
          currentPeriodEnd: null,
          currentPeriodStart: null,
          entitlementPlanId: "starter",
          id: "subscription-2",
          organizationId: "org-2",
          provider: "stripe",
          providerPriceId: "price_456",
          providerProductId: null,
          providerSubscriptionId: "sub_456",
          status: "incomplete",
          updatedAt: "2026-06-26T12:00:00.000Z"
        }
      ],
      selectResults: [[]]
    });
    const repo = createPostgresPlatformBillingRepo(db.asDatabase());

    await expect(
      repo.upsertSubscription({
        billingCustomerId: "customer-2",
        billingPlanId: "billing-starter-monthly",
        entitlementPlanId: "starter",
        organizationId: "org-2",
        provider: "stripe",
        providerPriceId: "price_456",
        providerSubscriptionId: "sub_456",
        status: "incomplete"
      })
    ).resolves.toEqual({
      billingCustomerId: "customer-2",
      billingPlanId: "billing-starter-monthly",
      cancelAtPeriodEnd: false,
      createdAt: "2026-06-26T12:00:00.000Z",
      currentPeriodEnd: undefined,
      currentPeriodStart: undefined,
      entitlementPlanId: "starter",
      id: "subscription-2",
      organizationId: "org-2",
      provider: "stripe",
      providerPriceId: "price_456",
      providerProductId: undefined,
      providerSubscriptionId: "sub_456",
      status: "incomplete",
      updatedAt: "2026-06-26T12:00:00.000Z"
    });
    await expect(
      repo.findSubscriptionByProviderSubscriptionId({
        provider: "stripe",
        providerSubscriptionId: "sub_missing"
      })
    ).resolves.toBeUndefined();

    expect(db.insertValues[0]).toMatchObject({
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
      currentPeriodStart: null,
      providerProductId: null
    });
  });
});

function createFakeDb(options: {
  insertResults?: unknown[];
  selectResults?: unknown[][];
  updateResults?: unknown[][];
}) {
  const insertResults = [...(options.insertResults ?? [])];
  const selectResults = [...(options.selectResults ?? [])];
  const updateResults = [...(options.updateResults ?? [])];
  const insertValues: unknown[] = [];
  const updateValues: unknown[] = [];

  return {
    insertValues,
    updateValues,
    asDatabase() {
      return {
        insert() {
          return {
            values(value: unknown) {
              insertValues.push(value);

              return {
                onConflictDoUpdate() {
                  return {
                    async returning() {
                      return [insertResults.shift()];
                    }
                  };
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
                  async function resolveRows() {
                    return selectResults.shift() ?? [];
                  }

                  return {
                    async limit() {
                      return resolveRows();
                    },
                    orderBy() {
                      return {
                        async limit() {
                          return resolveRows();
                        }
                      };
                    }
                  };
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
    }
  };
}
