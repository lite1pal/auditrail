import { summarizePricingUsage } from "@auditrail/domain/pricing";
import type {
  PricingPlanId,
  PricingUsageSummary
} from "@auditrail/domain/pricing";

import type { AuthUser } from "../auth/service.js";
import type { Membership, Organization, Project } from "./service.js";

export interface UserMembershipContext {
  membership: Membership;
  organization: Organization;
  plan: PricingUsageSummary;
  projects: Project[];
}

export interface UserMembershipContextRecord {
  membership: Membership;
  organization: Organization;
  planId: PricingPlanId;
  projects: Project[];
  usedEvents: number;
}

export interface CurrentUserContext {
  memberships: UserMembershipContext[];
  user: AuthUser;
}

export interface UserContextRepo {
  listUserMembershipContexts(userId: string): Promise<UserMembershipContextRecord[]>;
}

export interface CurrentUserContextService {
  getCurrentUserContext(user: AuthUser): Promise<CurrentUserContext>;
}

export function createCurrentUserContextService(
  repo: UserContextRepo,
  options: {
    now?: () => Date;
  } = {}
): CurrentUserContextService {
  const now = options.now ?? (() => new Date());

  return {
    async getCurrentUserContext(user) {
      const currentDate = now();
      const memberships = await repo.listUserMembershipContexts(user.id);

      return {
        memberships: memberships.map((membership) => ({
          membership: membership.membership,
          organization: membership.organization,
          plan: summarizePricingUsage({
            now: currentDate,
            planId: membership.planId,
            usedEvents: membership.usedEvents
          }),
          projects: membership.projects
        })),
        user
      };
    }
  };
}
