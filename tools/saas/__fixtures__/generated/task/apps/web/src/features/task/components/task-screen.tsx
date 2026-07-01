import type { TaskRecord } from "../domain/schemas.js";

import { TaskEmptyState } from "./task-empty-state.js";
import { TaskTable } from "./task-table.js";

export function TaskScreen(input: {
  items: readonly TaskRecord[];
}) {
  if (input.items.length === 0) {
    return <TaskEmptyState />;
  }

  return <TaskTable items={input.items} />;
}
