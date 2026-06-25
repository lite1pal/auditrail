import type { CurrentUserResponse } from "@/src/features/auth/domain/schemas";
import type { ManagedApiKey } from "@/src/features/api-keys/domain/schemas";
import type { Organization, Project } from "@/src/features/organizations/domain/schemas";

export interface WorkspaceSettingsScreenProps {
  acceptInvitationAction: (formData: FormData) => Promise<void>;
  activeOrganizationId?: string;
  activeOrganizationPlan?: CurrentUserResponse["memberships"][number]["plan"];
  activeOrganizationRole?: "owner" | "admin" | "member" | "viewer";
  activeProjectId?: string;
  changeOrganizationPlanAction: (formData: FormData) => Promise<void>;
  apiKeys: ManagedApiKey[];
  createApiKeyAction: (formData: FormData) => Promise<void>;
  createOrganizationAction: (formData: FormData) => Promise<void>;
  createProjectAction: (formData: FormData) => Promise<void>;
  ingestCommand?: string;
  invitationUrl?: string;
  inviteMemberAction: (formData: FormData) => Promise<void>;
  newApiKey?: {
    name: string;
    projectId: string;
    rawKey: string;
  };
  organizations: Organization[];
  projects: Project[];
  revokeApiKeyAction: (formData: FormData) => Promise<void>;
}
