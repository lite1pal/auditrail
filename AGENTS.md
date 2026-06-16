# AuditTrail Agent Instructions

## Operating Rule

For this project, the assistant must not run shell commands or execute local tooling directly.

Instead, the assistant must:

- tell the user exactly which commands to run
- explain the expected outcome briefly
- ask the user to paste back any output needed for the next step
- use file edits only when implementation is requested

## Architecture Rules

Keep every unit tiny, reusable, testable, and simple.

- Prefer small modules over broad framework abstractions.
- Keep domain logic pure: no database, HTTP, filesystem, queue, or environment access.
- Validate all external input with Zod at the boundary.
- Keep environment parsing centralized and tested.
- Do not add infrastructure until a vertical slice needs it.
- Do not introduce optional architecture-showcase technology before the core event path works.

## API Route Rule

No API route should be added without tests.

The API test command must enforce at least 95% coverage for:

- lines
- statements
- branches
- functions

Use Fastify `app.inject()` for route tests unless the behavior specifically requires a real network socket.

Test code must not rely on shared global environment mutation when the same behavior can be injected directly. Prefer explicit app, plugin, service, or repo options over `process.env` stubbing for unit tests, because Vitest runs files concurrently.

When changing Fastify plugin registration, keep TypeScript overload behavior in mind: do not pass `undefined` as plugin options. Register the plugin without an options object unless options actually exist.

## Environment Rule

API environment variables must be validated before build and start.

Service URLs must be explicit. Defaults are acceptable only for non-secret process settings such as host, port, and `NODE_ENV`.

Environment file loading precedence is:

1. repository `.env`
2. app-local `.env`
3. real process environment

Real process environment must win so test and deployment overrides remain deterministic.

## Command Handoff Format

When commands are needed, provide them in copy-pasteable blocks from the repository root unless another directory is explicitly required.

Example:

```bash
pnpm typecheck
pnpm --filter @auditrail/api test
```
