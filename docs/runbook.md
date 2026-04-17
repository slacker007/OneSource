# OneSource Runbook

## Purpose

This runbook captures the real operational procedures for the current repo baseline. It now covers the full Phase 0 stack plus the first Prisma-backed auth, audit, opportunity, source-lineage, connector-metadata, and workspace-execution schema slices, and it should be updated as the app gains live auth flows, scheduled jobs, and external connectors.

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

2. Host dependency installation is only required for host-run workflows such as `npm run lint`, `npm test`, or `npm run e2e`:

```bash
npm install
```

Compose workflows do not depend on host `node_modules`; Docker images install from the committed offline archive at `vendor/npm-offline-cache.tar.gz`.

3. When dependency versions change, refresh the offline cache archive before rebuilding images:

```bash
npm install
npm run cache:npm:refresh
```

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

## Prisma Workflows

Validate the schema:

```bash
npm run prisma:validate
```

Create and apply a development migration against the running PostgreSQL instance:

```bash
npm run prisma:migrate:dev -- --name your_migration_name
```

Apply the current seed defaults:

```bash
npm run db:seed
```

The current seed is idempotent enough for local development. It upserts the default organization, system roles, and local admin user; persists one agency, two contract vehicles, two competitors; creates connector configs for `sam.gov`, `usaspending_api`, and `gsa_ebuy`; seeds one imported `sam.gov` opportunity with retained source attachments, contacts, and a create-opportunity import decision; seeds one `usaspending_api` award-enrichment record linked to the same opportunity with an award child row and a link-to-existing import decision; seeds one realistic workspace with tasks, milestones, notes, documents, stage transitions, a scorecard, a bid decision, and activity events; then appends one bootstrap audit-log record.

To inspect the seeded workspace graph directly:

```bash
node --input-type=module -e 'import { PrismaClient } from "@prisma/client"; const prisma = new PrismaClient(); const summary = await prisma.opportunity.findFirst({ where: { externalNoticeId: "FA4861-26-R-0001" }, select: { title: true, currentStageKey: true, tasks: { select: { title: true, status: true } }, milestones: { select: { title: true, status: true } }, notes: { select: { title: true, isPinned: true } }, documents: { select: { title: true, sourceType: true, extractionStatus: true } }, stageTransitions: { select: { toStageKey: true, transitionedAt: true } }, scorecards: { select: { totalScore: true, recommendationOutcome: true, factorScores: { select: { factorKey: true, score: true } } } }, bidDecisions: { select: { finalOutcome: true, decidedAt: true } }, activityEvents: { select: { eventType: true, occurredAt: true } } } }); console.log(JSON.stringify(summary, null, 2)); await prisma.$disconnect();'
```

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
docker compose --profile test run --rm --build test run lint
```

Unit tests:

```bash
docker compose --profile test run --rm --build test
```

Production build validation:

```bash
docker compose --profile test run --rm --build test run build
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

### Prisma Migration Fails

Symptoms:

- `npm run prisma:migrate:dev` exits non-zero
- Prisma reports drift or an unapplied schema change

Recovery:

1. Ensure PostgreSQL is running with `docker compose up -d db`.
2. Re-run `npm run prisma:validate` to separate schema errors from database errors.
3. Inspect the latest migration under `prisma/migrations/`.
4. If the local database can be discarded, reset it deliberately and rerun migrations plus seed:

```bash
npx prisma migrate reset --force
npm run db:seed
```

Only use reset for disposable local development data.

### Compose Tests Fail Before App Logic Runs

Symptoms:

- image builds or test containers fail before Next.js or Vitest starts
- `npm ci --offline` reports a missing cached tarball

Recovery:

1. Confirm `vendor/npm-offline-cache.tar.gz` exists in the repo.
2. Refresh it with `npm install && npm run cache:npm:refresh` if `package-lock.json` changed.
3. Re-run the compose test command.

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

- auth or session recovery
- connector credential storage or rotation
- queue drains or retriable jobs
- connector outage handling
- incident management beyond local development failures

Those procedures must be added as the corresponding checklist items are implemented.
