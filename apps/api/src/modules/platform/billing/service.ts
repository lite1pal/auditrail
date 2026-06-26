import {
  billingCheckoutIntentSchema,
  billingPortalIntentSchema,
  type BillingProvider
} from "@auditrail/domain/billing";

import { assertRole, type Membership } from "../service.js";
import type { PlatformBillingRepo } from "./repo.js";

const defaultBillingProvider: BillingProvider = "stripe";

export interface BillingStatusSummary {
  customer: {
    createdAt: string;
    id: string;
    provider: BillingProvider;
    providerCustomerId: string;
    updatedAt: string;
  } | null;
  organizationId: string;
  providerConfigurationStatus: "not_configured";
  subscription: {
    billingCustomerId: string;
    billingPlanId: string;
    cancelAtPeriodEnd: boolean;
    createdAt: string;
    currentPeriodEnd?: string;
    currentPeriodStart?: string;
    entitlementPlanId: string;
    id: string;
    provider: BillingProvider;
    providerPriceId: string;
    providerProductId?: string;
    providerSubscriptionId: string;
    status: string;
    updatedAt: string;
  } | null;
}

export interface PlatformBillingService {
  createCheckoutIntentForUser(input: {
    cancelUrl: string;
    organizationId: string;
    planId: string;
    priceId: string;
    successUrl: string;
    userId: string;
  }): Promise<never>;
  createPortalIntentForUser(input: {
    organizationId: string;
    returnUrl: string;
    userId: string;
  }): Promise<never>;
  getBillingStatusForUser(input: {
    organizationId: string;
    userId: string;
  }): Promise<BillingStatusSummary>;
}

export interface PlatformBillingServiceRepo
  extends Pick<
    PlatformBillingRepo,
    "findBillingCustomerByOrganization" | "findCurrentSubscriptionByOrganization"
  > {
  findMembership(input: {
    organizationId: string;
    userId: string;
  }): Promise<Membership | undefined>;
}

export class BillingProviderNotConfiguredError extends Error {
  constructor(provider: BillingProvider) {
    super(`billing_provider_not_configured:${provider}`);
    this.name = "BillingProviderNotConfiguredError";
  }
}

export function createPlatformBillingService(
  repo: PlatformBillingServiceRepo,
  options: {
    provider?: BillingProvider;
  } = {}
): PlatformBillingService {
  const provider = options.provider ?? defaultBillingProvider;

  return {
    async createCheckoutIntentForUser(input) {
      const membership = await repo.findMembership({
        organizationId: input.organizationId,
        userId: input.userId
      });

      assertRole(membership, ["owner", "admin"]);
      billingCheckoutIntentSchema.parse({
        cancelUrl: input.cancelUrl,
        planId: input.planId,
        priceId: input.priceId,
        provider,
        successUrl: input.successUrl
      });

      throw new BillingProviderNotConfiguredError(provider);
    },
    async createPortalIntentForUser(input) {
      const membership = await repo.findMembership({
        organizationId: input.organizationId,
        userId: input.userId
      });

      assertRole(membership, ["owner", "admin"]);
      billingPortalIntentSchema.parse({
        billingCustomerId: "placeholder-customer",
        provider,
        returnUrl: input.returnUrl
      });

      throw new BillingProviderNotConfiguredError(provider);
    },
    async getBillingStatusForUser(input) {
      const membership = await repo.findMembership({
        organizationId: input.organizationId,
        userId: input.userId
      });

      assertRole(membership, ["owner", "admin", "member", "viewer"]);
      const [customer, subscription] = await Promise.all([
        repo.findBillingCustomerByOrganization({
          organizationId: input.organizationId,
          provider
        }),
        repo.findCurrentSubscriptionByOrganization(input.organizationId)
      ]);

      return {
        customer: customer
          ? {
              createdAt: customer.createdAt,
              id: customer.id,
              provider: customer.provider,
              providerCustomerId: customer.providerCustomerId,
              updatedAt: customer.updatedAt
            }
          : null,
        organizationId: input.organizationId,
        providerConfigurationStatus: "not_configured",
        subscription: subscription
          ? {
              billingCustomerId: subscription.billingCustomerId,
              billingPlanId: subscription.billingPlanId,
              cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
              createdAt: subscription.createdAt,
              currentPeriodEnd: subscription.currentPeriodEnd,
              currentPeriodStart: subscription.currentPeriodStart,
              entitlementPlanId: subscription.entitlementPlanId,
              id: subscription.id,
              provider: subscription.provider,
              providerPriceId: subscription.providerPriceId,
              providerProductId: subscription.providerProductId,
              providerSubscriptionId: subscription.providerSubscriptionId,
              status: subscription.status,
              updatedAt: subscription.updatedAt
            }
          : null
      };
    }
  };
}
