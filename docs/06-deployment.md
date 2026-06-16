# Deployment

AuditTrail currently deploys as a single API container. PostgreSQL and Redis should be provisioned as separate services in Coolify.

## Coolify setup

Create one application from this repository and point it at the root `Dockerfile`.

Container port:

- `4000`

Required environment variables:

- `DATABASE_URL`
- `REDIS_URL`
- `API_KEY_PEPPER`

Recommended environment variables:

- `API_HOST=0.0.0.0`
- `API_PORT=4000`
- `PORT=4000`
- `RATE_LIMIT_MAX=100`
- `RATE_LIMIT_WINDOW=1 minute`

Notes:

- `PORT` is supported as a fallback for platforms that inject it automatically.
- The container runs `pnpm db:migrate` before starting the API.
- `TEST_DATABASE_URL` is not required in production.

## Services

Create these separate resources in Coolify:

- PostgreSQL
- Redis

Wire their connection strings into:

- `DATABASE_URL`
- `REDIS_URL`

## Deploy flow

1. Push changes to the connected git branch.
2. Let Coolify rebuild the app image from the root `Dockerfile`.
3. Coolify starts the container.
4. The container applies migrations.
5. The API starts on port `4000`.

## Health check

Container health is based on:

```text
GET /health
```

Expected response:

```json
{
  "status": "ok"
}
```
