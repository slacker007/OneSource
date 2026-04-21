# OneSource

OneSource is a capture intelligence platform for government contracting teams. The repo now has the full Phase 0 scaffold, all current Phase 1 foundation slices, the first four Phase 2 access-control and auditability slices, the full current Phase 3 baseline, the full current Phase 4 baseline, the full current Phase 5 collaboration baseline, the full current Phase 6 scoring baseline, the full current Phase 7 intake baseline, the full current Phase 8 knowledge baseline, the full current Phase 9 analytics-and-feedback baseline, the full Phase 10 proposal, integration, observability, and launch-hardening baseline, the completed UI refactor through `UI-13`, and the first five Material UI migration slices through `MUI-05`: a Next.js app with TypeScript, a temporary hybrid Tailwind plus Material UI foundation, an app-owned MUI wrapper layer for common interactive and feedback primitives, ESLint, Prettier, Vitest, Playwright, PostgreSQL, Prisma ORM, Auth.js credentials sign-in, a shared authenticated app shell with grouped navigation, shell-level quick links, keyboard-accessible command search, pinned-work and recent-work persistence, shell notification review, and responsive desktop-collapse plus mobile-drawer behavior, a reusable UI-pattern kit for tables, forms, badges, drawers, dialogs, empty states, error states, loading surfaces, and transient action feedback, reusable public and authenticated route error boundaries, MUI-backed public auth framing for `/sign-in` and `/forbidden`, a real dashboard landing page backed by typed Prisma queries that now foregrounds the attention queue, top pursuits, upcoming deadlines, task burden, pipeline risk, and recent source activity, a real opportunities list that now combines URL-synced filters, URL-backed saved views, a sticky desktop filter rail, a mobile filter drawer, server-backed sort links, result counts, and a preview-first detail panel, a real opportunity workspace route that now renders through a breadcrumb header plus local section navigation for `Summary`, `Capture`, `Tasks`, `Documents`, `Notes`, `Proposal`, and `History` while preserving the existing guarded stage-transition controls, in-workspace knowledge suggestions, task CRUD, milestone CRUD, guarded note creation with workspace activity entries, guarded document upload plus local download support with stored metadata and queued extraction status for supported text-like files, a guarded final-decision form with decision history inside the scoring panel, a guarded closeout manager for closed opportunities with outcome reason, competitor, and lessons learned fields, proposal tracking with status, owner, compliance checklist, and linked workspace documents, a real `/analytics` decision console that now pairs the ranking queue with denser portfolio comparison modules for decision posture, score bands, funnel conversion, active-stage aging, and effort-versus-outcome drill-through, persisted deadline reminder and overdue state for tasks plus milestones, create and edit flows for tracked opportunities with server validation plus browser-local draft autosave, and a refactored `/sources` discovery workspace that now adds connector tabs, visible saved-search re-entry, collapsible advanced filters, active-filter chips, denser result scanning, translated outbound-query visibility, inline duplicate-status messaging, a right-rail import preview, persisted search-execution and source-record lineage, server-side exact and fuzzy duplicate canonicalization that merges strong duplicate source imports into one tracked opportunity while preserving lineage, and a real CSV import workspace with header mapping, preview, validation, and conservative deduplication. The repo also includes a real personal `/tasks` queue for assigned execution work, a preview-first `/knowledge` asset browser with asset-type views, a sticky taxonomy filter rail, URL-backed preview selection, richer linked-pursuit visibility, and one-click reusable-content copy beside the existing guarded create/edit flows for past-performance snippets, boilerplate content, and win themes, protected routes, role-based permission helpers, a server-guarded workspace settings surface for operator briefing, connector operations, saved-search registry, role coverage, audit inspection, retry queueing, and organization scoring-profile visibility, auth and audit tables, opportunity and source-lineage schema, source connector metadata and multi-source import-decision persistence, opportunity closeout persistence for postmortem capture, proposal persistence for owner, status, checklist, and document lineage, knowledge-asset persistence with typed freeform and structured retrieval tags, opportunity workspace execution persistence, organization scoring-profile persistence for capabilities, certifications, selected vehicles, weighted criteria, and recommendation thresholds, a deterministic opportunity scoring engine with factor-level explanations, deterministic `GO`/`DEFER`/`NO_GO` recommendation output, repository fallback calculation, typed opportunity, source-integration, admin, knowledge, shell, and cross-system integration modules, transactional opportunity, proposal, task, milestone, note, document, bid-decision, and closeout write services with built-in audit emission, deterministic dry-run integration adapters for CRM, document-repository, and communication boundaries, structured JSON logging shared by the web app and worker, a multi-signal `/api/health` runtime snapshot, explicit internal-pilot deployment docs, a documented reset-and-reseed recovery flow, expanded realistic demo seed data, boot-time environment validation, and a real background worker that sweeps reminders, scheduled source syncs, document parsing retries, and stale opportunity scorecards on an interval. The active MUI migration layer now includes the official Next.js App Router cache integration, a shared OneSource theme, app-owned wrapper primitives, the shared public access shell for auth and denied states, the fully MUI-backed authenticated shell, the shared MUI state-feedback system for empty/loading/error/permission/transient states, and the route-by-route migration backlog that remains in progress.

