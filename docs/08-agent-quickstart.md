# Agent Quickstart

Use this file when you want the smallest useful context before changing code.

## Read Order

Start with:

1. `AGENTS.md`
2. the relevant `tasks/*.txt` file
3. this quickstart

Then read only the feature-local files for the task.

## Repo Map

- `apps/api`: Fastify API, auth, platform, exports, audit-event ingestion and reads
- `apps/web`: Next.js product UI for the API
- `apps/landing`: marketing site
- `packages/domain`: pure schemas and domain helpers
- `packages/db`: Drizzle schema, migrations, DB client
- `packages/config`: shared config helpers
- `packages/testkit`: test helpers only

## Cheapest Read Path

For API route work:

1. `apps/api/src/modules/<feature>/README.md` if it exists
2. `service.ts`
3. `routes.ts`
4. source-adjacent `__tests__`

For web feature work:

1. `apps/web/README.md`
2. `apps/web/src/features/<feature>/components/*`
3. `domain/*`
4. source-adjacent `__tests__`

For env or startup work:

1. `apps/api/src/config.ts`
2. `apps/api/src/app.ts`
3. `apps/api/src/__tests__/config.test.ts`
4. `docs/06-deployment.md`

For auth work:

1. `apps/api/src/modules/auth/README.md`
2. `apps/api/src/modules/auth/service.ts`
3. `apps/api/src/modules/auth/senders.ts`
4. `apps/api/src/modules/auth/__tests__/*`

## Do Not Read First

Avoid starting with:

- broad recursive file dumps
- every doc under `docs/`
- unrelated feature trees
- generated files unless the task explicitly touches them

## Command Shortlist

Run from the repository root.

Fast whole-repo checks:

```bash
pnpm typecheck
pnpm test
```

API-focused:

```bash
pnpm --filter @auditrail/api typecheck
pnpm --filter @auditrail/api test
```

Web-focused:

```bash
pnpm --filter web check:architecture
pnpm --filter web typecheck
pnpm --filter web test
```

Targeted search:

```bash
rg "symbolName" apps/api/src
rg "symbolName" apps/web/src
rg --files apps/web/src/features/audit-events
```

## Working Rules

- create or update a tracked task for non-trivial work
- change one task at a time
- keep domain code pure
- validate external input at boundaries with Zod
- add tests with behavior changes
- update docs in the same change when workflow, architecture, runtime, or contracts change

## File Ownership Hints

- API behavior belongs in `apps/api/src/modules/*`
- Web behavior belongs in `apps/web/src/features/*`
- Shared UI primitives belong in `apps/web/src/components/ui`
- Cross-cutting repo rules belong in `AGENTS.md` and `docs/01-agent-engineering-rules.md`
- Deployment/runtime truth belongs in `docs/06-deployment.md`

## Good Default

If you are unsure where to start, read:

1. the owning task file
2. the closest feature `README.md`
3. the smallest passing test near the code you need to change
