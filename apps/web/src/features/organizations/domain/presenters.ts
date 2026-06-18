import type { CurrentUserResponse } from "@/src/features/auth/domain/schemas";
import type { Organization, Project } from "@/src/features/organizations/domain/schemas";

export function toOrganizationOption(organization: Organization) {
  return {
    label: organization.name,
    value: organization.id
  };
}

export function toProjectOption(project: Project) {
  return {
    label: project.name,
    value: project.id
  };
}

export function toWorkspaceViewModel(
  currentUser: CurrentUserResponse,
  selection: {
    organizationId?: string;
    projectId?: string;
  } = {}
) {
  const activeMembership =
    currentUser.memberships.find(
      (membership) => membership.organization.id === selection.organizationId
    ) ?? currentUser.memberships[0];
  const activeProject =
    activeMembership?.projects.find(
      (project) => project.id === selection.projectId
    ) ?? activeMembership?.projects[0];

  return {
    activeOrganization: activeMembership?.organization,
    activeProject,
    memberships: currentUser.memberships.map((membership) => ({
      organization: membership.organization,
      projects: membership.projects,
      role: membership.role
    }))
  };
}
