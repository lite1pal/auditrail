# Architecture

AuditTrail uses a TypeScript monorepo with small deployable apps and narrow shared packages.

## Apps

`apps/api` owns HTTP behavior:

- request validation
- API key authentication
- rate limiting
- event ingestion
- event reads
- API-specific tests and coverage gates

`apps/web` owns the dashboard experience. It should call the API instead of importing API internals.

## Packages

`packages/domain` contains pure schemas and domain types. It must not import framework, database, filesystem, queue, or env code.

`packages/config` contains reusable config parsing helpers.

`packages/db` contains Drizzle schema, database client creation, migrations, and seed helpers.

`packages/testkit` contains reusable test helpers only.

## API Module Shape

API feature modules should stay small:

```text
module/
  routes.ts
  service.ts
  repo.ts
```

- `routes.ts`: HTTP, auth principal, request/response validation
- `service.ts`: business workflow
- `repo.ts`: persistence interface or in-memory test adapter
- `postgres-repo.ts`: Postgres adapter when needed

Routes should depend on services. Services should depend on repo interfaces. Tests can inject fake or in-memory services to avoid slow infrastructure.

## Current Event Flow

```text
Client
  -> Fastify rate limiter
  -> API key auth
  -> Zod payload validation
  -> Audit event service
  -> Postgres repo
  -> audit_events table
```

The read path uses the same API key principal to scope events to the authenticated project.

## Web Frontend Architecture

`apps/web` is a pure Next.js UI application. It must consume the existing
Fastify API under `apps/api` and must not introduce Next.js route handlers,
`pages/api` endpoints, proxy routes, or backend-for-frontend endpoints.

Frontend modules should mirror the successful API boundaries:

- route files are thin render adapters
- feature services own use cases
- API clients own HTTP calls to `/api/v1`
- domain modules own schemas, query parsing, and pure transformations
- presenters convert API DTOs into view models
- components render JSX only and stay under 120 lines

Feature code belongs under `apps/web/src/features/<feature>`. Shared primitives
belong under `apps/web/src/components/ui`, and shared infrastructure belongs
under `apps/web/src/lib`. Server data is owned by TanStack Query or server
component loaders, not by global client stores.

Protected API reads from server components must use server-only credentials such
as `WEB_API_KEY`. Do not expose ingestion or machine API keys through
`NEXT_PUBLIC_*` variables. Browser refetching of protected data requires a
browser-safe user auth flow validated by `apps/api`.

The web library baseline is Radix UI and shadcn-style local primitives for UI,
React Hook Form and Zod for forms, TanStack Query for API cache ownership,
TanStack Table for data grids, Recharts for dashboard charts, `nuqs` for URL
state, Zustand only for shared UI state, Clerk for browser user sessions backed
by Fastify token verification, `next-intl` for i18n, Sentry for monitoring, and
PostHog for product analytics. OpenAPI types must be generated from
`apps/api`'s `/api/v1/openapi.json`; `apps/web` must not become a second API
contract source.
