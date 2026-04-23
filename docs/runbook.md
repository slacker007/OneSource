# OneSource Runbook

## Purpose

This runbook captures the real operational procedures for the current repo baseline. It now covers the full Phase 0 stack plus the Prisma-backed auth, audit, opportunity, source-lineage, connector-metadata, workspace-execution, and first live auth plus authz slices, and it should be updated as the app gains broader authorization rules, scheduled jobs, and external connectors.

## Current Services

- `web`: Next.js production server on port `3000`
- `db`: PostgreSQL 16 on port `5432`
- `worker`: background process that scans deadline reminders, due `sam.gov` saved searches, queued document parsing work, and stale opportunity scorecards while writing structured summary logs
- `test`: isolated compose test runner in the `onesource-test` project, kept alive for repeated lint, unit, build, migrate, and seed commands through `docker compose exec`
- `playwright`: isolated compose Chromium browser test runner in the `onesource-test` project

## Preconditions

1. Copy the example env file if `.env` does not exist:

```bash
cp .env.example .env
```

2. Host dependency installation is only required for host-run workflows such as `npm run lint`, `npm test`, or `npm run e2e`:

```bash
npm install
```

Compose workflows do not depend on host `node_modules`. Docker images install with normal `npm ci` by default and can fall back to optional local cache directories under `vendor/` when container registry access is unavailable. The canonical entrypoint is now the repo `Makefile`, but the compose targets no longer shell out to host `npm` before they build.

3. When dependency versions change, or when a Docker environment needs offline install inputs and you already have a healthy host install, refresh the optional local fallback caches before rebuilding images:

```bash
make docker-artifacts
```

If local disk space runs low, reclaim repo-local development artifacts with:

```bash
make clean-dev-artifacts
```

This target stops the default and test compose stacks, removes repo-local compose images and volumes, and deletes disposable local artifacts such as `node_modules`, `.next`, coverage output, Playwright reports, `.data/`, `.docker/postgres-data`, generated `*.tsbuildinfo`, and the optional `vendor/npm-offline-cache` plus `vendor/prisma-client` Docker fallback directories. Any legacy `vendor/*.tar.gz` archives are removed too.
This is now the standard end-of-loop cleanup command for the repo, not just an occasional rescue step, because the local environment should be left in a low-disk cold state for the next agent.

4. Configure the `sam.gov` connector mode you intend to operate:

- `SAM_GOV_USE_FIXTURES=true` keeps `/sources` deterministic for automated verification.
- `SAM_GOV_USE_FIXTURES=false` enables live upstream calls.
- `SAM_GOV_API_KEY` is required only for live upstream search execution.
- `SAM_GOV_SEARCH_ENDPOINT` defaults to `https://api.sam.gov/prod/opportunities/v2/search`.
- `SAM_GOV_TIMEOUT_MS` defaults to `15000`.
- `HTTP_PROXY` or `HTTPS_PROXY`, when present, is now honored by the live connector for server-side outbound requests.

## Boot The Default Stack

Bootstrap the default database schema and seed the local workspace before relying on the web and worker services:

Compose-first bootstrap:

```bash
docker compose up -d db
docker compose run --rm --build web npx prisma migrate deploy
docker compose run --rm --build web npm run db:seed
```

If you already have host dependencies installed, the equivalent host-assisted bootstrap is:

```bash
docker compose up -d db
npx prisma migrate deploy
npm run db:seed
```

Then start the full app, database, and worker stack:

```bash
make compose-up
```

Detached mode:

```bash
make compose-up-detached
```

`make compose-up` and `make compose-up-detached` do not run Prisma migrations or seed data for the default stack. On a fresh database, skipping bootstrap commonly surfaces `public.users` or `public.opportunity_tasks` missing-table errors from the auth path and the worker.

## Compose Test Stack

The canonical containerized verification workflow now runs through the isolated `onesource-test` compose project:

```bash
make compose-test-lint
make compose-test
make compose-test-build
make compose-test-e2e
```

Operational details:

- `make compose-test-lint`, `make compose-test`, `make compose-test-build`, and `make compose-test-bootstrap` reuse a persistent bind-mounted `test` container and a named `node_modules` volume through `docker compose exec`, so repeated verification does not rebuild the test image every time.
- `make compose-test-image` is the explicit test-runner rebuild path when Docker inputs or dependency inputs changed and the baked runner must be refreshed on purpose.
- `make compose-test-e2e` still starts by stopping the default compose stack, then boots the isolated browser path. Restore the live stack afterward if it must remain available:

