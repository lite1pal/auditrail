import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";

import { organizations } from "./identity.js";

export const billingCustomers = pgTable(
  "billing_customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    provider: text("provider").notNull(),
    providerCustomerId: text("provider_customer_id").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true
    })
      .notNull()
      .defaultNow()
  },
  (table) => [
    index("billing_customers_organization_id_idx").on(table.organizationId),
    uniqueIndex("billing_customers_provider_customer_unique").on(
      table.provider,
      table.providerCustomerId
    ),
    uniqueIndex("billing_customers_org_provider_unique").on(
      table.organizationId,
      table.provider
    )
  ]
);

export const billingSubscriptions = pgTable(
  "billing_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    billingCustomerId: uuid("billing_customer_id")
      .notNull()
      .references(() => billingCustomers.id),
    provider: text("provider").notNull(),
    providerSubscriptionId: text("provider_subscription_id").notNull(),
    providerPriceId: text("provider_price_id").notNull(),
    providerProductId: text("provider_product_id"),
    billingPlanId: text("billing_plan_id").notNull(),
    entitlementPlanId: text("entitlement_plan_id").notNull(),
    status: text("status").notNull(),
    currentPeriodStart: timestamp("current_period_start", {
      withTimezone: true
    }),
    currentPeriodEnd: timestamp("current_period_end", {
      withTimezone: true
    }),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    createdAt: timestamp("created_at", {
      withTimezone: true
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true
    })
      .notNull()
      .defaultNow()
  },
  (table) => [
    index("billing_subscriptions_organization_id_idx").on(table.organizationId),
    index("billing_subscriptions_customer_id_idx").on(table.billingCustomerId),
    index("billing_subscriptions_org_status_idx").on(
      table.organizationId,
      table.status
    ),
    uniqueIndex("billing_subscriptions_provider_subscription_unique").on(
      table.provider,
      table.providerSubscriptionId
    )
  ]
);
