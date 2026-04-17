# OneSource Runbook

## Purpose

This runbook captures the real operational procedures for the current Phase 0 stack. It should be updated as the app gains migrations, auth, scheduled jobs, and external connectors.

## Current Services

- `web`: Next.js production server on port `3000`
- `db`: PostgreSQL 16 on port `5432`
- `worker`: placeholder background process with database heartbeat logging
- `test`: profile-gated compose runner for lint, build, and unit tests
- `playwright`: profile-gated Chromium browser test runner

## Preconditions

1. Copy the example env file if `.env` does not exist:

```bash
cp .env.example .env
```

2. Install repo dependencies on the host:

```bash
npm install
```

This host install is currently required before compose workflows because Docker containers in this environment cannot fetch packages from `registry.npmjs.org`.

## Boot The Default Stack

Start the app, database, and worker:

```bash
docker compose up --build
```

Detached mode:

```bash
docker compose up --build -d
```

## Health Checks

Inspect running services:

```bash
docker compose ps
```

Check the application health endpoint:

```bash
curl http://127.0.0.1:3000/api/health
```

Expected healthy response shape:

```json
{
  "status": "ok",
  "database": {
    "ok": true,
    "checkedAt": "2026-04-17T00:00:00.000Z"
  }
}
```

If PostgreSQL is unavailable, the route returns HTTP `503` with `status: "degraded"` and the database error message.

## Logs

Follow the web and worker logs:

```bash
docker compose logs -f web worker
```

Worker logs are structured JSON with:

- `timestamp`
- `service`
- `level`
- `message`
- optional `detail`

## Compose Test Workflows

Lint:

```bash
docker compose --profile test run --rm test run lint
```

Unit tests:

```bash
docker compose --profile test run --rm test
```

Production build validation:

```bash
docker compose --profile test run --rm test run build
```

Chromium Playwright against the compose-managed app:

```bash
docker compose --profile test up --build --abort-on-container-exit --exit-code-from playwright playwright
```

The Playwright container waits for the `web` health check before running tests.

## Host Verification Commands

These remain useful for faster local feedback:

```bash
npm run lint
npm test
npm run build
npm run e2e
```

To target an already-running app instance:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npm run e2e
```

## Shutdown

Stop the stack:

```bash
docker compose down
```

Stop the stack and remove orphaned containers:

```bash
docker compose down --remove-orphans
```

## Failure Modes And Recovery

### Invalid Environment Variables

Symptoms:

- `web` exits during startup
- error references `DATABASE_URL` or `WORKER_POLL_INTERVAL_MS`

Recovery:

1. Check `.env` against `.env.example`.
2. Ensure `DATABASE_URL` uses `postgres://` or `postgresql://`.
3. Restart the stack with `docker compose up --build`.

### Database Unhealthy

Symptoms:

- `docker compose ps` shows `db` unhealthy
- `/api/health` returns `503`
- worker logs report heartbeat failures

Recovery:

1. Inspect database logs with `docker compose logs db`.
2. Confirm `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` match the composed `DATABASE_URL`.
3. If the local data directory is intentionally disposable and corrupted, remove `./.docker/postgres-data` and rebuild the stack.

### Compose Tests Fail Before App Logic Runs

Symptoms:

- image builds or test containers fail before Next.js or Vitest starts
- npm install steps hang or fail with registry/network errors

Recovery:

1. Confirm the host dependency tree exists with `npm install`.
2. Re-run the compose test command.
3. If the failure still references `registry.npmjs.org`, treat it as the known `P0-02a` blocker rather than an application regression.

### Browser Tests Fail

Symptoms:

- Playwright exits non-zero
- `playwright-report/` or `test-results/` contains artifacts

Recovery:

1. Inspect the report artifacts in `playwright-report/` and `test-results/`.
2. Confirm `web` is healthy with `docker compose ps` or `curl /api/health`.
3. Re-run either the host-side `npm run e2e` flow or the compose Playwright workflow depending on the failing environment.

## Operational Gaps

This Phase 0 runbook does not yet cover:

- migrations
- seed resets
- auth or session recovery
- queue drains or retriable jobs
- connector outage handling
- incident management beyond local development failures

Those procedures must be added as the corresponding checklist items are implemented.
