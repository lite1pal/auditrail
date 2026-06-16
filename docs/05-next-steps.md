# Next Steps

Keep the build vertical and incremental.

## Recommended Order

1. Add dashboard read model:
   - recent events
   - event count
   - top event types

This is now partially implemented through:

- `GET /v1/events`
- `GET /v1/events/stats`

The next API-only extension should prefer one of:

1. event-count time buckets for charts
1. top actors / top targets summaries
1. saved filter presets or export-oriented query reuse

1. Add richer event filters only if backed by indexes or clear product need:
   - environment
   - project id for internal admin views
   - actor/target type if introduced into the schema

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
