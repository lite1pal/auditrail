# Next Steps

Keep the build vertical and incremental.

## Recommended Order

1. Add dashboard read model:
   - recent events
   - event count
   - top event types

1. Add web dashboard:
   - call `GET /v1/events`
   - show recent event table
   - add event detail drawer

1. Add queue package and worker:
   - BullMQ
   - Redis connection
   - `audit-event.created` job
   - placeholder webhook delivery processor

1. Add export jobs:
   - CSV export
   - date-range filters
   - background job status

1. Add tamper-evident hash chain:
   - previous hash
   - event hash
   - verification endpoint or job

## Not Yet

Do not add these before the dashboard and queue slice are working:

- ClickHouse
- billing
- SSO
- Kubernetes
- published SDK packages
- complex RBAC
