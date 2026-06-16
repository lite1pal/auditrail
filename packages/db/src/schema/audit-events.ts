import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid
} from "drizzle-orm/pg-core";

import { organizations, projects } from "./identity.js";

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id),
    eventType: text("event_type").notNull(),
    actorId: text("actor_id"),
    targetId: text("target_id"),
    metadata: jsonb("metadata").notNull().default({}),
    requestIp: text("request_ip"),
    userAgent: text("user_agent"),
    previousHash: text("previous_hash"),
    eventHash: text("event_hash"),
    createdAt: timestamp("created_at", {
      withTimezone: true
    })
      .notNull()
      .defaultNow()
  },
  (table) => [
    index("audit_events_organization_id_idx").on(table.organizationId),
    index("audit_events_project_id_created_at_idx").on(
      table.projectId,
      table.createdAt
    ),
    index("audit_events_event_type_idx").on(table.eventType),
    index("audit_events_actor_id_idx").on(table.actorId),
    index("audit_events_target_id_idx").on(table.targetId)
  ]
);