## Current Status

- Product intent is defined in `SPEC.md`.
- Implementation scope, checklist sequencing, and current handoff state live in `PRD.md`.
- Engineering and verification rules live in `AGENTS.md`.
- Active loop notes and crash-recovery context live in `NOTES.md`.
- `P0-01` through `P10-04` are complete, the MVP, Beta, and Pilot release gates in `PRD.md` are met, and deferred follow-on `FP-01` remains complete.
- The post-completion UI refactor program is complete. `UI-01` through `UI-13` are complete in `PRD.md`.
- The post-completion Material UI refactor program is now active. `MUI-01` establishes the root MUI foundation, `MUI-02` establishes the shared wrapper layer and first live route migration on `/sign-in`, `MUI-03` completes the authenticated shell migration, `MUI-04` completes the public auth and denied-surface migration, `MUI-05` standardizes shared state and transient feedback patterns, and `MUI-06` through `MUI-14` remain queued in `PRD.md` and GitHub epic `#15`.

## Stack In Repo Today

- Next.js 16 App Router
- TypeScript
- Material UI 9 with Emotion and the official Next.js App Router integration package
- MUI X Data Grid (community tier)
- Tailwind CSS 4
- PostgreSQL 16
- Prisma ORM 6 with Prisma Client and migrations
- Auth.js 4 with a credentials provider for local seeded users
- ESLint 9 with Next.js config
- Prettier 3 with Tailwind plugin
- Vitest + Testing Library
- Playwright for Chromium smoke coverage
- Zod environment validation
- A background worker that scans reminders, due `sam.gov` saved searches, queued document parsing work, and stale opportunity scorecards while writing structured job logs

## Repository Layout

- `src/app`: Next.js routes, layout, and global styling
- `src/components`: shared and page-specific UI components, including the reusable `ui` primitives and routed source-search surface
- `src/lib`: shared runtime helpers such as env parsing and health checks
- `src/modules/admin`: typed admin read models for user-role visibility and audit-log inspection
- `src/modules/audit`: typed audit-log helpers and stable action names
- `src/modules`: typed domain modules such as the opportunity repository, source-integration search module, knowledge-asset repository, integration-boundary adapters, and shared DTOs
- `prisma`: Prisma schema, generated migrations, and seed defaults
- `scripts`: runtime helper scripts including the multi-sweep worker, one-shot job entrypoints, and Docker cache helpers
- `tests`: Playwright browser tests
- `Makefile`: wrapper targets for compose workflows, verification, and optional local Docker cache preparation
- `docs/testing.md`: canonical host and compose verification workflows
- `docs/deployment.md`: controlled internal-pilot deployment, rollback, and validation checklist
- `docs/architecture.md`: current system topology, module boundaries, and Phase 0 constraints
- `docs/adr`: durable architecture decision records for high-impact implemented choices
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

