# OneSource

OneSource is a capture intelligence platform for government contracting teams. The repo now has the full Phase 0 scaffold, all current Phase 1 foundation slices, the first four Phase 2 access-control and auditability slices, the full current Phase 3 baseline, and the first four Phase 4 slices: a Next.js app with TypeScript, Tailwind CSS, ESLint, Prettier, Vitest, Playwright, PostgreSQL, Prisma ORM, Auth.js credentials sign-in, a shared authenticated app shell with responsive navigation, a reusable UI-pattern kit for tables, forms, badges, drawers, dialogs, empty states, and error states, a real dashboard landing page backed by typed Prisma queries, a real opportunities list with URL-synced filters and pagination, create and edit flows for tracked opportunities with server validation plus browser-local draft autosave, a real external source search page with typed `sam.gov`-style filters and mocked connector responses, server-guarded source-result preview and import actions with duplicate detection, protected routes, role-based permission helpers, a server-guarded admin console for role visibility and audit inspection, auth and audit tables, opportunity and source-lineage schema, source connector metadata and multi-source import-decision persistence, opportunity workspace execution persistence, typed opportunity, source-integration, and admin modules, transactional opportunity write services with built-in audit emission, expanded realistic demo seed data, boot-time environment validation, and a placeholder worker process.

## Current Status

- Product intent is defined in `SPEC.md`.
- Implementation scope, checklist sequencing, and current handoff state live in `PRD.md`.
- Engineering and verification rules live in `AGENTS.md`.
- Active loop notes and crash-recovery context live in `NOTES.md`.
- `P0-01`, `P0-02`, `P0-02a`, `P0-03`, `P0-04`, `P1-01`, `P1-02`, `P1-02a`, `P1-03`, `P1-04`, `P1-05`, `P2-01`, `P2-02`, `P2-03`, `P2-04`, `P3-01`, `P3-02`, `P3-03`, `P4-01`, `P4-01a`, `P4-01b`, and `P4-02` are complete.
- The next recommended item is `P4-03`, which adds the opportunity detail workspace.

## Stack In Repo Today

- Next.js 16 App Router
- TypeScript
- Tailwind CSS 4
- PostgreSQL 16
- Prisma ORM 6 with Prisma Client and migrations
- Auth.js 4 with a credentials provider for local seeded users
- ESLint 9 with Next.js config
- Prettier 3 with Tailwind plugin
- Vitest + Testing Library
- Playwright for Chromium smoke coverage
- Zod environment validation
- A placeholder background worker with database heartbeat logging

## Repository Layout

- `src/app`: Next.js routes, layout, and global styling
- `src/components`: shared and page-specific UI components, including the reusable `ui` primitives and routed source-search surface
- `src/lib`: shared runtime helpers such as env parsing and health checks
- `src/modules/admin`: typed admin read models for user-role visibility and audit-log inspection
- `src/modules/audit`: typed audit-log helpers and stable action names
- `src/modules`: typed domain modules such as the opportunity repository, source-integration search module, and shared DTOs
- `prisma`: Prisma schema, generated migrations, and seed defaults
- `scripts`: runtime helper scripts including the placeholder worker
- `tests`: Playwright browser tests
- `Makefile`: wrapper targets that prepare local Docker cache archives before builds
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

Host dependency installation is not required for compose workflows when Docker can reach the npm registry. In this environment the safer path is to use the `Makefile` wrappers, which prepare local cache archives under `vendor/` before Docker builds:

```bash
make docker-artifacts
```

3. Install the Chromium browser used by host-side Playwright runs:

```bash
npm run e2e:install
```

The compose-managed Playwright workflow uses the official Playwright image and does not need a host browser install.

4. Start the local PostgreSQL, web app, and worker stack:

```bash
make compose-up
```

For a detached stack:

