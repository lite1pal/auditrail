# AuditTrail Landing

Marketing site for AuditTrail, the multi-tenant audit log platform in this repo.

## What it should say

- AuditTrail captures product, admin, and export activity in one place.
- Browser sessions, organization membership, and exports are first-class.
- The app at `apps/web` is the actual product UI.

## Workspace

This app is already included by the root `pnpm-workspace.yaml` glob:

```yaml
apps/*
```

## Local Development

Run from the repository root:

```bash
pnpm --filter @auditrail/landing dev
```

If the package name changes again, update the filter accordingly.
