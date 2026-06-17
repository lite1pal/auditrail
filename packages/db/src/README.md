# Database Package

Owns the shared Drizzle schema, migrations, and any seed helpers.

## Responsibilities

- database schema definitions
- migration files and journal metadata
- shared table/column naming conventions
- database-level constraints and indexes

## Key Files

- `schema/`: table definitions used by API modules
- `migrations/`: generated and hand-maintained SQL migrations
- `migrations/meta/_journal.json`: migration journal used by Drizzle

## Invariants

- schema changes must be paired with migrations
- uniqueness and ordering rules should be enforced in SQL when possible
- API modules should depend on the schema package instead of duplicating table shapes

## When Editing

- update the journal if a migration is added manually
- keep migrations idempotent for existing developer databases
- add migration notes to `docs/06-deployment.md` when runtime behavior changes
