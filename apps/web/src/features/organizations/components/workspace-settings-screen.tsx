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
  const sectionLinks = [
    {
      description: "Switch organizations and create the workspace shell.",
      href: "#workspace-settings",
      label: "Workspace"
    },
    {
      description: "Handle invitations and teammate access.",
      href: "#access-settings",
      label: "Access"
    },
    {
      description: "Select or create projects for the current organization.",
      href: "#project-settings",
      label: "Projects"
    },
    {
      description: "Generate and revoke project ingest keys.",
      href: "#api-key-settings",
      label: "API keys"
    }
  ];

  return (
    <main className="mx-auto grid max-w-[1180px] gap-8 px-4 py-6 md:px-6 md:py-10 xl:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="self-start xl:sticky xl:top-6">
        <Card className="grid gap-4">
          <div className="grid gap-1">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
              Settings map
            </p>
            <h2 className="text-lg font-bold">Jump to the workspace area you need.</h2>
            <p className="text-sm text-[var(--muted)]">
              Keep organization setup, access management, projects, and keys separated.
            </p>
          </div>
          <nav aria-label="Settings sections">
            <ul className="grid gap-2">
              {sectionLinks.map((section) => (
                <li key={section.href}>
                  <a
                    className="grid gap-1 rounded-lg border border-[var(--border)] bg-[var(--panel-subtle)] px-3 py-3 transition-colors hover:bg-[var(--panel)]"
                    href={section.href}
                  >
                    <span className="text-sm font-bold text-[var(--foreground)]">
                      {section.label}
                    </span>
                    <span className="text-xs text-[var(--muted)]">{section.description}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </Card>
      </aside>
      <div className="grid gap-8">
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
        <SettingsGroup
          description="Choose the organization context and create the base workspace before adding projects or keys."
          id="workspace-settings"
          title="Workspace"
        >
          <section className="grid gap-4 lg:grid-cols-2">
            <CreateOrganizationForm action={createOrganizationAction} />
            <AcceptInvitationForm action={acceptInvitationAction} />
          </section>
        </SettingsGroup>

        <SettingsGroup
          description="Invite teammates and share the current pending invitation without mixing it into project setup."
          id="access-settings"
          title="Access"
        >
          <section className="grid gap-4 lg:grid-cols-2">
            <InviteMemberForm
              action={inviteMemberAction}
              organizationId={activeOrganizationId}
            />
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
            ) : (
              <Card className="grid gap-2">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Invitation link
                </p>
                <p className="text-sm text-[var(--muted)]">
                  Create an invitation to generate a shareable join link for this organization.
                </p>
              </Card>
            )}
          </section>
        </SettingsGroup>

        <SettingsGroup
          description="Create the project structure and pick the active project before generating ingest credentials."
          id="project-settings"
          title="Projects"
        >
          <section className="grid gap-4 lg:grid-cols-2">
            <CreateProjectForm
              action={createProjectAction}
              organizationId={activeOrganizationId}
            />
            <ProjectList
              activeProjectId={activeProjectId}
              organizationId={activeOrganizationId}
              projects={projects}
            />
          </section>
        </SettingsGroup>

        <SettingsGroup
          description="Generate project API keys, review existing keys, and copy the first ingest command."
          id="api-key-settings"
          title="API keys"
        >
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
        </SettingsGroup>
      </div>
    </main>
  );
}

interface SettingsGroupProps {
  children: React.ReactNode;
  description: string;
  id: string;
  title: string;
}

function SettingsGroup({ children, description, id, title }: SettingsGroupProps) {
  return (
    <section aria-labelledby={`${id}-title`} className="grid gap-4 scroll-mt-6" id={id}>
      <div className="grid gap-1">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
          {title}
        </p>
        <h2 className="text-2xl font-bold" id={`${id}-title`}>
          {title}
        </h2>
        <p className="max-w-2xl text-sm text-[var(--muted)]">{description}</p>
      </div>
      {children}
    </section>
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