```bash
docker compose run --rm --build web npx prisma migrate deploy
docker compose run --rm --build web npm run db:seed
docker compose up --build -d web worker
curl http://127.0.0.1:3000/api/health
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
  "checkedAt": "2026-04-18T00:00:00.000Z",
  "service": "web",
  "uptimeSeconds": 120,
  "environment": {
    "nodeEnv": "development",
    "samGovFixtureMode": false
  },
  "database": {
    "ok": true,
    "checkedAt": "2026-04-18T00:00:00.000Z",
    "latencyMs": 12
  },
  "documentStorage": {
    "ok": true,
    "checkedAt": "2026-04-18T00:00:00.000Z",
    "metadata": {
      "storageRoot": "/app/.data/opportunity-documents"
    }
  }
}
```

If PostgreSQL or the configured document-storage root is unavailable, the route returns HTTP `503` with `status: "degraded"` and the failing dependency details.
The current health route checks database reachability and document-storage readiness only. It does not confirm that every Prisma-managed table exists, so a freshly created but unmigrated database can still return `status: "ok"` while application queries fail on missing relations.

## Prisma Workflows

Validate the schema:

```bash
npm run prisma:validate
```

Apply the checked-in migration set to the current database:

```bash
npx prisma migrate deploy
```

Create and apply a development migration against the running PostgreSQL instance:

```bash
npm run prisma:migrate:dev -- --name your_migration_name
```

Apply the current seed defaults:

```bash
npm run db:seed
```

The current seed is idempotent enough for local development. It upserts the default organization, system roles, and seven realistic local users; persists one organization scoring profile with target NAICS codes, focus agencies, relationship agencies, capability inventory rows, certification rows, selected vehicles, and six weighted scoring criteria; persists five agencies, five contract vehicles, and five competitors; creates connector configs for `sam.gov`, `usaspending_api`, `gsa_ebuy`, and `csv_upload`; seeds one imported `sam.gov` opportunity with retained source attachments, contacts, and a create-opportunity import decision already in `capture_active`; seeds one `usaspending_api` award-enrichment record linked to the same opportunity with an award child row and a link-to-existing import decision; seeds four additional manual opportunities across `qualified`, `proposal_in_development`, `submitted`, and `no_bid`; seeds realistic workspace data with varied tasks, milestones, notes, documents, stage transitions, scorecards, bid decisions, closeouts, proposal tracking records, proposal checklist items, proposal-linked documents, activity events, retained extracted text, queued extraction status, and local-disk document paths; then runs the same deadline-reminder sweep used by the worker so the app opens with truthful overdue and upcoming reminder state before appending the bootstrap audit-log record.

The same seed also writes deterministic local password hashes for all seven users so the credentials-provider sign-in flow works immediately in development. Use the admin email `admin@onesource.local` or the viewer email `avery.stone@onesource.local` plus the shared local development password `LocalDevOnly!123`, documented in [src/lib/auth/local-demo-auth.mjs](/Users/maverick/Documents/RalphLoops/OneSource/src/lib/auth/local-demo-auth.mjs:1), for smoke verification only.

## Disposable Local Reset And Reseed

When the local stack needs to return to the deterministic baseline, use this exact recovery flow:

```bash
docker compose down -v --remove-orphans
rm -rf .data/opportunity-documents
mkdir -p .data/opportunity-documents
docker compose up -d db
docker compose run --rm --build web npx prisma migrate deploy
docker compose run --rm --build web npm run db:seed
make compose-up-detached
curl http://127.0.0.1:3000/api/health
```

Use this flow before browser reruns when the shared seed has been heavily mutated, and use it immediately if the disposable compose PostgreSQL volume starts surfacing `XX000 unexpected data beyond EOF` or similar corruption faults on this machine.

If the goal is disk reclamation rather than a deterministic reset, prefer `make clean-dev-artifacts`; that broader cleanup also removes host dependencies, reports, caches, and compose images.
After a routine successful loop, prefer `make clean-dev-artifacts` over ad hoc manual deletion so the cleanup scope stays consistent and documented.

