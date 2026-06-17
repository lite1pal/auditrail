# Platform Module

Owns organizations, projects, memberships, invitations, and browser-session
identity context for the API.

## Responsibilities

- organization and project CRUD
- membership role checks
- invitation lifecycle
- current user workspace context
- Postgres persistence for platform data

## Key Files

- `service.ts`: platform workflows and permission rules
- `routes.ts`: Fastify HTTP adapter
- `postgres-repo.ts`: Postgres persistence and `/me` context reads
- `context.ts`: current-user context composition
- `presenters.ts`: API response shaping

## Invariants

- membership checks must filter by both `organizationId` and `userId`
- invitation acceptance must match the signed-in user email
- pending invitations are unique per `organizationId + email`
- duplicate membership rows should not be created

## When Editing

- add or update route tests for any new endpoint or error shape
- add repo tests for ordering, deduplication, and authorization edges
- update migration files and `docs/06-deployment.md` for schema changes
