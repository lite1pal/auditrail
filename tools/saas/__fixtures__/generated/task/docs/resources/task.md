# Task Resource Preview

This preview was generated from a validated `task` resource spec.

## Supported assumptions

- ownership: `organization`
- CRUD: `list`, `create`, `read`, `update`
- delete generation: unsupported in the first generator
- output mode: preview-only under `.generated/` or `tmp/`

## Fields

- `title`: `string` required
- `status`: `enum` required
- `dueAt`: `datetime`
- `projectId`: `uuid` required
- `assigneeId`: `uuid`

## Generated file groups

- `packages/domain/src/generated/task/index.ts`
- `packages/db/src/schema/task.ts`
- `apps/api/src/modules/generated/task/routes.ts`
- `apps/api/src/modules/generated/task/service.ts`
- `apps/api/src/modules/generated/task/repo.ts`
- `apps/api/src/modules/generated/task/postgres-repo.ts`
- `apps/api/src/modules/generated/task/__tests__/routes.test.ts`
- `apps/api/src/modules/generated/task/__tests__/routes.integration.test.ts`
- `apps/api/src/modules/generated/task/__tests__/service.test.ts`
- `apps/web/src/features/task/index.ts`
- `apps/web/src/features/task/api/task-client.ts`
- `apps/web/src/features/task/components/task-screen.tsx`
- `apps/web/src/features/task/components/task-form.tsx`
- `apps/web/src/features/task/components/task-table.tsx`
- `apps/web/src/features/task/components/task-empty-state.tsx`
- `apps/web/src/features/task/domain/schemas.ts`
- `apps/web/src/features/task/__tests__/task-screen.test.tsx`
- `apps/web/src/features/task/__tests__/task-client.test.ts`
- `apps/web/app/tasks/page.tsx`
- `apps/web/app/tasks/create/page.tsx`
- `apps/web/app/tasks/[id]/page.tsx`
- `apps/web/app/tasks/[id]/edit/page.tsx`
- `docs/resources/task.md`
- `docs/resources/task-customization.md`

## Manual follow-up

- add domain and DB barrel exports if this preview is promoted into real repo source
- register routes intentionally instead of copying generated preview files into `apps/api/src/app.ts` blindly
- write a real migration after picking the next migration identifier