After a reset, reseed, or manual user-status change, older JWT session cookies may no longer map to an active seeded user. The app now treats that as an invalid session and redirects the next authenticated request back to `/sign-in` instead of attempting authenticated writes with a stale user ID. If `/sources` or another protected route suddenly returns you to sign-in after a reset, sign in again rather than reusing the old browser session.

## Document Storage

- Opportunity document uploads are stored on local disk beneath `DOCUMENT_UPLOAD_DIR`, which defaults to `.data/opportunity-documents`.
- The upload flow writes the file first, then persists `opportunity_documents` metadata including checksum, file size, mime type, extraction status, and extracted text when extraction has already succeeded.
- Stored files are served back through `GET /api/opportunities/documents/[documentId]/download`, which rechecks authentication and organization scope before returning the file or redirecting to an external source URL.
- Supported UTF-8 text-like uploads such as `.txt`, `.md`, `.csv`, `.json`, `.xml`, `.yaml`, and HTML are now persisted as `PENDING` extraction work and are parsed asynchronously by the document-parsing job. Binary or unsupported formats are stored with `NOT_REQUESTED`.
- The document-parsing job retries pending local-disk documents up to `DOCUMENT_PARSER_MAX_ATTEMPTS`, then leaves the document in a failed state for operator review if extraction never succeeds.
- Local uploads live under `.data/`, which is ignored by git. Remove that directory manually if you need to reset stored development artifacts.

## Background Job Commands

Run the same one-shot sweeps the worker uses:

```bash
npm run job:deadline-reminders
SAM_GOV_USE_FIXTURES=true npm run job:source-sync
npm run job:document-parse
npm run job:scorecards
```

Operational notes:

- `job:source-sync` currently executes only saved searches whose `sourceSystem` is `sam_gov`. Saved searches for future connectors are skipped with a warning and counted as failed runs until those connector implementations exist.
- `job:document-parse` processes pending or previously failed local documents in batch order, updates extraction status, and appends audit plus workspace activity evidence on success.
- `job:scorecards` recalculates only stale or missing-current scorecards, so reruns are intentionally idempotent and should quickly converge to mostly skipped work.
- The long-running `npm run worker` process runs all four sweeps on each polling interval instead of requiring manual invocation.

To inspect the seeded opportunity portfolio directly:

```bash
node --input-type=module -e 'import { PrismaClient } from "@prisma/client"; const prisma = new PrismaClient(); const summary = await prisma.opportunity.findMany({ orderBy: { title: "asc" }, select: { title: true, currentStageKey: true, leadAgency: { select: { name: true } }, scorecards: { where: { isCurrent: true }, take: 1, select: { recommendationOutcome: true, totalScore: true } }, bidDecisions: { where: { isCurrent: true }, take: 1, select: { finalOutcome: true } }, tasks: { orderBy: { dueAt: "asc" }, take: 2, select: { title: true, status: true } } } }); console.log(JSON.stringify(summary, null, 2)); await prisma.$disconnect();'
```

## Logs

Follow the web and worker logs:

```bash
docker compose logs -f web worker
```

Web and worker logs are structured JSON with:

- `timestamp`
- `service`
- `level`
- `message`
- optional `detail`

Web-route failure logs currently cover degraded health checks plus document-download authentication, authorization, missing-record, and local-disk read failures.

The reminder and worker summaries currently include:

- `scannedTaskCount`
- `scannedMilestoneCount`
- `taskReminderUpdates`
- `milestoneReminderUpdates`
- `upcomingTaskCount`
- `overdueTaskCount`
- `upcomingMilestoneCount`
- `overdueMilestoneCount`
- `queuedSavedSearches`
- `processedRuns`
- `succeededRuns`
- `failedRuns`
- `processedDocuments`
- `succeededDocuments`
- `failedDocuments`
- `processedOpportunities`
- `recalculatedOpportunities`
- `skippedOpportunities`

## SAM.gov Connector Operations