Host dependency installation is not required for compose workflows when Docker can reach the npm registry. Optional local fallback cache directories under `vendor/` are only needed when a specific environment cannot install dependencies inside Docker and you already have a healthy host install:

```bash
make docker-artifacts
```

3. Install the Chromium browser used by host-side Playwright runs:

```bash
npm run e2e:install
```

The compose-managed Playwright workflow uses the official Playwright image and does not need a host browser install.

4. Bootstrap the default database schema and seed data before relying on the web and worker containers:

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

`make compose-up` and `make compose-up-detached` do not run Prisma migrations or seed the default application stack for you. If you skip this bootstrap on a fresh database, Auth.js can fail with `The table public.users does not exist` and the worker can log `relation "public.opportunity_tasks" does not exist` even though PostgreSQL itself is reachable.

5. Start the local PostgreSQL, web app, and worker stack:

```bash
make compose-up
```

For a detached stack:

```bash
make compose-up-detached
```

6. Optional: run the app directly on the host instead of through Compose:

```bash
npm run dev
```

The app serves at `http://127.0.0.1:3000`, PostgreSQL is exposed on `127.0.0.1:5432`, and the readiness endpoint is `http://127.0.0.1:3000/api/health`. The current health endpoint checks database connectivity and document-storage readiness only; it does not verify that the full Prisma schema has been applied, so an unmigrated database can still return `status: "ok"` while app queries fail on missing tables.

## Database Workflow

Validate the Prisma schema:

```bash
npm run prisma:validate
```

Apply the checked-in migration set to the current database:

```bash
npx prisma migrate deploy
```

Create and apply a new development migration when the schema changes:

```bash
npm run prisma:migrate:dev -- --name your_migration_name
```

Seed the baseline auth, opportunity, lineage, and knowledge data:

```bash
npm run db:seed
```

The current seed creates a default organization, the canonical system role set, seven realistic local users spanning admin, executive, BD, capture, proposal, contributor, and viewer roles, deterministic local password hashes for those seeded users, five agencies, five contract vehicles, five competitors, connector configs for `sam.gov`, `usaspending_api`, `gsa_ebuy`, and `csv_upload`, one imported `sam.gov` opportunity with retained raw and normalized payloads plus attachment and contact child records already in `capture_active`, one applied import decision that created the canonical opportunity, one `usaspending_api` enrichment search and retained award-centric source record with an applied link-to-existing import decision, additive recommendation-threshold defaults on the organization scoring profile, four additional manual opportunities spanning `qualified`, `proposal_in_development`, `submitted`, and `no_bid` stages with `GO`, `DEFER`, and `NO_GO` score or decision outcomes, one seeded proposal record on the active proposal-stage workspace with checklist and linked-document relations, and three reusable knowledge assets spanning past performance, boilerplate content, and win themes with linked opportunities plus freeform, agency, capability, contract-type, and vehicle retrieval tags. The seed finishes by running the same deadline-reminder sweep the worker uses, so the live app starts with one overdue seeded task, visible upcoming milestone reminders, saved source-search state that the source-sync job can sweep, seeded workspace documents that already exercise downloadable local files, retained extracted text, queued extraction status, proposal-tracking data for the live workspace smoke flow, and an initial knowledge library that can be filtered immediately.

If startup logs show `The table public.users does not exist` or `relation "public.opportunity_tasks" does not exist`, PostgreSQL is reachable but the checked-in migration set has not been applied to that database yet. Run the bootstrap sequence above, restart the stack if it was already running, and sign in again after reseeding so the browser does not reuse a stale JWT session cookie.

