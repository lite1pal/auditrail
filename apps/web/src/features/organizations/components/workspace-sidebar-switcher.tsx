"use client";

import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Select } from "@/src/components/ui/select";
import type { CurrentUserResponse } from "@/src/features/auth/domain/schemas";

interface WorkspaceSidebarSwitcherProps {
  activeOrganizationId?: string;
  activeProjectId?: string;
  memberships: CurrentUserResponse["memberships"];
}
export function WorkspaceSidebarSwitcher({
  activeOrganizationId,
  activeProjectId,
  memberships
}: WorkspaceSidebarSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const initialOrganizationId =
    activeOrganizationId ?? memberships[0]?.organization.id ?? "";
  const initialProjectId =
    activeProjectId ??
    memberships.find((membership) => membership.organization.id === initialOrganizationId)?.projects[0]
      ?.id ??
    "";
  const [organizationId, setOrganizationId] = useState(initialOrganizationId);
  const [projectId, setProjectId] = useState(initialProjectId);

  useEffect(() => {
    setOrganizationId(initialOrganizationId);
    setProjectId(initialProjectId);
  }, [initialOrganizationId, initialProjectId]);

  const selectedMembership = memberships.find(
    (membership) => membership.organization.id === organizationId
  );

  function openWorkspace(nextOrganizationId: string, nextProjectId: string) {
    if (!nextOrganizationId) {
      return;
    }

    const query = new URLSearchParams({
      organizationId: nextOrganizationId
    });

    if (nextProjectId) {
      query.set("projectId", nextProjectId);
    }

    startTransition(() => {
      router.push(`${pathname}?${query.toString()}` as Route);
    });
  }

  return (
    <div aria-busy={isPending} className="grid gap-3">
      <div className="grid gap-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          Workspace switcher
        </p>
        <p className="text-sm text-[var(--muted)]">
          Changing either field updates the current page immediately.
        </p>
      </div>
      <label className="grid gap-1 text-sm font-semibold">
        <span>Organization</span>
        <Select
          aria-label="Organization"
          disabled={memberships.length === 0 || isPending}
          onChange={(event) => {
            const nextOrganizationId = event.target.value;
            const nextProjectId =
              memberships.find(
                (membership) => membership.organization.id === nextOrganizationId
              )?.projects[0]?.id ?? "";

            setOrganizationId(nextOrganizationId);
            setProjectId(nextProjectId);
            openWorkspace(nextOrganizationId, nextProjectId);
          }}
          value={organizationId}
        >
          {memberships.map((membership) => (
            <option key={membership.organization.id} value={membership.organization.id}>
              {membership.organization.name}
            </option>
          ))}
        </Select>
      </label>
      <label className="grid gap-1 text-sm font-semibold">
        <span>Project</span>
        <Select
          aria-label="Project"
          disabled={!selectedMembership || isPending}
          onChange={(event) => {
            const nextProjectId = event.target.value;
            setProjectId(nextProjectId);
            openWorkspace(organizationId, nextProjectId);
          }}
          value={projectId}
        >
          {(selectedMembership?.projects ?? []).map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </Select>
      </label>
      <p className="text-xs text-[var(--muted)]">
        {isPending ? "Updating workspace..." : "Selection is stored in the URL."}
      </p>
    </div>
  );
}
