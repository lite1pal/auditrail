import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid
} from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true
  })
    .notNull()
    .defaultNow()
});

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    name: text("name").notNull(),
    environment: text("environment").notNull().default("production"),
    createdAt: timestamp("created_at", {
      withTimezone: true
    })
      .notNull()
      .defaultNow()
  },
  (table) => [index("projects_organization_id_idx").on(table.organizationId)]
);

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id),
    keyHash: text("key_hash").notNull().unique(),
    keyPrefix: text("key_prefix").notNull(),
    name: text("name").notNull(),
    revoked: boolean("revoked").notNull().default(false),
    createdAt: timestamp("created_at", {
      withTimezone: true
    })
      .notNull()
      .defaultNow(),
    lastUsedAt: timestamp("last_used_at", {
      withTimezone: true
    })
  },
  (table) => [
    index("api_keys_project_id_idx").on(table.projectId),
    index("api_keys_key_prefix_idx").on(table.keyPrefix),
    index("api_keys_active_key_hash_idx")
      .on(table.keyHash)
      .where(sql`${table.revoked} = false`)
  ]
);
