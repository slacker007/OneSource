# OneSource Testing Guide

## Purpose

This document records the canonical verification workflows for the repo as of the current Phase 2 auth, authz, audit, and admin-console baseline. Use these commands instead of ad hoc local setup so the next loop can reproduce the same results without relying on chat history.

## Current Coverage

- Unit tests: Vitest with Testing Library for UI, runtime helpers, Auth.js callback behavior, credential authentication, password verification, typed repository mapping, permission-policy coverage, admin-console rendering, audit payload shaping, and audited opportunity write flows
- Seed-fixture tests: deterministic multi-source and workspace fixture coverage under `src/lib/opportunities/`
- Browser tests: Playwright Chromium smoke coverage in `tests/`, including redirect-to-sign-in, authenticated-shell access, admin access to the `/settings` admin console, and viewer denial on direct `/settings` navigation
- Schema verification: Prisma validate, migration generation and apply, and seed execution
- Containerized verification: `docker compose` test workflows for lint, build, unit tests, and Chromium end-to-end checks

Integration tests do not exist yet. When database-backed integration tests are added, the compose `test` service is the canonical place to run them because it joins the same network as PostgreSQL and receives the compose-managed `DATABASE_URL`.

## Optional Offline Container Dependency Strategy

Compose builds now default to normal `npm ci`. If the container environment cannot reach the npm registry, you can generate local fallback archives under `vendor/`; those artifacts are intentionally ignored by git and are not part of the committed repo state.

When `vendor/npm-offline-cache.tar.gz` exists locally, the Docker dependency stage unpacks it and runs `npm ci --offline` automatically. When `vendor/prisma-client.tar.gz` exists locally, the same stage overlays that generated Prisma client after install.

Generate or refresh the local fallback archives with the `Makefile` wrapper whenever `package-lock.json` changes or a Docker build needs offline inputs:

```bash
make docker-artifacts
```

## Host Verification Commands

These are useful during local development when the host environment is intentionally bootstrapped:

```bash
npm run prisma:validate
npm run lint
npm test
npm run build
npm run e2e
```

For the current auth and authz slices, the Playwright smoke test is expected to:

- redirect anonymous requests for `/` to `/sign-in`
- submit seeded local credentials through the credentials provider
- land back on the protected shell with the authenticated-session UI visible
- allow the admin user through the restricted `/settings` route and render both assigned-role visibility plus recent audit activity
- redirect the seeded viewer user from `/settings` to `/forbidden`

For the current audit slice, targeted unit verification should confirm:

- the shared audit helper produces append-only `audit_logs` create payloads with actor, target, action, summary, metadata, and occurrence timestamp fields
- the transactional opportunity write service emits audit rows for create, update, delete, import-decision, stage-transition, and bid-decision operations
- update audits persist field-diff metadata rather than only a generic action label

For the current admin-console slice, targeted unit verification should confirm:

- the admin repository maps organization-scoped users with assigned roles into typed read models
- the admin repository maps recent audit rows into stable display fields without exposing raw Prisma records to the page
- the admin console component renders both populated and missing-organization states

When the changed area includes Prisma schema or seed logic, also run:

```bash
docker compose up -d db
npm run prisma:migrate:dev -- --name your_migration_name
npm run db:seed
```

When a schema item depends on seeded relationships, verify the persisted graph directly with a narrow Prisma query before closing the loop.

When the changed area adds typed repository or DTO mapping logic, keep those tests deterministic by injecting a fake database client into the repository module rather than depending on a generated Prisma client in unit-test environments.

For the current seed-data slice, the narrow direct verification query should confirm:

- five canonical opportunities exist across `qualified`, `capture_active`, `proposal_in_development`, `submitted`, and `no_bid`
- the current score or decision outcomes include `GO`, `DEFER`, and `NO_GO`
- the imported `sam.gov` opportunity still retains three tasks, three milestones, two notes, two documents, and three stage transitions
- at least one seeded opportunity has a blocked critical task for dashboard attention states

To point Playwright at an already-running host or compose stack:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npm run e2e
```

## Compose Verification Commands

The compose-managed Playwright workflow does not require a host browser install because it uses the official Playwright image.

Lint:

```bash
make compose-test-lint
```

Unit tests with coverage:

```bash
make compose-test
```

Production build validation:

```bash
make compose-test-build
```

Chromium Playwright against the live compose app:

```bash
make compose-test-e2e
```

The Playwright workflow automatically starts PostgreSQL and the web app, waits for the app health check, then runs Chromium from the dedicated Playwright container.

## Runtime Support Commands

Start the app stack without tests:

```bash
make compose-up-detached
```

Inspect service state:

```bash
docker compose ps
docker compose logs -f web worker
```

Tear down the stack:

```bash
docker compose down
```

## Test Artifacts

- Vitest coverage HTML from host runs: `coverage/index.html`
- Playwright artifacts: `playwright-report/` and `test-results/`

Do not commit generated test artifacts.
