import Link from "next/link";
import type { UrlObject } from "url";

import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { ApiKeyList } from "@/src/features/api-keys/components/api-key-list";
import { CreateApiKeyForm } from "@/src/features/api-keys/components/create-api-key-form";
import { ProjectOnboardingPanel } from "@/src/features/api-keys/components/project-onboarding-panel";
import { AcceptInvitationForm } from "@/src/features/organizations/components/accept-invitation-form";
import { CreateOrganizationForm } from "@/src/features/organizations/components/create-organization-form";
import { CreateProjectForm } from "@/src/features/organizations/components/create-project-form";
import { InviteMemberForm } from "@/src/features/organizations/components/invite-member-form";
import { OrganizationSwitcher } from "@/src/features/organizations/components/organization-switcher";
import { ProjectList } from "@/src/features/organizations/components/project-list";
import { WorkspaceSummaryCard } from "@/src/features/organizations/components/workspace-summary-card";
import type { Organization, Project } from "@/src/features/organizations/domain/schemas";
import type { ManagedApiKey } from "@/src/features/api-keys/domain/schemas";

interface WorkspaceSettingsScreenProps {
  acceptInvitationAction: (formData: FormData) => Promise<void>;
  activeOrganizationId?: string;
  activeProjectId?: string;
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

export function WorkspaceSettingsScreen({
  acceptInvitationAction,
  activeOrganizationId,
  activeProjectId,
  apiKeys,
  createApiKeyAction,
  createOrganizationAction,
  createProjectAction,
  ingestCommand,
  invitationUrl,
  inviteMemberAction,
  newApiKey,
  organizations,
  projects,
  revokeApiKeyAction
}: WorkspaceSettingsScreenProps) {
  const activeProject = projects.find((project) => project.id === activeProjectId);
  const dashboardHref = toDashboardHref(activeOrganizationId, activeProjectId);

  return (
    <main className="mx-auto grid max-w-[1180px] gap-8 px-4 py-6 md:px-6 md:py-10">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_360px]">
        <div className="grid gap-4">
          <div className="grid gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
              Workspace settings
            </p>
            <h1 className="text-3xl leading-tight font-bold">
              Manage organizations, projects, and ingest keys from one place.
            </h1>
            <p className="max-w-2xl text-sm text-[var(--muted)]">
              Switch workspace context, invite teammates, and generate the first
              event path without leaving the page.
            </p>
          </div>
          <OrganizationSwitcher
            activeOrganizationId={activeOrganizationId}
            organizations={organizations}
          />
        </div>
        <WorkspaceSummaryCard
          activeOrganizationName={
            organizations.find((organization) => organization.id === activeOrganizationId)
              ?.name
          }
          activeProjectName={activeProject?.name}
          apiKeyCount={apiKeys.length}
          dashboardHref={dashboardHref}
          organizationCount={organizations.length}
          projectCount={projects.length}
        />
      </section>
      {invitationUrl ? (
        <Card className="grid gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
            Invitation link
          </p>
          <p className="text-sm text-[var(--muted)]">
            Share this link with teammates so they can accept the pending invitation.
          </p>
          <code className="block break-all rounded-lg border border-[var(--border)] bg-[var(--panel-subtle)] p-3 text-sm">
            {invitationUrl}
          </code>
        </Card>
      ) : null}
      <section className="grid gap-4 lg:grid-cols-2">
        <CreateOrganizationForm action={createOrganizationAction} />
        <AcceptInvitationForm action={acceptInvitationAction} />
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <CreateProjectForm
          action={createProjectAction}
          organizationId={activeOrganizationId}
        />
        <InviteMemberForm
          action={inviteMemberAction}
          organizationId={activeOrganizationId}
        />
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <ProjectList
          activeProjectId={activeProjectId}
          organizationId={activeOrganizationId}
          projects={projects}
        />
        <ProjectOnboardingPanel
          activeProjectName={activeProject?.name}
          createdApiKeyName={newApiKey?.name}
          createdRawKey={
            newApiKey && newApiKey.projectId === activeProjectId
              ? newApiKey.rawKey
              : undefined
          }
          ingestCommand={ingestCommand}
        />
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <CreateApiKeyForm
          action={createApiKeyAction}
          organizationId={activeOrganizationId}
          projectId={activeProjectId}
        />
        <ApiKeyList
          apiKeys={apiKeys}
          organizationId={activeOrganizationId}
          projectId={activeProjectId}
          revokeApiKeyAction={revokeApiKeyAction}
        />
      </section>
    </main>
  );
}

function toDashboardHref(
  organizationId?: string,
  projectId?: string
): UrlObject {
  if (!organizationId) {
    return {
      pathname: "/"
    };
  }

  return projectId
    ? {
        pathname: "/",
        query: {
          organizationId,
          projectId
        }
      }
    : {
        pathname: "/",
        query: {
          organizationId
        }
      };
}
