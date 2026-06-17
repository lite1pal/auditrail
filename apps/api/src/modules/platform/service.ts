import { z } from "zod";

import { createOpaqueToken, hashToken, verifyTokenHash } from "../auth/tokens.js";

const nameSchema = z.string().trim().min(1).max(120);
const emailSchema = z.string().trim().email().transform((value) => value.toLowerCase());
const roleSchema = z.enum(["owner", "admin", "member", "viewer"]);

export type OrganizationRole = z.infer<typeof roleSchema>;

export interface Organization {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
}

export interface Membership {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole;
}

export interface Invitation {
  id: string;
  email: string;
  organizationId: string;
  role: OrganizationRole;
  expiresAt: string;
  acceptedAt?: string;
  revokedAt?: string;
}

export interface PlatformRepo {
  createOrganization(input: { name: string }): Promise<Organization>;
  createProject(input: { organizationId: string; name: string }): Promise<Project>;
  createMembership(input: {
    organizationId: string;
    role: OrganizationRole;
    userId: string;
  }): Promise<Membership>;
  createInvitation(input: {
    email: string;
    expiresAt: string;
    organizationId: string;
    role: OrganizationRole;
    tokenHash: string;
  }): Promise<Invitation>;
  acceptInvitation(input: {
    acceptedAt: string;
    invitationId: string;
  }): Promise<void>;
  findInvitationByTokenHash(tokenHash: string): Promise<Invitation | undefined>;
  findMembership(input: {
    organizationId: string;
    userId: string;
  }): Promise<Membership | undefined>;
  listOrganizationsForUser(userId: string): Promise<Organization[]>;
  listProjects(organizationId: string): Promise<Project[]>;
  revokeInvitation(input: {
    invitationId: string;
    revokedAt: string;
  }): Promise<void>;
}

export interface PlatformService {
  createOrganization(input: {
    name: string;
    ownerUserId: string;
  }): Promise<{ membership: Membership; organization: Organization }>;
  createProject(input: { name: string; organizationId: string }): Promise<Project>;
  createProjectForUser(input: {
    name: string;
    organizationId: string;
    userId: string;
  }): Promise<Project>;
  inviteMember(input: {
    email: string;
    organizationId: string;
    role: OrganizationRole;
    tokenSecret: string;
    ttlMs: number;
    userId: string;
  }): Promise<{ invitation: Invitation; token: string }>;
  acceptInvitation(input: {
    now?: Date;
    token: string;
    tokenSecret: string;
    userId: string;
  }): Promise<Membership>;
  listOrganizationsForUser(userId: string): Promise<Organization[]>;
  listProjectsForUser(input: {
    organizationId: string;
    userId: string;
  }): Promise<Project[]>;
  revokeInvitation(input: {
    invitationId: string;
    organizationId: string;
    userId: string;
  }): Promise<void>;
}

export function createPlatformService(repo: PlatformRepo): PlatformService {
  return {
    async createOrganization(input) {
      const organization = await repo.createOrganization({
        name: nameSchema.parse(input.name)
      });
      const membership = await repo.createMembership({
        organizationId: organization.id,
        role: "owner",
        userId: input.ownerUserId
      });

      return { membership, organization };
    },
    createProject(input) {
      return repo.createProject({
        name: nameSchema.parse(input.name),
        organizationId: input.organizationId
      });
    },
    async createProjectForUser(input) {
      const membership = await repo.findMembership({
        organizationId: input.organizationId,
        userId: input.userId
      });

      assertRole(membership, ["owner", "admin"]);

      return repo.createProject({
        name: nameSchema.parse(input.name),
        organizationId: input.organizationId
      });
    },
    async inviteMember(input) {
      const membership = await repo.findMembership({
        organizationId: input.organizationId,
        userId: input.userId
      });

      assertRole(membership, ["owner", "admin"]);

      const token = createOpaqueToken();
      const invitation = await repo.createInvitation({
        email: emailSchema.parse(input.email),
        expiresAt: new Date(Date.now() + input.ttlMs).toISOString(),
        organizationId: input.organizationId,
        role: roleSchema.parse(input.role),
        tokenHash: hashToken(token, { secret: input.tokenSecret })
      });

      return { invitation, token };
    },
    async acceptInvitation(input) {
      const tokenHash = hashToken(input.token, { secret: input.tokenSecret });
      const invitation = await repo.findInvitationByTokenHash(tokenHash);
      const now = input.now ?? new Date();

      if (
        !invitation ||
        invitation.acceptedAt ||
        invitation.revokedAt ||
        invitation.expiresAt < now.toISOString() ||
        !verifyTokenHash(input.token, tokenHash, { secret: input.tokenSecret })
      ) {
        throw new Error("invalid_invitation");
      }

      const membership = await repo.createMembership({
        organizationId: invitation.organizationId,
        role: invitation.role,
        userId: input.userId
      });
      await repo.acceptInvitation({
        acceptedAt: now.toISOString(),
        invitationId: invitation.id
      });

      return membership;
    },
    listOrganizationsForUser(userId) {
      return repo.listOrganizationsForUser(userId);
    },
    async listProjectsForUser(input) {
      const membership = await repo.findMembership({
        organizationId: input.organizationId,
        userId: input.userId
      });

      assertRole(membership, ["owner", "admin", "member", "viewer"]);

      return repo.listProjects(input.organizationId);
    },
    async revokeInvitation(input) {
      const membership = await repo.findMembership({
        organizationId: input.organizationId,
        userId: input.userId
      });

      assertRole(membership, ["owner", "admin"]);

      await repo.revokeInvitation({
        invitationId: input.invitationId,
        revokedAt: new Date().toISOString()
      });
    }
  };
}

export function assertRole(
  membership: Membership | undefined,
  allowedRoles: OrganizationRole[]
) {
  if (!membership) {
    throw new Error("forbidden");
  }

  if (!allowedRoles.includes(membership.role)) {
    throw new Error("forbidden");
  }
}
