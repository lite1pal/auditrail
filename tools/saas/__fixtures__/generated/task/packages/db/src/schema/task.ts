import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { organizations, projects, users } from "./identity.js";

export const taskTable = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id),
    title: text("title").notNull(),
    status: text("status").notNull(),
    dueAt: timestamp("due_at", { withTimezone: true }),
    projectId: uuid("project_id").notNull().references(() => projects.id),
    assigneeId: uuid("assignee_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("tasks_organization_id_idx").on(table.organizationId),
    index("tasks_project_id_idx").on(table.projectId),
    index("tasks_assignee_id_idx").on(table.assigneeId)
  ]
);