The typed opportunity module under `src/modules/opportunities/` now exposes shared DTOs, dashboard and list read models, a dedicated opportunity-workspace read model, deterministic in-workspace knowledge-suggestion ranking, a decision-console read model, portfolio decision analytics for bid volume, call mix, score distribution, recommendation alignment, funnel conversion, active-stage aging, and effort-versus-outcome summaries, additive drill-through metadata for stage queues and oldest-stage pursuits, a pure deterministic scoring engine for capability fit, strategic alignment, vehicle access, relationship strength, schedule realism, and risk, seeded recommendation-threshold handling for deterministic `GO`/`DEFER`/`NO_GO` outputs, repository fallback scorecard calculation for unscored opportunities, dashboard command-center summaries for attention queue, top pursuits, task burden, recent source activity, stage distribution, stage-to-stage conversion rates, active-stage aging, and upcoming deadlines, task-assignee and personal-task-board snapshots, decision-history mapping, current closeout plus competitor-option mapping for closed workspaces, proposal-record mapping for status, owner, checklist completion, and linked artifacts, a persisted deadline-reminder state boundary for tasks plus milestones, a stage-policy boundary with required-field gating, form-validation boundaries for opportunities, proposals, tasks, milestones, notes, documents, bid decisions, and closeout postmortems, browser-draft helpers, local-disk document storage plus queued extraction status for supported text uploads, worker-driven text extraction retries for pending documents, persisted scorecard recalculation sweeps for stale opportunities and now profile-change invalidation, and audited write-service integration for guarded create, edit, proposal create-update-delete, stage-transition, task, milestone, note, document, bid-decision, and closeout flows. For the current analytics slice, effort is intentionally modeled as a proxy over tracked execution artifacts rather than hours because the schema does not yet store labor time. The typed source-integration module under `src/modules/source-integrations/` now owns canonical external-search query parsing, a reusable `sam.gov` connector with live and fixture execution modes, proxy-aware live request handling, graceful transport-error degradation, persisted `source_search_executions`, normalized `source_records`, materialized `source_record_attachments` plus `source_record_contacts` and `source_record_awards`, connector-scoped saved-search summaries for discovery re-entry, source-result preview payload shaping from retained lineage rows, duplicate detection against existing opportunities, guarded create-versus-link import application, scheduled saved-search sync sweeps for due `sam.gov` searches, and a CSV import boundary that parses uploaded files, auto-suggests header mappings, validates tracked-opportunity fields, and performs conservative duplicate review before import. The new typed integration module under `src/modules/integrations/` prepares canonical CRM, document-repository, and communication payloads from an opportunity workspace snapshot, exposes stable adapter contracts per integration domain, and ships deterministic dry-run stub adapters so future live outbound or inbound integrations can be added without rewriting the opportunity or source modules. The new typed shell module under `src/modules/shell/` now shapes command-surface sections plus shell notification summaries from opportunities, assigned tasks, knowledge assets, and saved searches so the authenticated layout can stay server-backed while the command center, pinned-work persistence, and alert review stay lightweight on the client. The new observability helpers under `src/lib/observability/` now provide structured JSON logging for both app routes and worker jobs, while `src/lib/runtime-health.ts` provides a multi-signal runtime snapshot that checks database and document-storage readiness for `/api/health`. The typed admin repository under `src/modules/admin/` now exposes organization-scoped user-role visibility, recent audit-log inspection, source connector health, recent sync runs, failed import review rows, saved-search registry summaries, the seeded organization scoring profile plus recommendation thresholds, and observed-outcome recalibration insights for the guarded `/settings` route; the new recalibration write boundary accepts suggested or manual factor-weight updates, records an audit event, bumps the scoring-model version, and immediately recalculates current scorecards without code edits. The typed knowledge module under `src/modules/knowledge/` now exposes structured tag parsing, URL-backed preview selection, richer knowledge-library preview payloads, list and form snapshots, validation, and audited create/update/delete writes for reusable knowledge assets with freeform plus agency/capability/contract-type/vehicle retrieval coverage. The authenticated `(app)` route group now renders through a shared OneSource workspace shell with a desktop sidebar, sticky top bar, keyboard-accessible command launcher, command-center dialog with quick-create, recent, pinned, and server-backed cross-entity results, a shell notification dialog, reusable mobile navigation drawer, permission-aware analytics navigation, and a dedicated route-level error boundary. The root app tree also now exposes a public route-level error boundary. The `/sources` route now combines connector-backed external search with visible connector switching, saved-search re-entry, collapsible advanced filters, denser list-detail scanning, translated-request inspection, import preview, and the guarded CSV intake workspace; `/knowledge` now hosts a preview-first library with asset-type views, a sticky taxonomy rail, a selected-asset side brief, quick copy action, and the existing guarded create/edit flows; `/settings` now hosts a dense operator workspace for connector operations, saved-search visibility, scoring recalibration, user-role coverage, and audit activity; and `/opportunities/new` plus `/opportunities/[opportunityId]/edit` provide guarded tracked-opportunity forms with server validation and browser-local draft restore. The `/tasks` route now hosts a real personal execution queue that surfaces assigned tasks with opportunity linkage plus overdue reminders, while `/analytics` now hosts a guarded decision console that combines the ranking table with denser comparison modules and one-click drill-through to the underlying opportunities.

