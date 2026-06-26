import { billingCustomers, billingSubscriptions } from "@auditrail/db/schema";
import {
  billingProviderSchema,
  billingStatusSchema
} from "@auditrail/domain/billing";
import { and, desc, eq, inArray, sql } from "drizzle-orm";

import type { AppDatabase } from "../../../plugins/database.js";
import type {
  BillingCustomerRecord,
  BillingSubscriptionRecord,
  PlatformBillingRepo,
  UpdateBillingSubscriptionStateInput
} from "./repo.js";

const currentSubscriptionStatuses = [
  "trialing",
  "active",
  "past_due",
  "incomplete",
  "unpaid"
] as const;

type BillingCustomerRow = typeof billingCustomers.$inferSelect;
type BillingSubscriptionRow = typeof billingSubscriptions.$inferSelect;

export function createPostgresPlatformBillingRepo(
  db: AppDatabase,
  options: {
    now?: () => Date;
  } = {}
): PlatformBillingRepo {
  const now = options.now ?? (() => new Date());

  return {
    async findBillingCustomerByOrganization(input) {
      const [record] = await db
        .select()
        .from(billingCustomers)
        .where(
          and(
            eq(billingCustomers.organizationId, input.organizationId),
            eq(billingCustomers.provider, input.provider)
          )
        )
        .limit(1);

      return record ? toBillingCustomerRecord(record) : undefined;
    },
    async findBillingCustomerByProviderCustomerId(input) {
      const [record] = await db
        .select()
        .from(billingCustomers)
        .where(
          and(
            eq(billingCustomers.provider, input.provider),
            eq(billingCustomers.providerCustomerId, input.providerCustomerId)
          )
        )
        .limit(1);

      return record ? toBillingCustomerRecord(record) : undefined;
    },
    async upsertBillingCustomer(input) {
      const currentTime = now();
      const [record] = await db
        .insert(billingCustomers)
        .values({
          organizationId: input.organizationId,
          provider: input.provider,
          providerCustomerId: input.providerCustomerId,
          updatedAt: currentTime
        })
        .onConflictDoUpdate({
          set: {
            providerCustomerId: input.providerCustomerId,
            updatedAt: currentTime
          },
          target: [
            billingCustomers.organizationId,
            billingCustomers.provider
          ]
        })
        .returning();

      return toBillingCustomerRecord(record);
    },
    async findSubscriptionByProviderSubscriptionId(input) {
      const [record] = await db
        .select()
        .from(billingSubscriptions)
        .where(
          and(
            eq(billingSubscriptions.provider, input.provider),
            eq(
              billingSubscriptions.providerSubscriptionId,
              input.providerSubscriptionId
            )
          )
        )
        .limit(1);

      return record ? toBillingSubscriptionRecord(record) : undefined;
    },
    async findCurrentSubscriptionByOrganization(organizationId) {
      const [record] = await db
        .select()
        .from(billingSubscriptions)
        .where(
          and(
            eq(billingSubscriptions.organizationId, organizationId),
            inArray(billingSubscriptions.status, [...currentSubscriptionStatuses])
          )
        )
        .orderBy(
          sql`coalesce(${billingSubscriptions.currentPeriodEnd}, ${billingSubscriptions.updatedAt}) desc`,
          desc(billingSubscriptions.updatedAt),
          desc(billingSubscriptions.id)
        )
        .limit(1);

      return record ? toBillingSubscriptionRecord(record) : undefined;
    },
    async upsertSubscription(input) {
      const currentTime = now();
      const [record] = await db
        .insert(billingSubscriptions)
        .values({
          billingCustomerId: input.billingCustomerId,
          billingPlanId: input.billingPlanId,
          cancelAtPeriodEnd: input.cancelAtPeriodEnd ?? false,
          currentPeriodEnd: input.currentPeriodEnd
            ? new Date(input.currentPeriodEnd)
            : null,
          currentPeriodStart: input.currentPeriodStart
            ? new Date(input.currentPeriodStart)
            : null,
          entitlementPlanId: input.entitlementPlanId,
          organizationId: input.organizationId,
          provider: input.provider,
          providerPriceId: input.providerPriceId,
          providerProductId: input.providerProductId ?? null,
          providerSubscriptionId: input.providerSubscriptionId,
          status: input.status,
          updatedAt: currentTime
        })
        .onConflictDoUpdate({
          set: {
            billingCustomerId: input.billingCustomerId,
            billingPlanId: input.billingPlanId,
            cancelAtPeriodEnd: input.cancelAtPeriodEnd ?? false,
            currentPeriodEnd: input.currentPeriodEnd
              ? new Date(input.currentPeriodEnd)
              : null,
            currentPeriodStart: input.currentPeriodStart
              ? new Date(input.currentPeriodStart)
              : null,
            entitlementPlanId: input.entitlementPlanId,
            organizationId: input.organizationId,
            providerPriceId: input.providerPriceId,
            providerProductId: input.providerProductId ?? null,
            status: input.status,
            updatedAt: currentTime
          },
          target: [
            billingSubscriptions.provider,
            billingSubscriptions.providerSubscriptionId
          ]
        })
        .returning();

      return toBillingSubscriptionRecord(record);
    },
    async updateSubscriptionState(input: UpdateBillingSubscriptionStateInput) {
      const currentTime = now();
      const [record] = await db
        .update(billingSubscriptions)
        .set({
          cancelAtPeriodEnd: input.cancelAtPeriodEnd,
          currentPeriodEnd: input.currentPeriodEnd
            ? new Date(input.currentPeriodEnd)
            : null,
          currentPeriodStart: input.currentPeriodStart
            ? new Date(input.currentPeriodStart)
            : null,
          status: input.status,
          updatedAt: currentTime
        })
        .where(
          and(
            eq(billingSubscriptions.provider, input.provider),
            eq(
              billingSubscriptions.providerSubscriptionId,
              input.providerSubscriptionId
            )
          )
        )
        .returning();

      return record ? toBillingSubscriptionRecord(record) : undefined;
    }
  };
}

function toBillingCustomerRecord(
  record: BillingCustomerRow
): BillingCustomerRecord {
  return {
    createdAt: toIsoString(record.createdAt),
    id: record.id,
    organizationId: record.organizationId,
    provider: billingProviderSchema.parse(record.provider),
    providerCustomerId: record.providerCustomerId,
    updatedAt: toIsoString(record.updatedAt)
  };
}

function toBillingSubscriptionRecord(
  record: BillingSubscriptionRow
): BillingSubscriptionRecord {
  return {
    billingCustomerId: record.billingCustomerId,
    billingPlanId: record.billingPlanId,
    cancelAtPeriodEnd: record.cancelAtPeriodEnd,
    createdAt: toIsoString(record.createdAt),
    currentPeriodEnd: record.currentPeriodEnd
      ? toIsoString(record.currentPeriodEnd)
      : undefined,
    currentPeriodStart: record.currentPeriodStart
      ? toIsoString(record.currentPeriodStart)
      : undefined,
    entitlementPlanId: record.entitlementPlanId,
    id: record.id,
    organizationId: record.organizationId,
    provider: billingProviderSchema.parse(record.provider),
    providerPriceId: record.providerPriceId,
    providerProductId: record.providerProductId ?? undefined,
    providerSubscriptionId: record.providerSubscriptionId,
    status: billingStatusSchema.parse(record.status),
    updatedAt: toIsoString(record.updatedAt)
  };
}

function toIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