```bash
make compose-up-detached
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

The current seed creates a default organization, the canonical system role set, seven realistic local users spanning admin, executive, BD, capture, proposal, contributor, and viewer roles, deterministic local password hashes for those seeded users, five agencies, five contract vehicles, five competitors, connector configs for `sam.gov`, `usaspending_api`, and `gsa_ebuy`, one imported `sam.gov` opportunity with retained raw and normalized payloads plus attachment and contact child records, one applied import decision that created the canonical opportunity, one `usaspending_api` enrichment search and retained award-centric source record with an applied link-to-existing import decision, and four additional manual opportunities spanning `qualified`, `capture_active`, `proposal_in_development`, `submitted`, and `no_bid` stages with `GO`, `DEFER`, and `NO_GO` score or decision outcomes.

The typed opportunity module under `src/modules/opportunities/` now exposes shared DTOs, dashboard and list read models, a dedicated form-validation boundary, browser-draft helpers, and audited write-service integration for guarded create and edit flows. The typed source-integration module under `src/modules/source-integrations/` now owns canonical external-search query parsing, `sam.gov` request translation, deterministic mocked search responses, source-result preview payload shaping, duplicate detection against existing opportunities, and guarded create-versus-link import application for Phase 4. The typed admin repository under `src/modules/admin/` exposes organization-scoped user-role visibility plus recent audit-log inspection for the guarded `/settings` route. The authenticated `(app)` route group now renders through a shared shell with a desktop sidebar, sticky top bar, read-only global search placeholder, and reusable mobile navigation drawer. The `/` dashboard route now renders a real landing page with tracked and active pursuit counts, stage distribution, upcoming deadlines, and ranked opportunities from seeded data. The `/opportunities` route now renders a real opportunity pipeline page with keyword search, agency/NAICS/stage/source/due-date filters, sort controls, pagination, URL-synced query state, a create entry point, and per-row edit links; `/opportunities/new` plus `/opportunities/[opportunityId]/edit` now provide guarded tracked-opportunity forms with server validation and browser-local draft restore. The `/sources` route now hosts a real external-search page with keyword and structured `sam.gov` filters, translated outbound-request visibility, result preview, raw-versus-normalized payload comparison, duplicate-candidate review, and mocked pull-into-pipeline actions, while `/tasks` and `/analytics` remain protected placeholders for later phase work.

## Optional Local Docker Dependency Cache

Developer-generated cache archives under `vendor/` are not committed to the repo. Docker images install dependencies with normal `npm ci` by default, but the build will switch to `npm ci --offline` automatically when `vendor/npm-offline-cache.tar.gz` is present locally.

`make docker-artifacts` is the canonical way to prepare those local archives. It refreshes dependencies when needed, regenerates the Prisma client when needed, and then refreshes both ignored tarballs before Docker builds:

```bash
make docker-artifacts
```

`vendor/prisma-client.tar.gz` is also an optional local artifact. When present, the Docker dependency stage overlays it after install so compose builds can reuse a host-generated Prisma client if the environment needs that fallback.

## Required Environment Variables

- `DATABASE_URL`: postgres connection string used by the app and worker. Required and validated at app boot.
- `AUTH_SECRET`: session-signing secret used by Auth.js. Required and validated at app boot.
- `NEXTAUTH_URL`: absolute base URL for Auth.js callback and redirect handling. Required and validated at app boot.
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
- Compose lint: `make compose-test-lint`
- Compose unit tests with coverage: `make compose-test`
- Compose build validation: `make compose-test-build`
- Compose Chromium smoke test: `make compose-test-e2e`
- Prepare local Docker archives only: `make docker-artifacts`
- Direct Docker image build with prebuild archive refresh: `make docker-build`
- Format check: `npm run format:check`
- Apply formatting: `npm run format`
- Compose stack status: `docker compose ps`
- Compose logs: `docker compose logs -f web worker`
- Compose teardown: `make compose-down`

`npm run e2e` starts the app automatically through the Playwright `webServer` configuration and injects a default local `DATABASE_URL` when one is not already set. When `PLAYWRIGHT_BASE_URL` is provided, Playwright skips the internal web server and targets the existing app instance instead. The current Chromium smoke suite covers the seeded dashboard widgets, the opportunities filter flow, the guarded create-and-edit opportunity flow with browser-local draft restore, the `/sources` external-search flow with mocked connector responses plus preview-and-link import behavior, desktop shell navigation, the small-screen navigation drawer, admin access to `/settings`, and viewer denial on direct `/settings` navigation.

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
8. When the stack is needed, prefer the `make` wrappers such as `make compose-up` and `make compose-test-e2e` so local Docker cache archives are prepared automatically before the build starts.

## Known Gaps

- The authenticated shell, shared UI-pattern kit, seeded dashboard landing page, real opportunity list, tracked-opportunity create/edit forms, real external-search page, protected placeholder sections, and `/settings` admin console now exist, but the opportunity detail workspace plus most remaining Phase 4+ feature modules still need to land behind those routes
- Audit emission now exists in the shared opportunity write-service boundary, but auth events, permission failures, and user-facing mutation routes are not wired to it yet
- No production job runner beyond the placeholder worker heartbeat

Those gaps are intentional scope still tracked in `PRD.md`; this README only documents what exists today.
