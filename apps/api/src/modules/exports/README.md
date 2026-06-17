# Exports Module

Owns async export job creation, processing, storage, and API routes.

## Responsibilities

- export job persistence
- job state transitions
- CSV generation
- object storage boundary
- worker loop for pending jobs

## Key Files

- `service.ts`: export orchestration and authorization
- `routes.ts`: Fastify HTTP adapter
- `postgres-repo.ts`: Postgres persistence
- `storage.ts`: object storage boundary and in-memory storage
- `csv.ts`: export file generation
- `worker.ts`: pending-job processing loop

## Invariants

- jobs are scoped by organization and project
- pending jobs are processed in deterministic order
- completed jobs store an object key
- failed jobs keep the failure reason

## When Editing

- keep route handlers thin and test every endpoint
- add repo tests for ordering and scoping
- update docs when job state or download behavior changes
