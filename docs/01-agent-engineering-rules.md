# Agent engineering rules

AuditTrail should be easy for AI agents to extend without silently weakening the architecture.

## Task workflow

The `tasks/` directory is the only task tracker for this project.

Agents should:

1. read the relevant `tasks/*.txt` files before starting work
2. work on exactly one task at a time
3. create new tasks directly in the appropriate `tasks/*.txt` category file
4. use branch names in the form `codex/<task-id>-<slug>`
5. update the owning `tasks/*.txt` file when branch/PR/state changes
6. move completed tasks to `Done` in the same file without deleting history
7. mark tasks complete only after tests pass, or after explicitly documenting skipped tests
8. automatically create a tracked task for any non-trivial request unless the user explicitly opts out

For low-context work, agents should prefer `docs/08-agent-quickstart.md`
before broad repo searches. The quickstart is the cheap path to repo layout,
feature entry points, and verification commands.

Supported task states:

- `todo`
- `ready`
- `in_progress`
- `blocked`
- `review`
- `done`

## API route rule

No API route should be added without tests.

The API test command enforces 95% coverage for lines, statements, branches, and functions:

```bash
pnpm --filter @auditrail/api test
```

Route tests should use Fastify `app.inject()` unless the behavior specifically requires a real network socket.

## Environment rule

API environment variables are validated with Zod before build and start:

```bash
pnpm --filter @auditrail/api validate:env
pnpm --filter @auditrail/api build
```

The validator reads root `.env`, then `apps/api/.env`, then process env. App-level values override root values.

Required API envs:

- `DATABASE_URL`
- `REDIS_URL`
- `API_KEY_PEPPER`
- `API_HOST`
- `API_PORT`
- `RATE_LIMIT_MAX`
- `RATE_LIMIT_WINDOW`
- `NODE_ENV`

Defaults exist only for non-secret process settings. Service URLs must be explicit.

## Local ports

Postgres maps to host port `5433` by default to avoid conflicting with an existing local Postgres on `5432`.

Redis maps to host port `6379` by default.

## Shared package rule

Shared packages should stay narrow:

- `packages/config`: environment and config parsing helpers only
- `packages/domain`: pure schemas, types, and business helpers only
- `packages/db`: database schema, database client, migrations, and query helpers only
- `packages/testkit`: test helpers only

Do not put framework, database, queue, or filesystem access into `packages/domain`.
