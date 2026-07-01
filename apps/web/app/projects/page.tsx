import { AppShell } from "@/src/components/layout/app-shell";
import { requireCurrentUser } from "@/src/features/auth/server/auth-server";
import { resolveWorkspaceContext } from "@/src/features/organizations/domain/workspace";
import { ProjectsHomeScreen } from "@/src/features/projects";

import { getProductMetadata, getShellProductConfig } from "@/app/product-module";

export const metadata = getProductMetadata("projects");

interface ProjectsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const currentUser = await requireCurrentUser();
  const resolvedSearchParams = await searchParams;
  const workspace = resolveWorkspaceContext(
    currentUser,
    {
      organizationId: getSearchValue(resolvedSearchParams.organizationId),
      projectId: getSearchValue(resolvedSearchParams.projectId)
    },
    {
      requiredProductId: "projects"
    }
  );
  const shellProduct = getShellProductConfig({
    activeOrganizationId: workspace.activeOrganizationId,
    activeProjectId: workspace.activeProjectId,
    installedProducts: workspace.activeOrganizationInstalledProducts,
    preferredProductId: "projects"
  });

  return (
    <AppShell
      activeOrganizationId={workspace.activeOrganizationId}
      activeProjectId={workspace.activeProjectId}
      availableProducts={shellProduct.availableProducts}
      currentUser={currentUser}
      productName={shellProduct.productName}
      productNavItems={shellProduct.navItems}
    >
      <ProjectsHomeScreen
        organizationName={workspace.activeOrganization?.name}
        projects={workspace.projects}
      />
    </AppShell>
  );
}

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
