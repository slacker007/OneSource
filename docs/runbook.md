# OneSource Runbook

## Purpose

This runbook captures the real operational procedures for the current repo baseline. It now covers the full Phase 0 stack plus the Prisma-backed auth, audit, opportunity, source-lineage, connector-metadata, workspace-execution, and first live auth plus authz slices, and it should be updated as the app gains broader authorization rules, scheduled jobs, and external connectors.

## Current Services

- `web`: Next.js production server on port `3000`
- `db`: PostgreSQL 16 on port `5432`
- `worker`: background process that scans task and milestone deadlines, persists reminder state, and writes structured summary logs
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

Compose workflows do not depend on host `node_modules`. Docker images install with normal `npm ci` by default and can fall back to optional local cache archives under `vendor/` when container registry access is unavailable. The canonical entrypoint is now the repo `Makefile`, which prepares those local archives before Docker builds.

3. When dependency versions change, or when a Docker environment needs offline install inputs, refresh the optional local cache archives before rebuilding images:

```bash
make docker-artifacts
```

## Boot The Default Stack

Start the app, database, and worker:

```bash
make compose-up
```

Detached mode:

```bash
make compose-up-detached
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

The current seed is idempotent enough for local development. It upserts the default organization, system roles, and seven realistic local users; persists one organization scoring profile with target NAICS codes, focus agencies, relationship agencies, capability inventory rows, certification rows, selected vehicles, and six weighted scoring criteria; persists five agencies, five contract vehicles, and five competitors; creates connector configs for `sam.gov`, `usaspending_api`, `gsa_ebuy`, and `csv_upload`; seeds one imported `sam.gov` opportunity with retained source attachments, contacts, and a create-opportunity import decision; seeds one `usaspending_api` award-enrichment record linked to the same opportunity with an award child row and a link-to-existing import decision; seeds four additional manual opportunities across `qualified`, `proposal_in_development`, `submitted`, and `no_bid`; seeds realistic workspace data with varied tasks, milestones, notes, documents, stage transitions, scorecards, bid decisions, activity events, retained extracted text, and local-disk document paths; then runs the same deadline-reminder sweep used by the worker so the app opens with truthful overdue and upcoming reminder state before appending the bootstrap audit-log record.

The same seed also writes deterministic local password hashes for all seven users so the credentials-provider sign-in flow works immediately in development. Use the admin email `admin@onesource.local` or the viewer email `avery.stone@onesource.local` plus the shared local development password documented in [src/lib/auth/local-demo-auth.mjs](/Users/maverick/Documents/RalphLoops/OneSource/src/lib/auth/local-demo-auth.mjs:1) for smoke verification only.

## Document Storage

- Opportunity document uploads are stored on local disk beneath `DOCUMENT_UPLOAD_DIR`, which defaults to `.data/opportunity-documents`.
- The upload flow writes the file first, then persists `opportunity_documents` metadata including checksum, file size, mime type, extraction status, and extracted text when the content is UTF-8 text-like.
- Stored files are served back through `GET /api/opportunities/documents/[documentId]/download`, which rechecks authentication and organization scope before returning the file or redirecting to an external source URL.
- The current synchronous extractor handles text-like formats such as `.txt`, `.md`, `.csv`, `.json`, `.xml`, `.yaml`, and HTML. Binary formats are still stored, but they remain `NOT_REQUESTED` until a later Phase 7 parsing job can process them.
- Local uploads live under `.data/`, which is ignored by git. Remove that directory manually if you need to reset stored development artifacts.

To inspect the seeded opportunity portfolio directly:

```bash
node --input-type=module -e 'import { PrismaClient } from "@prisma/client"; const prisma = new PrismaClient(); const summary = await prisma.opportunity.findMany({ orderBy: { title: "asc" }, select: { title: true, currentStageKey: true, leadAgency: { select: { name: true } }, scorecards: { where: { isCurrent: true }, take: 1, select: { recommendationOutcome: true, totalScore: true } }, bidDecisions: { where: { isCurrent: true }, take: 1, select: { finalOutcome: true } }, tasks: { orderBy: { dueAt: "asc" }, take: 2, select: { title: true, status: true } } } }); console.log(JSON.stringify(summary, null, 2)); await prisma.$disconnect();'
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

