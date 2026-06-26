import type { BillingProvider, BillingStatus } from "@auditrail/domain/billing";

export interface BillingCustomerRecord<
  TProvider extends BillingProvider = BillingProvider
> {
  createdAt: string;
  id: string;
  organizationId: string;
  provider: TProvider;
  providerCustomerId: string;
  updatedAt: string;
}

export interface BillingSubscriptionRecord<
  TProvider extends BillingProvider = BillingProvider,
  TStatus extends BillingStatus = BillingStatus
> {
  billingCustomerId: string;
  billingPlanId: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  currentPeriodEnd?: string;
  currentPeriodStart?: string;
  entitlementPlanId: string;
  id: string;
  organizationId: string;
  provider: TProvider;
  providerPriceId: string;
  providerProductId?: string;
  providerSubscriptionId: string;
  status: TStatus;
  updatedAt: string;
}

export interface UpsertBillingCustomerInput<
  TProvider extends BillingProvider = BillingProvider
> {
  organizationId: string;
  provider: TProvider;
  providerCustomerId: string;
}

export interface FindBillingCustomerByOrganizationInput<
  TProvider extends BillingProvider = BillingProvider
> {
  organizationId: string;
  provider: TProvider;
}

export interface FindBillingCustomerByProviderCustomerIdInput<
  TProvider extends BillingProvider = BillingProvider
> {
  provider: TProvider;
  providerCustomerId: string;
}

export interface UpsertBillingSubscriptionInput<
  TProvider extends BillingProvider = BillingProvider,
  TStatus extends BillingStatus = BillingStatus
> {
  billingCustomerId: string;
  billingPlanId: string;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: string;
  currentPeriodStart?: string;
  entitlementPlanId: string;
  organizationId: string;
  provider: TProvider;
  providerPriceId: string;
  providerProductId?: string;
  providerSubscriptionId: string;
  status: TStatus;
}

export interface FindBillingSubscriptionByProviderSubscriptionIdInput<
  TProvider extends BillingProvider = BillingProvider
> {
  provider: TProvider;
  providerSubscriptionId: string;
}

export interface UpdateBillingSubscriptionStateInput<
  TProvider extends BillingProvider = BillingProvider,
  TStatus extends BillingStatus = BillingStatus
> {
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd?: string;
  currentPeriodStart?: string;
  provider: TProvider;
  providerSubscriptionId: string;
  status: TStatus;
}

export interface PlatformBillingRepo {
  findBillingCustomerByOrganization(
    input: FindBillingCustomerByOrganizationInput
  ): Promise<BillingCustomerRecord | undefined>;
  findBillingCustomerByProviderCustomerId(
    input: FindBillingCustomerByProviderCustomerIdInput
  ): Promise<BillingCustomerRecord | undefined>;
  findCurrentSubscriptionByOrganization(
    organizationId: string
  ): Promise<BillingSubscriptionRecord | undefined>;
  findSubscriptionByProviderSubscriptionId(
    input: FindBillingSubscriptionByProviderSubscriptionIdInput
  ): Promise<BillingSubscriptionRecord | undefined>;
  updateSubscriptionState(
    input: UpdateBillingSubscriptionStateInput
  ): Promise<BillingSubscriptionRecord | undefined>;
  upsertBillingCustomer(
    input: UpsertBillingCustomerInput
  ): Promise<BillingCustomerRecord>;
  upsertSubscription(
    input: UpsertBillingSubscriptionInput
  ): Promise<BillingSubscriptionRecord>;
}
