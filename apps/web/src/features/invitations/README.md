# Invitations Feature

Owns invitation DTOs and the API boundary used by workspace settings.

## Responsibilities

- invitation token display and acceptance
- invitation API client
- invitation DTO validation and presentation helpers

## Key Files

- `api/invitations-client.ts`: direct API client for invitation routes
- `domain/schemas.ts`: Zod schemas for invitation payloads
- `domain/presenters.ts`: invitation status helpers
- `components/*`: invitation-related UI lives elsewhere for now

## Invariants

- the API returns opaque tokens, not full URLs
- the web app composes the invite URL for display
- acceptance should be routed through the signed-in browser session

## When Editing

- keep token handling explicit and testable
- update docs if invitation state or lifecycle changes