The reminder sweep summary currently includes:

- `scannedTaskCount`
- `scannedMilestoneCount`
- `taskReminderUpdates`
- `milestoneReminderUpdates`
- `upcomingTaskCount`
- `overdueTaskCount`
- `upcomingMilestoneCount`
- `overdueMilestoneCount`

## Compose Test Workflows

Lint:

```bash
make compose-test-lint
```

Unit tests:

```bash
make compose-test
```

Production build validation:

```bash
make compose-test-build
```

Chromium Playwright against the compose-managed app:

```bash
make compose-test-e2e
```

The Playwright container waits for the `web` health check before running tests. Browser execution is intentionally serialized because the smoke suite mutates one shared seeded database.

If the local `.env` predates the reminder worker slice and does not include `DEADLINE_REMINDER_LOOKAHEAD_DAYS`, either refresh `.env` from `.env.example` or prefix the compose command with `DEADLINE_REMINDER_LOOKAHEAD_DAYS=7`.

## Auth And Authz Smoke Check

To verify the protected-route auth and authz slices manually after the stack is running:

1. Open `http://127.0.0.1:3000/`.
2. Confirm the app redirects to `/sign-in`.
3. Sign in with the seeded admin email `admin@onesource.local` and the shared local development password.
4. Confirm the protected shell renders, the sign-out control is visible, and the admin-console link is shown.
5. Open `/settings` and confirm the admin console renders for the admin user with the `Organization scoring profile`, `Assigned roles`, and `Recent audit activity` sections visible.
6. Sign out, sign back in as `avery.stone@onesource.local`, navigate directly to `/settings`, and confirm the app redirects to `/forbidden`.

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
make compose-down
```

Stop the stack and remove orphaned containers:

```bash
docker compose down --remove-orphans
```

## Failure Modes And Recovery

### Invalid Environment Variables

Symptoms:

- `web` exits during startup
- error references `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`, or `WORKER_POLL_INTERVAL_MS`
- error references `DEADLINE_REMINDER_LOOKAHEAD_DAYS`

Recovery:

1. Check `.env` against `.env.example`.
2. Ensure `DATABASE_URL` uses `postgres://` or `postgresql://`.
3. Ensure `AUTH_SECRET` is at least 32 characters, `NEXTAUTH_URL` is an absolute URL, and `DEADLINE_REMINDER_LOOKAHEAD_DAYS` is a positive integer.
4. Restart the stack with `make compose-up`.

### Database Unhealthy

Symptoms:

- `docker compose ps` shows `db` unhealthy
- `/api/health` returns `503`
- worker logs report deadline reminder sweep failures

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
- `npm ci` fails before Next.js or Vitest starts
- `npm ci --offline` reports a missing cached tarball when using local fallback archives

Recovery:

1. If the environment should support online installs, confirm the container runtime can reach the npm registry and re-run the compose command.
2. If the environment needs offline inputs, regenerate the local archives with `make docker-artifacts`.
3. Re-run the compose test command.

### Browser Tests Fail

Symptoms:

- Playwright exits non-zero
- `playwright-report/` or `test-results/` contains artifacts
- the host-side Next.js web server crashes before tests start with a Turbopack checksum or cache-corruption panic

Recovery:

1. Inspect the report artifacts in `playwright-report/` and `test-results/`.
2. Confirm `web` is healthy with `docker compose ps` or `curl /api/health`.
3. If the failure is in the host-side Playwright web server and the error references Turbopack cache corruption, clear the generated cache with `rm -rf .next`.
4. Re-run either the host-side `npm run e2e` flow or the compose Playwright workflow depending on the failing environment. If you changed Playwright assertions around `/sources`, reseed first with `npm run db:seed` so duplicate-sensitive CSV checks start from a known state.

## Operational Gaps

This Phase 0 runbook does not yet cover:

- auth or session recovery
- connector credential storage or rotation
- queue drains or retriable jobs
- connector outage handling
- incident management beyond local development failures

Those procedures must be added as the corresponding checklist items are implemented.
