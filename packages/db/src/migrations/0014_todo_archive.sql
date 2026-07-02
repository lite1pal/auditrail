alter table "todos"
  add column if not exists "archived_at" timestamp with time zone;
