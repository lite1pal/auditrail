import type { AuthUser } from "../auth/service.js";
import type { Membership, Organization, Project } from "./service.js";

export interface UserMembershipContext {
  membership: Membership;
  organization: Organization;
  projects: Project[];
}

export interface CurrentUserContext {
  memberships: UserMembershipContext[];
  user: AuthUser;
}

export interface UserContextRepo {
  listUserMembershipContexts(userId: string): Promise<UserMembershipContext[]>;
}

export interface CurrentUserContextService {
  getCurrentUserContext(user: AuthUser): Promise<CurrentUserContext>;
}

export function createCurrentUserContextService(
  repo: UserContextRepo
): CurrentUserContextService {
  return {
    async getCurrentUserContext(user) {
      return {
        memberships: await repo.listUserMembershipContexts(user.id),
        user
      };
    }
  };
}