- The `/sources` search surface now runs through a reusable `sam.gov` connector that can execute in either live or deterministic fixture mode.
- Fixture mode is the canonical setting for automated host and compose verification because it avoids flaky upstream credentials, latency, and result drift.
- Live mode requires `SAM_GOV_API_KEY` and should be used for exploratory operator testing, dated operator re-verification, or future scheduled-ingestion work.
- Search executions persist outbound request envelopes plus normalized `source_records` and normalized attachment/contact/award child rows, so preview and import actions operate on retained lineage data rather than transient page-local IDs.
- Scheduled source sync now reuses the same connector boundary through the worker and `job:source-sync`, creating `source_sync_runs` plus fresh `source_search_executions` for due saved searches.
- The guarded `/settings` admin console now reads source connector health, recent sync runs, failed import review items, and last-success metadata from retained sync history so operators can inspect source posture without querying the database directly.
- When a saved search is retryable, `/settings` exposes a `Retry sync` control that requeues the search for the next worker sweep by clearing `lastSyncedAt` through the guarded settings server action.
- Dated live verification evidence now exists for the real connector path: on `2026-04-19`, a credentialed `/sources` search located live notice `f40018c4e8394c98af3555e336a149f8`, the retained preview rendered from persisted lineage data, and the import action created a new tracked opportunity from that record.

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

If you need the disposable compose test database migrated and seeded without launching Chromium yet, run:

```bash
make compose-test-bootstrap
```

The Playwright container waits for the `web` health check before running tests. Browser execution is intentionally serialized because the smoke suite mutates one shared seeded database, and the compose browser path now runs `prisma migrate deploy` plus `npm run db:seed` inside the disposable `test` container before Chromium starts.
The `make compose-test*` targets force `SAM_GOV_USE_FIXTURES=true` so connector-backed `/sources` verification stays deterministic.

## Manual Runtime Validation

Healthy runtime snapshot:

```bash
curl http://127.0.0.1:3000/api/health
```

Unauthenticated operational error path:

```bash
curl -i http://127.0.0.1:3000/api/opportunities/documents/not-a-real-id/download
```

Expected result: HTTP `401` with JSON `{"error":"Authentication is required."}` and a structured warning log in the web container output.

## Auth And Authz Smoke Check

To verify the protected-route auth and authz slices manually after the stack is running:

1. Open `http://127.0.0.1:3000/`.
2. Confirm the app redirects to `/sign-in`.
3. Sign in with the seeded admin email `admin@onesource.local` and the shared local development password.
4. Confirm the protected shell renders, the sign-out control is visible, and the admin-console link is shown.
5. Open `/settings` and confirm the admin console renders for the admin user with the `Source sync observability`, `Organization scoring profile`, `Assigned roles`, and `Recent audit activity` sections visible.
6. To recalibrate scoring, stay on `/settings`, review the `Scoring recalibration` section, then either submit `Apply observed-outcome suggestions` or enter manual thresholds and factor weights before saving. A successful save should show a new scoring-model version and a recalculated-scorecard notice.
7. If host-started or compose-managed Playwright browser runs surface PostgreSQL `XX000 unexpected data beyond EOF` errors on this machine, repeat the `Disposable Local Reset And Reseed` flow before retrying so Docker recreates the disposable PostgreSQL volume from scratch.
8. In the `Source sync observability` section, confirm the seeded `SAM.gov` rate-limited connector row, recent sync failure row, and failed import review row are all visible.
9. Use one `Retry sync` control and confirm the page reloads with the queued success notice: `The saved search retry has been queued for the next sync sweep.`
10. Sign out, sign back in as `avery.stone@onesource.local`, navigate directly to `/settings`, and confirm the app redirects to `/forbidden`.

## Host Verification Commands

These remain useful for faster local feedback:

```bash
npm run lint
npm test
npm run build
npm run e2e
SAM_GOV_USE_FIXTURES=true npm run job:source-sync
npm run job:document-parse
npm run job:scorecards
```

To target an already-running app instance:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npm run e2e
```

## Pilot Deployment

For the current repo, deployment readiness means a compose-managed internal pilot rather than a hosted multi-environment platform rollout.

1. Prepare env vars and writable persistence paths.
2. Start PostgreSQL with `docker compose up -d db`.
3. Apply migrations with `docker compose run --rm --build web npx prisma migrate deploy`.
4. Seed only when intentionally bootstrapping a disposable or demo environment, using `docker compose run --rm --build web npm run db:seed`.
5. Start the stack with `make compose-up-detached`.
6. Validate `curl http://127.0.0.1:3000/api/health`.
7. Run `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npm run e2e` or the canonical `make compose-test-e2e`.