## Optional Local Docker Dependency Cache

Developer-generated cache directories under `vendor/` are not committed to the repo. Docker images install dependencies with normal `npm ci` by default, but the build will switch to `npm ci --offline` automatically when `vendor/npm-offline-cache` is present locally.

`make docker-artifacts` is the canonical way to prepare those local fallback caches, but it is optional and now expects an already-healthy host install. It no longer bootstraps `node_modules` on a cold repo:

```bash
make docker-artifacts
```

`vendor/prisma-client` is also an optional local artifact. When present, the Docker dependency stage overlays it after install so compose builds can reuse a host-generated Prisma client if the environment needs that fallback. The dependency stage still accepts the older `*.tar.gz` files if they already exist locally, but new refreshes now write directories instead of archives.

## Required Environment Variables

- `DATABASE_URL`: postgres connection string used by the app and worker. Required and validated at app boot.
- `AUTH_SECRET`: session-signing secret used by Auth.js. Required and validated at app boot.
- `NEXTAUTH_URL`: absolute base URL for Auth.js callback and redirect handling. Required and validated at app boot.
- `DOCUMENT_UPLOAD_DIR`: optional local filesystem root used for guarded opportunity-document uploads and downloads. Defaults to `.data/opportunity-documents`.
- `SAM_GOV_API_KEY`: optional `sam.gov` public API key. Required only for live upstream search execution.
- `SAM_GOV_SEARCH_ENDPOINT`: optional `sam.gov` search endpoint override. Defaults to `https://api.sam.gov/prod/opportunities/v2/search`.
- `SAM_GOV_TIMEOUT_MS`: optional timeout for `sam.gov` connector requests. Defaults to `15000`.
- `SAM_GOV_USE_FIXTURES`: optional switch for deterministic fixture-backed `sam.gov` execution. Defaults to `false`; test workflows override it to `true`.
- `HTTP_PROXY` / `HTTPS_PROXY`: optional outbound proxy URLs. When set, the live `sam.gov` connector routes its server-side requests through the configured proxy.
- `POSTGRES_DB`: database name for the compose-managed PostgreSQL service.
- `POSTGRES_USER`: database user for the compose-managed PostgreSQL service.
- `POSTGRES_PASSWORD`: database password for the compose-managed PostgreSQL service.
- `WORKER_POLL_INTERVAL_MS`: optional worker heartbeat interval in milliseconds. Defaults to `30000`.
- `DEADLINE_REMINDER_LOOKAHEAD_DAYS`: optional worker lookahead window for upcoming reminders. Defaults to `7`.
- `SOURCE_SYNC_INTERVAL_MINUTES`: optional minimum age before a saved source search is due for another scheduled sweep. Defaults to `1440`.
- `SOURCE_SYNC_BATCH_SIZE`: optional maximum number of saved searches processed per worker iteration. Defaults to `3`.
- `DOCUMENT_PARSER_BATCH_SIZE`: optional maximum number of queued documents processed per worker iteration. Defaults to `10`.
- `DOCUMENT_PARSER_MAX_ATTEMPTS`: optional cap on parsing retries for queued documents. Defaults to `3`.
- `OPPORTUNITY_SCORECARD_BATCH_SIZE`: optional maximum number of stale or missing-current scorecards recalculated per worker iteration. Defaults to `10`.

