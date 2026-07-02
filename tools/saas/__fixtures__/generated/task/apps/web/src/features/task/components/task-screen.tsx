import type { TaskRecord } from "../domain/schemas.js";

import { TaskEmptyState } from "./task-empty-state.js";
import { TaskTable } from "./task-table.js";

type TaskRelationPresentation = {
  href?: string;
  label: string;
};

type TaskRelationPresentations = Record<
  string,
  Partial<Record<string, TaskRelationPresentation>>
>;

export function TaskScreen(input: {
  items: readonly TaskRecord[];
  organizationId?: string;
  projectId?: string;
  relationPresentations?: TaskRelationPresentations;
  resourceBasePath?: string;
}) {
  if (input.items.length === 0) {
    return <TaskEmptyState />;
  }

  return (
    <TaskTable
      items={input.items}
      organizationId={input.organizationId}
      projectId={input.projectId}
      relationPresentations={input.relationPresentations}
      resourceBasePath={input.resourceBasePath}
    />
  );
}