See [docs/deployment.md](/Users/maverick/Documents/RalphLoops/OneSource/docs/deployment.md) for the durable deployment checklist and rollback guidance.

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
- error references `DEADLINE_REMINDER_LOOKAHEAD_DAYS`, `SOURCE_SYNC_INTERVAL_MINUTES`, `SOURCE_SYNC_BATCH_SIZE`, `DOCUMENT_PARSER_BATCH_SIZE`, `DOCUMENT_PARSER_MAX_ATTEMPTS`, or `OPPORTUNITY_SCORECARD_BATCH_SIZE`

Recovery:

1. Check `.env` against `.env.example`.
2. Ensure `DATABASE_URL` uses `postgres://` or `postgresql://`.
3. Ensure `AUTH_SECRET` is at least 32 characters, `NEXTAUTH_URL` is an absolute URL, `DEADLINE_REMINDER_LOOKAHEAD_DAYS`, `SOURCE_SYNC_INTERVAL_MINUTES`, `SOURCE_SYNC_BATCH_SIZE`, `DOCUMENT_PARSER_BATCH_SIZE`, and `OPPORTUNITY_SCORECARD_BATCH_SIZE` are positive integers, and `DOCUMENT_PARSER_MAX_ATTEMPTS` is at least `1`.
4. Restart the stack with `make compose-up`.

### Database Unhealthy

Symptoms:

- `docker compose ps` shows `db` unhealthy
- `/api/health` returns `503`
- worker logs report reminder, source-sync, document-parsing, or scorecard sweep failures

Recovery:

1. Inspect database logs with `docker compose logs db`.
2. Confirm `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` match the composed `DATABASE_URL`.
3. If the local data directory is intentionally disposable and corrupted, run the `Disposable Local Reset And Reseed` flow above.

### Missing Prisma Tables Or Unbootstrapped Schema

Symptoms:

- web logs show `Invalid prisma.user.findUnique()` followed by `The table public.users does not exist in the current database`
- PostgreSQL logs show `relation "public.opportunity_tasks" does not exist`
- worker logs fail early on task, reminder, or scorecard queries
- `/api/health` may still return `200` with `status: "ok"` because connectivity is healthy even though schema bootstrap is missing

Recovery:

1. If the current database should be preserved, apply the checked-in migrations and seed against the running compose database:

```bash
docker compose run --rm --build web npx prisma migrate deploy
docker compose run --rm --build web npm run db:seed
docker compose restart web worker
```

2. If the local database is disposable or may be corrupted, run the full `Disposable Local Reset And Reseed` flow instead.
3. After reseeding, sign in again. Older JWT session cookies may no longer map to the current seeded user rows.

### Background Job Warnings Or Failures

Symptoms:

- `job:source-sync` reports `failedRuns`
- `job:document-parse` reports failed documents or repeated retries
- `job:scorecards` exits unexpectedly

Recovery:

1. Inspect `docker compose logs worker` or rerun the failing one-shot job directly to capture structured JSON output.
2. For `job:source-sync`, confirm the saved search uses `sourceSystem = "sam_gov"` today and that `SAM_GOV_USE_FIXTURES` or `SAM_GOV_API_KEY` is set appropriately for the intended mode.
3. For `job:document-parse`, verify the file still exists under `DOCUMENT_UPLOAD_DIR` and that the document mime type is one of the supported text-like formats.
4. For `job:scorecards`, rerun `npm run db:seed` if the local seed graph is intentionally being reset, then rerun the job to confirm the stale-scorecard condition is reproducible.

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
- `npm ci --offline` reports a missing cached tarball or cache entry when using local fallback caches

Recovery:

1. If the environment should support online installs, confirm the container runtime can reach the npm registry and re-run the compose command.
2. If the environment needs offline inputs, regenerate the local fallback caches with `make docker-artifacts`.
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
4. Re-run either the host-side `npm run e2e` flow or the compose Playwright workflow depending on the failing environment. If you changed Playwright assertions around `/sources`, reseed first with `npm run db:seed` for host-side reruns or use `make compose-test-bootstrap` for the disposable compose stack.

## Operational Gaps

This Phase 0 runbook does not yet cover:

- auth or session recovery
- connector credential storage or rotation
- queue drains or retriable jobs
- connector outage handling
- incident management beyond local development failures

Those procedures must be added as the corresponding checklist items are implemented.
