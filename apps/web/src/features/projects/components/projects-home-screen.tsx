import { EmptyState } from "@/src/components/ui/empty-state";
import { PageShell } from "@/src/components/ui/page-shell";

interface ProjectsHomeScreenProps {
  organizationName?: string;
  projects: readonly {
    id: string;
    name: string;
  }[];
}

export function ProjectsHomeScreen({
  organizationName,
  projects
}: ProjectsHomeScreenProps) {
  return (
    <PageShell>
      <div className="grid gap-6">
        <header className="grid gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Projects
          </p>
          <h1 className="text-3xl font-semibold text-[var(--foreground)]">
            {organizationName ? `${organizationName} projects` : "Projects workspace"}
          </h1>
          <p className="max-w-2xl text-sm text-[var(--muted)]">
            This minimal product surface proves Elioric can mount a second product
            module with its own shell navigation, runtime registration, and page
            contract before the fuller PM slice lands.
          </p>
        </header>
        {projects.length === 0 ? (
          <EmptyState
            label="No projects are available for this workspace yet."
          />
        ) : (
          <div className="grid gap-3">
            {projects.map((project) => (
              <article
                key={project.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-4"
              >
                <h2 className="text-base font-semibold text-[var(--foreground)]">
                  {project.name}
                </h2>
                <p className="mt-1 text-xs text-[var(--muted)]">{project.id}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
