# Exports Feature

Owns export-job presentation for the web app.

## Responsibilities

- export job view models
- export history rendering
- download link presentation

## Key Files

- `domain/presenters.ts`: export job view model helpers
- `domain/schemas.ts`: Zod schemas for export DTOs
- future API client and server loader code should live here

## Invariants

- components should only render data passed in from loaders/hooks
- export jobs remain scoped to a project
- completed jobs expose a download URL, pending jobs do not

## When Editing

- keep the feature split between pure presenters and UI
- add tests for any new state mapping
