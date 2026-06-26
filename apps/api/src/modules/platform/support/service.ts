import type { BillingCustomerRecord, BillingSubscriptionRecord, PlatformBillingRepo } from "../billing/repo.js";
import type { PlatformEntitlementService, PlatformEntitlementSummary } from "../entitlements/service.js";
import type { PlatformSupportRepo } from "./repo.js";

export interface SupportOrganizationListItem {
  createdAt: string;
  id: string;
  memberCount: number;
  name: string;
  ownerEmails: string[];
}

export interface SafeBillingCustomerSummary {
  createdAt: string;
  id: string;
  provider: BillingCustomerRecord["provider"];
  updatedAt: string;
}

export interface SafeBillingSubscriptionSummary {
  billingPlanId: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  currentPeriodEnd?: string;
  currentPeriodStart?: string;
  entitlementPlanId: string;
  id: string;
  provider: BillingSubscriptionRecord["provider"];
  status: BillingSubscriptionRecord["status"];
  updatedAt: string;
}

export interface SupportOrganizationDetail extends SupportOrganizationListItem {
  adminEmails: string[];
  billing: {
    customer: SafeBillingCustomerSummary | null;
    subscription: SafeBillingSubscriptionSummary | null;
  };
  entitlement: PlatformEntitlementSummary;
}

export interface PlatformSupportService {
  getOrganizationDetail(
    organizationId: string
  ): Promise<SupportOrganizationDetail>;
  searchOrganizations(input: {
    limit?: number;
    query: string;
  }): Promise<SupportOrganizationListItem[]>;
}

export interface PlatformSupportServiceDependencies {
  billingRepo: Pick<
    PlatformBillingRepo,
    "findBillingCustomerByOrganization" | "findCurrentSubscriptionByOrganization"
  >;
  entitlementService: Pick<
    PlatformEntitlementService,
    "getEntitlementSummary"
  >;
}

export function createPlatformSupportService(
  repo: PlatformSupportRepo,
  dependencies: PlatformSupportServiceDependencies
): PlatformSupportService {
  return {
    async getOrganizationDetail(organizationId) {
      const organization = await repo.findOrganizationById(organizationId);

      if (!organization) {
        throw new Error("organization_not_found");
      }

      const members = await repo.listOrganizationMembers(organizationId);
      const [billingCustomer, subscription, entitlement] = await Promise.all([
        dependencies.billingRepo.findBillingCustomerByOrganization({
          organizationId,
          provider: "stripe"
        }),
        dependencies.billingRepo.findCurrentSubscriptionByOrganization(
          organizationId
        ),
        dependencies.entitlementService.getEntitlementSummary(organizationId)
      ]);

      return {
        adminEmails: members
          .filter((member) => member.role === "admin")
          .map((member) => member.email),
        billing: {
          customer: billingCustomer
            ? {
                createdAt: billingCustomer.createdAt,
                id: billingCustomer.id,
                provider: billingCustomer.provider,
                updatedAt: billingCustomer.updatedAt
              }
            : null,
          subscription: subscription
            ? {
                billingPlanId: subscription.billingPlanId,
                cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
                createdAt: subscription.createdAt,
                currentPeriodEnd: subscription.currentPeriodEnd,
                currentPeriodStart: subscription.currentPeriodStart,
                entitlementPlanId: subscription.entitlementPlanId,
                id: subscription.id,
                provider: subscription.provider,
                status: subscription.status,
                updatedAt: subscription.updatedAt
              }
            : null
        },
        createdAt: organization.createdAt,
        entitlement,
        id: organization.id,
        memberCount: members.length,
        name: organization.name,
        ownerEmails: members
          .filter((member) => member.role === "owner")
          .map((member) => member.email)
      };
    },
    async searchOrganizations(input) {
      const query = input.query.trim();

      if (query.length < 3) {
        throw new Error("invalid_support_query");
      }

      const limit = Math.min(Math.max(input.limit ?? 10, 1), 20);
      const organizations = await repo.searchOrganizations({
        limit,
        query
      });

      return Promise.all(
        organizations.map(async (organization) => {
          const members = await repo.listOrganizationMembers(organization.id);

          return {
            createdAt: organization.createdAt,
            id: organization.id,
            memberCount: members.length,
            name: organization.name,
            ownerEmails: members
              .filter((member) => member.role === "owner")
              .map((member) => member.email)
          };
        })
      );
    }
  };
}
