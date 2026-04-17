# OneSource

OneSource is a capture intelligence platform for government contracting teams. The repo now has the full Phase 0 scaffold plus the first four Phase 1 data-model slices: a Next.js app with TypeScript, Tailwind CSS, ESLint, Prettier, Vitest, Playwright, PostgreSQL, Prisma ORM, auth and audit tables, opportunity and source-lineage schema, source connector metadata and multi-source import-decision persistence, opportunity workspace execution persistence, boot-time environment validation, a placeholder worker process, and an offline npm cache archive that makes Docker builds self-sufficient in this environment.

## Current Status

- Product intent is defined in `SPEC.md`.
- Implementation scope, checklist sequencing, and current handoff state live in `PRD.md`.
- Engineering and verification rules live in `AGENTS.md`.
- Active loop notes and crash-recovery context live in `NOTES.md`.
- `P0-01`, `P0-02`, `P0-02a`, `P0-03`, `P0-04`, `P1-01`, `P1-02`, `P1-02a`, and `P1-03` are complete.
- The next recommended item is `P1-04`, which adds a typed database access layer and shared domain types on top of the Prisma persistence baseline.

## Stack In Repo Today

- Next.js 16 App Router
- TypeScript
- Tailwind CSS 4
- PostgreSQL 16
- Prisma ORM 6 with Prisma Client and migrations
- ESLint 9 with Next.js config
- Prettier 3 with Tailwind plugin
- Vitest + Testing Library
- Playwright for Chromium smoke coverage
- Zod environment validation
- A placeholder background worker with database heartbeat logging

## Repository Layout

- `src/app`: Next.js routes, layout, and global styling
- `src/components`: shared and page-specific UI components
- `src/lib`: shared runtime helpers such as env parsing and health checks
- `prisma`: Prisma schema, generated migrations, and seed defaults
- `scripts`: runtime helper scripts including the placeholder worker
- `tests`: Playwright browser tests
- `docs/testing.md`: canonical host and compose verification workflows
- `docs/architecture.md`: current system topology, module boundaries, and Phase 0 constraints
- `docs/runbook.md`: operational commands, health checks, and failure recovery notes
- `docs/security.md`: current auth, seed, secret-handling, and audit baseline
- `docs/research`: dated external research notes
- `SPEC.md`: product context and market framing
- `PRD.md`: checklist state, contracts, and handoff
- `AGENTS.md`: operating rules for future loops
- `NOTES.md`: timestamped working notes for the current loop

## Local Setup

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. For host-only development workflows, install dependencies:

```bash
npm install
```

Host dependency installation is not required for the compose-managed runtime or test workflows because Docker builds now use the committed offline npm cache archive at `vendor/npm-offline-cache.tar.gz`.

3. Install the Chromium browser used by host-side Playwright runs:

```bash
npm run e2e:install
```

The compose-managed Playwright workflow uses the official Playwright image and does not need a host browser install.

4. Start the local PostgreSQL, web app, and worker stack:

```bash
docker compose up --build
```

For a detached stack:

```bash
docker compose up --build -d
```

5. Optional: run the app directly on the host instead of through Compose:

```bash
npm run dev
```

The app serves at `http://127.0.0.1:3000`, PostgreSQL is exposed on `127.0.0.1:5432`, and the readiness endpoint is `http://127.0.0.1:3000/api/health`.

## Database Workflow

Validate the Prisma schema:

```bash
npm run prisma:validate
```

Create and apply a development migration:

```bash
npm run prisma:migrate:dev -- --name your_migration_name
```

Seed the baseline auth, opportunity, and lineage data:

```bash
npm run db:seed
```

The current seed creates a default organization, the canonical system role set, a local development admin user at `admin@onesource.local`, one Air Force agency, two contract vehicles, two competitors, connector configs for `sam.gov`, `usaspending_api`, and `gsa_ebuy`, one imported `sam.gov` opportunity with retained raw and normalized payloads plus attachment and contact child records, one applied import decision that created the canonical opportunity, one `usaspending_api` enrichment search and retained award-centric source record with an applied link-to-existing import decision, and one realistic workspace on the canonical opportunity with tasks, milestones, notes, documents, stage transitions, a scorecard with factor rows, a bid decision, and activity events.

## Offline Docker Dependency Cache

This repo includes `vendor/npm-offline-cache.tar.gz`, a curated archive of the npm tarballs needed by the current lockfile on the Linux development target. Docker images install dependencies with `npm ci --offline`, so compose workflows do not depend on a repo-local `node_modules` tree or live npm registry access from containers.

When dependency versions change:

```bash
npm install
npm run cache:npm:refresh
```

Run those commands on the host before rebuilding images so the committed archive stays aligned with `package-lock.json`.

## Required Environment Variables

- `DATABASE_URL`: postgres connection string used by the app and worker. Required and validated at app boot.
- `POSTGRES_DB`: database name for the compose-managed PostgreSQL service.
- `POSTGRES_USER`: database user for the compose-managed PostgreSQL service.
- `POSTGRES_PASSWORD`: database password for the compose-managed PostgreSQL service.
- `WORKER_POLL_INTERVAL_MS`: optional worker heartbeat interval in milliseconds. Defaults to `30000`.

The committed `.env.example` contains the canonical development defaults.

## Verification Commands

- Lint: `npm run lint`
- Prisma schema validation: `npm run prisma:validate`
- Prisma dev migration creation and apply: `npm run prisma:migrate:dev -- --name your_migration_name`
- Prisma seed: `npm run db:seed`
- Unit tests with coverage: `npm test`
- Production build: `npm run build`
- Chromium smoke test with a Playwright-managed local server: `npm run e2e`
- Chromium smoke test against an already-running compose stack: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npm run e2e`
- Compose lint: `docker compose --profile test run --rm --build test run lint`
- Compose unit tests with coverage: `docker compose --profile test run --rm --build test`
- Compose build validation: `docker compose --profile test run --rm --build test run build`
- Compose Chromium smoke test: `docker compose --profile test up --build --abort-on-container-exit --exit-code-from playwright playwright`
- Format check: `npm run format:check`
- Apply formatting: `npm run format`
- Compose stack status: `docker compose ps`
- Compose logs: `docker compose logs -f web worker`
- Compose teardown: `docker compose down`

`npm run e2e` starts the app automatically through the Playwright `webServer` configuration and injects a default local `DATABASE_URL` when one is not already set. When `PLAYWRIGHT_BASE_URL` is provided, Playwright skips the internal web server and targets the existing app instance instead.

See `docs/testing.md` for the durable verification workflow.
See `docs/architecture.md`, `docs/runbook.md`, and `docs/security.md` for the current system design, operator procedures, and security baseline.

## Current Workflow

The canonical loop is now:

1. Read `SPEC.md`, `PRD.md`, `AGENTS.md`, `README.md`, and `NOTES.md`.
2. Inspect `git status`.
3. Copy `.env.example` to `.env` if local env config is missing.
4. Select one unchecked PRD item.
5. Append timestamped task notes to `NOTES.md` during the loop.
6. Update durable docs in the same loop whenever setup, behavior, or requirements change.
7. Run the narrowest relevant verification, and for code changes also run the full automated suite currently available in the repo.
8. When the stack is needed, prefer `docker compose up --build` and a compose-backed Playwright smoke run.

## Known Gaps

- No Auth.js runtime, protected routes, or server-side authorization enforcement yet
- No typed domain access layer over the Prisma models yet
- No production job runner beyond the placeholder worker heartbeat

Those gaps are intentional scope still tracked in `PRD.md`; this README only documents what exists today.
