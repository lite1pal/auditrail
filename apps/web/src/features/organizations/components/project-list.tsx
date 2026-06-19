import Link from "next/link";

import { Card } from "@/src/components/ui/card";
import type { Project } from "@/src/features/organizations/domain/schemas";

interface ProjectListProps {
  activeProjectId?: string;
  organizationId?: string;
  projects: Project[];
}

export function ProjectList({
  activeProjectId,
  organizationId,
  projects
}: ProjectListProps) {
  return (
    <Card className="grid gap-4">
      <div>
        <h2 className="text-lg font-bold">Projects</h2>
        <p className="text-sm text-[var(--muted)]">
          Projects available in the selected organization.
        </p>
      </div>
      {projects.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          No projects yet. Create one to generate keys and start collecting events.
        </p>
      ) : (
        <ul className="grid gap-2">
          {projects.map((project) => (
            <li
              className="rounded-lg border border-[var(--border)] bg-[var(--panel-subtle)] px-3 py-2 text-sm"
              key={project.id}
            >
              <Link
                aria-current={project.id === activeProjectId ? "page" : undefined}
                className="grid gap-1"
                href={
                  organizationId
                    ? `/settings?organizationId=${organizationId}&projectId=${project.id}`
                    : "/settings"
                }
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong>{project.name}</strong>
                  {project.id === activeProjectId ? (
                    <span className="rounded-full bg-[var(--foreground)] px-2 py-0.5 text-[11px] font-bold text-[var(--panel)]">
                      Selected
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-[var(--muted)]">{project.id}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
