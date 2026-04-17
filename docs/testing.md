# OneSource Testing Guide

## Purpose

This document records the canonical verification workflows for the repo as of the current Phase 1 baseline. Use these commands instead of ad hoc local setup so the next loop can reproduce the same results without relying on chat history.

## Current Coverage

- Unit tests: Vitest with Testing Library for UI, runtime helpers, and typed repository mapping
- Seed-fixture tests: deterministic multi-source and workspace fixture coverage under `src/lib/opportunities/`
- Browser tests: Playwright Chromium smoke coverage in `tests/`
- Schema verification: Prisma validate, migration generation and apply, and seed execution
- Containerized verification: `docker compose` test workflows for lint, build, unit tests, and Chromium end-to-end checks

Integration tests do not exist yet. When database-backed integration tests are added, the compose `test` service is the canonical place to run them because it joins the same network as PostgreSQL and receives the compose-managed `DATABASE_URL`.

## Offline Container Dependency Strategy

Docker containers in this environment still cannot reach `registry.npmjs.org` directly. To keep compose workflows self-sufficient anyway, the repo commits `vendor/npm-offline-cache.tar.gz`, which contains the exact npm tarballs required by the current lockfile on the Linux development target.

Docker builds unpack that archive and run `npm ci --offline`, so compose verification does not require a host-side `node_modules` tree.

The Docker dependency stage also copies `prisma/` plus `prisma.config.ts` before `npm ci` so clean container builds can generate the Prisma client during the offline install step.

Refresh the archive whenever `package-lock.json` changes:

```bash
npm install
npm run cache:npm:refresh
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
docker compose --profile test run --rm --build test run lint
```

Unit tests with coverage:

```bash
docker compose --profile test run --rm --build test
```

Production build validation:

```bash
docker compose --profile test run --rm --build test run build
```

Chromium Playwright against the live compose app:

```bash
docker compose --profile test up --build --abort-on-container-exit --exit-code-from playwright playwright
```

The Playwright workflow automatically starts PostgreSQL and the web app, waits for the app health check, then runs Chromium from the dedicated Playwright container.

## Runtime Support Commands

Start the app stack without tests:

```bash
docker compose up --build -d
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
