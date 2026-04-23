# OneSource

OneSource is a capture intelligence platform for government contracting teams. This repo is a modular-monolith Next.js application with a PostgreSQL-backed domain model, a background worker, `sam.gov` source search and import flows, deterministic scoring, audit-backed workspace mutations, and a Material UI-first operator interface.

Current repo status:

- Product checklist phases `P0-01` through `P10-04` are complete.
- Deferred follow-up `FP-01` is complete.
- The post-project UI programs are complete through `UI-13` and `MUI-20`.
- The active UI runtime is Material UI-first, with `src/app/tailwind-freeze.css` retained only as a compatibility stylesheet for remaining legacy selectors.

## Stack

- Next.js 16 App Router
- TypeScript
- React 19
- Material UI 9 with app-owned wrapper components
- PostgreSQL 16
- Prisma 6
- Auth.js 4 credentials-based local auth
- Vitest + Testing Library
- Playwright Chromium smoke coverage
- Docker Compose for app, database, worker, and test workflows

## What Runs Today

The repo includes these main product surfaces:

- `/sign-in` and `/forbidden`
- `/` dashboard command center
- `/opportunities` list, create, edit, and workspace routes
- `/sources` external discovery plus CSV intake
- `/tasks` personal execution queue
- `/knowledge` library plus create and edit flows
- `/analytics` decision console
- `/settings` operations workspace
- `/settings/users` users-and-roles workspace
- `/api/health` runtime health endpoint

Runtime services:

- `web`: Next.js production server on port `3000`
- `db`: PostgreSQL 16 on port `5432`
- `worker`: reminder, source-sync, document-parse, and scorecard sweeps
- `test` and `playwright`: isolated compose-test services in `docker-compose.test.yml`

## Repository Layout

- `src/app`: routes, layouts, API handlers, and route-level boundaries
- `src/components`: routed UI plus shared UI primitives
- `src/lib`: runtime helpers, auth helpers, observability, and tooling helpers
- `src/modules`: typed domain modules for opportunities, source integrations, admin, knowledge, shell, and integrations
- `prisma`: schema, migrations, and seed logic
- `scripts`: worker entrypoints and repo tooling scripts
- `tests`: Playwright smoke coverage
- `docs`: architecture, runbook, testing, security, deployment, ADRs, and research notes

## Quick Start

1. Copy the development environment file:

```bash
cp .env.example .env
```

2. Install host dependencies only if you plan to run host-side commands such as `npm run lint`, `npm test`, or `npm run e2e`:

```bash
npm install
```

3. Bootstrap the database schema and seed data:

Compose-first bootstrap:

```bash
docker compose up -d db
docker compose run --rm --build web npx prisma migrate deploy
docker compose run --rm --build web npm run db:seed
```

If you already installed host dependencies, the host-assisted equivalent is:

```bash
docker compose up -d db
npx prisma migrate deploy
npm run db:seed
```

4. Start the default app stack:

```bash
make compose-up
```

Detached mode:

```bash
make compose-up-detached
```

The app serves at `http://127.0.0.1:3000`. PostgreSQL is exposed at `127.0.0.1:5432`.

## Seeded Local Credentials

Use these for local development only:

- admin: `admin@onesource.local`
- viewer: `avery.stone@onesource.local`
- password: `LocalDevOnly!123`

The seed also creates additional executive, business development, capture, proposal, and contributor users.

## Common Workflows

### Host-side development

Start the app directly on the host:

```bash
npm run dev
```

Run the worker on the host:

```bash
npm run worker
```

### Prisma

Validate the schema:

```bash
npm run prisma:validate
```

Create a development migration:

```bash
npm run prisma:migrate:dev -- --name your_migration_name
```

Apply checked-in migrations:

```bash
npx prisma migrate deploy
```

Reseed development data:

```bash
npm run db:seed
```

### Verification

Host-side commands:

```bash
npm run lint
npm test
npm run build
npm run e2e
SAM_GOV_USE_FIXTURES=true npm run e2e
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npm run e2e
```

Compose-backed commands:

```bash
make compose-test-lint
make compose-test
make compose-test-build
make compose-test-bootstrap
make compose-test-e2e
```

Other useful commands:

```bash
make docker-build
make docker-artifacts
make compose-down
make clean-dev-artifacts
```

### Background jobs

Run the same one-shot sweeps the worker uses:

```bash
npm run job:deadline-reminders
SAM_GOV_USE_FIXTURES=true npm run job:source-sync
npm run job:document-parse
npm run job:scorecards
```

## Dev Containers And Codespaces

The repo includes a checked-in `.devcontainer/` baseline for local Dev Containers and GitHub Codespaces.

It provides:

- Node 20 on Debian Bookworm
- Docker CLI and Compose access
- GitHub CLI
- PostgreSQL client tools
- Codex CLI installed from `@openai/codex`

The post-create bootstrap copies `.env.example` to `.env` when needed, runs `npm ci`, generates Prisma client code, and installs Playwright Chromium.

Recommended first-run commands inside the container:

```bash
docker compose up -d db
npx prisma migrate deploy
npm run db:seed
```

After that, use the same host or compose workflows documented in this README.

## Environment Variables

Required at runtime:

- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXTAUTH_URL`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

Common optional runtime settings:

- `DOCUMENT_UPLOAD_DIR`
- `SAM_GOV_API_KEY`
- `SAM_GOV_SEARCH_ENDPOINT`
- `SAM_GOV_TIMEOUT_MS`
- `SAM_GOV_USE_FIXTURES`
- `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY`
- `WORKER_POLL_INTERVAL_MS`
- `DEADLINE_REMINDER_LOOKAHEAD_DAYS`
- `SOURCE_SYNC_INTERVAL_MINUTES`
- `SOURCE_SYNC_BATCH_SIZE`
- `DOCUMENT_PARSER_BATCH_SIZE`
- `DOCUMENT_PARSER_MAX_ATTEMPTS`
- `OPPORTUNITY_SCORECARD_BATCH_SIZE`

Docker build fallback settings:

- `CONTAINER_TRUST_PROXY_CA`
- `CONTAINER_PROXY_CA_ENDPOINT`

The committed `.env.example` is the canonical development baseline.

## Operational Notes

- `make compose-up` and `make compose-up-detached` do not run migrations or seed data for you.
- `make compose-test-e2e` stops the default compose stack before booting the isolated browser-test stack.
- `/api/health` checks database reachability and document-storage readiness, but it does not prove the Prisma schema has been applied.
- `make clean-dev-artifacts` is the repo-standard cleanup command for removing repo-local build outputs, reports, caches, dependency installs, local uploads, and compose artifacts after a finished loop.
- Optional local Docker fallback caches live under `vendor/` and can be refreshed with `make docker-artifacts`.

## More Documentation

- `PRD.md`: implementation scope, checklist state, and current handoff
- `AGENTS.md`: repo operating rules for future coding loops
- `NOTES.md`: timestamped loop notes and recovery context
- `docs/architecture.md`: current system architecture and module boundaries
- `docs/runbook.md`: operational procedures and reset flows
- `docs/testing.md`: testing and verification workflows
- `docs/security.md`: auth, audit, and secret-handling baseline
- `docs/deployment.md`: internal-pilot deployment notes
