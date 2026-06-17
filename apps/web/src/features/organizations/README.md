# Organizations Feature

Owns the protected workspace management UI.

## Responsibilities

- organization switching
- project creation and listing
- invitation creation and acceptance
- workspace context derived from `/api/v1/me`

## Key Files

- `api/organizations-client.ts`: API boundary for org/project routes
- `server/organizations-server.ts`: server loaders and actions
- `components/*`: presentational settings screen and forms
- `domain/presenters.ts`: workspace view model helpers
- `domain/schemas.ts`: Zod schemas for org/project data

## Invariants

- active workspace context comes from the current user response
- actions call the Fastify API directly
- invitation acceptance is keyed by token plus signed-in email
- duplicate memberships should not surface in the UI

## When Editing

- add tests for presenter or client changes
- keep components thin and reusable
- update the API docs and deployment notes if the backend contract changes
