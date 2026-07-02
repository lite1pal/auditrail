import { AppShell } from "@/src/components/layout/app-shell";
import { requireCurrentUser } from "@/src/features/auth/server/auth-server";
import { TodoForm } from "@/src/features/todo/components/todo-form";
import { TodoScreen } from "@/src/features/todo/components/todo-screen";

import { getShellProductConfig } from "@/app/product-module";
import {
  createTodoWorkspaceAction,
  loadTodoWorkspacePage
} from "@/src/features/todo-product/server/todo-workspace";

interface ResourcePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ResourcePage({ searchParams }: ResourcePageProps) {
  const currentUser = await requireCurrentUser();
  const resolvedSearchParams = await searchParams;
  const data = await loadTodoWorkspacePage(resolvedSearchParams, {
    currentUser
  });
  const shellProduct = getShellProductConfig({
    activeOrganizationId: data.workspace.activeOrganizationId,
    activeProjectId: data.workspace.activeProjectId,
    installedProducts: data.workspace.activeOrganizationInstalledProducts,
    preferredProductId: "todo"
  });
  const activeHref = "/todo/todos" + buildWorkspaceSuffix(
    data.workspace.activeOrganizationId ?? "",
    data.workspace.activeProjectId ?? undefined,
    "exclude"
  );
  const archivedHref = "/todo/todos" + buildWorkspaceSuffix(
    data.workspace.activeOrganizationId ?? "",
    data.workspace.activeProjectId ?? undefined,
    "only"
  );
  const allHref = "/todo/todos" + buildWorkspaceSuffix(
    data.workspace.activeOrganizationId ?? "",
    data.workspace.activeProjectId ?? undefined,
    "include"
  );

  return (
    <AppShell
      activeOrganizationId={data.workspace.activeOrganizationId}
      activeProjectId={data.workspace.activeProjectId}
      availableProducts={shellProduct.availableProducts}
      currentUser={currentUser}
      productName={shellProduct.productName}
      productNavItems={shellProduct.navItems}
    >
      <div className="grid gap-6">
        <header className="grid gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Todos</p>
          <h1 className="text-3xl font-semibold text-[var(--foreground)]">Todos</h1>
          <p className="max-w-2xl text-sm text-[var(--muted)]">This generated product route loads real todos through the API seam and allows inline creation.</p>
        </header>
        <TodoForm action={createTodoWorkspaceAction} defaultValues={data.draftValues} submitLabel="Create Todo">
          <input name="organizationId" type="hidden" value={data.workspace.activeOrganizationId ?? ""} />
          <input name="projectId" type="hidden" value={data.workspace.activeProjectId ?? ""} />
          <input name="archived" type="hidden" value={data.archivedFilter} />
          {data.feedback ? (
            <p className="rounded-md border border-[var(--border)] bg-[var(--panel-muted)] px-3 py-2 text-sm text-[var(--foreground)]">{data.feedback}</p>
          ) : null}
        </TodoForm>
        <div className="flex flex-wrap gap-2 text-sm">
          <a className="rounded-md border border-[var(--border)] px-3 py-2" href={activeHref}>Active</a>
          <a className="rounded-md border border-[var(--border)] px-3 py-2" href={archivedHref}>Archived</a>
          <a className="rounded-md border border-[var(--border)] px-3 py-2" href={allHref}>All</a>
          <span className="self-center text-[var(--muted)]">Viewing: {data.archivedFilter}</span>
        </div>
        <TodoScreen
          items={data.items}
          organizationId={data.workspace.activeOrganizationId ?? undefined}
          projectId={data.workspace.activeProjectId ?? undefined}
          relationPresentations={data.relationPresentations}
          resourceBasePath="/todo/todos"
        />
      </div>
    </AppShell>
  );
}

function buildWorkspaceSuffix(
  organizationId: string,
  projectId?: string,
  archived?: "exclude" | "include" | "only"
) {
  const query = new URLSearchParams({ organizationId });

  if (projectId) {
    query.set("projectId", projectId);
  }

  if (archived) {
    query.set("archived", archived);
  }

  return `?${query.toString()}`;
}