The committed `.env.example` contains the canonical development defaults.

## Verification Commands

- Lint: `npm run lint`
- Prisma schema validation: `npm run prisma:validate`
- Prisma checked-in migrations apply: `npx prisma migrate deploy`
- Prisma dev migration creation and apply: `npm run prisma:migrate:dev -- --name your_migration_name`
- Prisma seed: `npm run db:seed`
- Unit tests with coverage: `npm test`
- Production build: `npm run build`
- Chromium smoke test with a Playwright-managed local server: `npm run e2e`
- Chromium smoke test with deterministic `sam.gov` fixture mode: `SAM_GOV_USE_FIXTURES=true npm run e2e`
- Chromium smoke test against an already-running app: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npm run e2e`
- One-shot reminder sweep: `npm run job:deadline-reminders`
- One-shot scheduled source-sync sweep: `SAM_GOV_USE_FIXTURES=true npm run job:source-sync`
- One-shot document parsing sweep: `npm run job:document-parse`
- One-shot scorecard recalculation sweep: `npm run job:scorecards`
- Compose lint: `make compose-test-lint`
- Compose unit tests with coverage: `make compose-test`
- Compose build validation: `make compose-test-build`
- Compose migrate-and-seed bootstrap: `make compose-test-bootstrap`
- Compose Chromium smoke test: `make compose-test-e2e`
- Prepare local Docker fallback caches only: `make docker-artifacts`
- Direct Docker image build: `make docker-build`
- Reclaim repo-local development disk usage: `make clean-dev-artifacts`
- Format check: `npm run format:check`
- Apply formatting: `npm run format`
- Compose stack status: `docker compose ps`
- Compose logs: `docker compose logs -f web worker`
- Compose teardown: `make compose-down`

`make clean-dev-artifacts` is the canonical cleanup path when local disk usage grows too large. It stops the default and test compose stacks, removes repo-local compose images and volumes, then deletes disposable local artifacts such as `node_modules`, `.next`, coverage output, Playwright reports, bind-mounted PostgreSQL data, uploaded-document scratch data, generated type and build-info files, and the optional `vendor/npm-offline-cache` plus `vendor/prisma-client` fallback directories (along with any legacy `vendor/*.tar.gz` archives). By repo policy, agents should run this target at the end of each loop after verification and any required commit so the next loop starts from a cold local environment. Run `make compose-up` again afterward for container-first workflows, or restore host dependencies first if you specifically need `npm install` or `make docker-artifacts`.

`npm run e2e` starts the app automatically through the Playwright `webServer` configuration and injects a default local `DATABASE_URL` when one is not already set. The Playwright config now also defaults `SAM_GOV_USE_FIXTURES=true` so the `sam.gov` smoke path stays deterministic unless a caller explicitly overrides it. The compose `make compose-test*` targets also force fixture mode for the same reason. When `PLAYWRIGHT_BASE_URL` is provided, Playwright skips the internal web server and targets the existing app instance instead; if that existing app should run deterministic `/sources` smoke coverage, start the app itself with `SAM_GOV_USE_FIXTURES=true` because Playwright cannot inject fixture mode into an already-running server. The current Chromium smoke suite runs serially because it mutates one shared seeded database; it covers the seeded dashboard stage-count, conversion-rate, pipeline-aging, and upcoming-deadline widgets, the refactored `/opportunities` saved-view plus filter-rail workflow and preview-first workspace entry path, the decision-console ranking flow plus the denser decision-posture, score-band, stage-conversion, active-stage-aging, and drill-through analytics checks on `/analytics`, the opportunity workspace route plus seeded overdue and upcoming reminder badges, ranked in-workspace knowledge suggestions, live bid-decision recording, live task creation, live milestone creation, guarded note creation, guarded document upload plus download-link visibility, live proposal tracking updates, a live stage transition, and live closeout recording on a seeded closed opportunity, the guarded create-and-edit opportunity flow with browser-local draft restore, the `/tasks` personal execution queue with reminder state, the preview-first `/knowledge` browse, filter, copy, and create flow with the desktop taxonomy rail plus linked-pursuit visibility, and the `/sources` flows for connector-backed external search, saved-search re-entry, translated-query inspection, preview-and-link import behavior, and guarded CSV upload with preview, mapping, validation, and import into the tracked pipeline, plus desktop shell navigation, the small-screen navigation drawer, and admin access to `/settings` including connector operations, saved-search registry visibility, retry queueing, scoring recalibration, and viewer denial on direct `/settings` navigation. If you rerun the browser suite after any prior smoke flow has already mutated the shared seed data, reseed first. The compose browser target now does that inside the disposable test container through `make compose-test-bootstrap` and `make compose-test-e2e`, so a full local reset no longer requires host-side `npx prisma migrate deploy` or `npm run db:seed` before the compose browser check. In this environment the compose-managed Playwright path is the canonical browser check; the host-started `npm run e2e` path can surface low-level PostgreSQL `XX000 unexpected data beyond EOF` storage faults on the local bind-mounted database even when the compose-managed app and test flows pass cleanly. The compose test database no longer publishes host port `5432`, which avoids collisions with unrelated local Postgres containers while still keeping the disposable stack reachable from the compose-managed services. After user-facing route or smoke-spec changes in this sandbox, explicitly rebuild the compose browser images with `docker compose -f docker-compose.test.yml build --no-cache web playwright` before rerunning `make compose-test-e2e` so Chromium picks up the current app bundle and current browser assertions together. The `make compose-test-e2e` target currently starts by running `docker compose down --remove-orphans`, so it will stop any user-kept default `web`/`worker` stack before bootstrapping the disposable browser path; rerun `docker compose up --build -d web worker` afterward when the live environment needs to remain available.

Automated acceptance for the current `sam.gov` connector still uses deterministic fixture mode. Manual live upstream verification is now also recorded: on `2026-04-19`, the running app executed a credentialed `/sources` notice search against the real SAM.gov API, rendered a retained preview from the persisted `source_record`, and promoted that record into a new tracked opportunity. In environments that expose `HTTP_PROXY` or `HTTPS_PROXY`, the connector now honors those variables for live server-side requests.

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
8. When the stack is needed, prefer the `make` wrappers such as `make compose-up` and `make compose-test-e2e` so compose boot, verification, and disposable test-database setup stay consistent.
9. After verification and any required commit, run `make clean-dev-artifacts` unless the user explicitly asked to keep the environment running or unresolved debugging evidence must be preserved.

## Known Gaps

- Audit emission now exists across seed bootstrap, shared opportunity writes, source import, knowledge writes, scoring recalibration, reminder transitions, document parsing, and scorecard recalculation, but auth events and permission failures still do not emit audit rows.
- Background sweeps now cover reminders, scheduled `sam.gov` sync, queued document parsing, and stale scorecard recalculation, but non-`sam.gov` connector execution, richer job observability, and later knowledge-system automation remain future enhancements.

Those items are the remaining intentional post-checklist gaps; this README documents the current completed project baseline.
