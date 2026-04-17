# OneSource Architecture

## Purpose

This document records the truthful system architecture that exists in the repo today. It is intentionally narrower than the long-term product design in `SPEC.md` and `PRD.md`: the repo now includes the full Phase 0 runtime scaffold plus the first five Phase 1 foundation slices for authentication, auditability, opportunity/source lineage, connector-ready multi-source persistence, opportunity workspace execution storage, and the first typed domain access layer over the Prisma baseline.

## Current System Shape

OneSource is currently a modular-monolith scaffold built with Next.js 16, TypeScript, and Prisma ORM. The app exposes a single public homepage plus a health-check route and runs alongside PostgreSQL and a placeholder worker in `docker compose`. The database now persists the auth baseline, the canonical opportunity/source-lineage aggregate, the connector metadata plus promotion-decision entities, and the execution-side workspace records needed for later capture workflows.

Current runtime components:

- `web`: Next.js application container serving the App Router UI and API routes
- `db`: PostgreSQL 16 container used by the health check and worker heartbeat
- `worker`: placeholder Node.js process that validates env, connects to PostgreSQL, and emits structured heartbeat logs
- `playwright`: profile-gated Chromium test container used only for compose-backed browser verification

The compose images are intentionally built from a repo-contained offline npm cache archive rather than a copied host `node_modules` tree. This keeps the stack deterministic even though Docker containers in this environment cannot reach `registry.npmjs.org` directly.

## Repository Layout

- `src/app`: App Router routes, layout, global styles, and route handlers
- `src/components`: shared UI components and component tests
- `src/lib`: runtime helpers such as environment parsing, Prisma client construction, and database health checks
- `src/modules/opportunities`: shared DTOs and typed repository functions for opportunity-centric read models
- `prisma`: schema, generated migrations, and seed scripts
- `scripts`: operational helper scripts including the placeholder worker
- `tests`: Playwright smoke coverage
- `docs`: durable architecture, runbook, testing, and research notes

## Request And Runtime Flow

### Web App

1. Next.js boots and executes [instrumentation.ts](/Users/maverick/Documents/RalphLoops/OneSource/instrumentation.ts:1).
2. `register()` calls `getServerEnv()` from [src/lib/env.ts](/Users/maverick/Documents/RalphLoops/OneSource/src/lib/env.ts:1), which validates required environment variables with Zod and fails fast on invalid config.
3. The homepage route renders [AppShellPreview](/Users/maverick/Documents/RalphLoops/OneSource/src/components/home/app-shell-preview.tsx:1), which remains a static product shell used to verify layout, styling, and browser automation while the typed repository layer matures behind tests.
4. The health route at [src/app/api/health/route.ts](/Users/maverick/Documents/RalphLoops/OneSource/src/app/api/health/route.ts:1) calls [checkDatabaseConnection](/Users/maverick/Documents/RalphLoops/OneSource/src/lib/database-health.ts:1) and returns either `200 ok` or `503 degraded`.

### Worker

1. `docker compose` starts `scripts/worker.mjs`.
2. The worker validates `DATABASE_URL` plus `WORKER_POLL_INTERVAL_MS`.
3. On each polling interval it opens a PostgreSQL connection, executes `select 1 as heartbeat`, and logs a structured JSON heartbeat.
4. `SIGINT` and `SIGTERM` trigger a clean shutdown loop exit.

## Module Boundaries

Current boundaries are intentionally simple but no longer purely route-plus-lib:

- Route rendering stays in `src/app`.
- Shared presentation logic lives in `src/components`.
- Cross-route runtime helpers live in `src/lib`.
- Typed entity DTOs and repository functions now live in `src/modules/opportunities`.
- Background-process behavior lives in `scripts`.

This keeps early Phase 0 behavior out of page files while establishing the first `src/modules` pattern expected by `PRD.md`:

- additional business domains under `src/modules`
- source integrations isolated from opportunity domain logic
- typed DTO boundaries between connectors, normalization, and application services

## Data And Persistence

Prisma now owns the initial database schema and migration history. The Phase 1 baseline includes these persistence areas:

- `organizations`: tenant root for users, roles, and audit scope
- `users`: canonical app users with organization membership and lifecycle status
- `roles` and `user_roles`: database-backed role catalog plus user-role assignments
- `accounts`, `sessions`, and `verification_tokens`: Auth.js-compatible auth tables for future sign-in flows
- `audit_logs`: append-oriented audit storage for actor, target, action, and metadata
- `agencies`: canonical agency and office lineage for opportunities and source records
- `contract_vehicles` plus `opportunity_vehicles`: reusable vehicle catalog and opportunity-to-vehicle links
- `opportunities`: canonical pursuit record with normalized source-derived metadata
- `competitors` plus `opportunity_competitors`: competitor catalog and opportunity-to-competitor links
- `source_connector_configs`: source-agnostic connector capability, auth, and validation metadata keyed by organization plus source system
- `source_saved_searches`: persisted canonical and source-specific search filters
- `source_search_executions`: executed search envelopes, outbound request metadata, and result counts
- `source_sync_runs`: sync execution history and status counters
- `source_records`: raw payload retention, normalized payload retention, import-preview payloads, and canonical opportunity linkage
- `source_record_attachments`, `source_record_contacts`, and `source_record_awards`: normalized child entities for source-specific linked artifacts, contacts, and award enrichment
- `source_import_decisions`: auditable promotion decisions that either create a new opportunity or link a source record to an existing opportunity
- `source_search_results` and `source_sync_run_records`: lineage joins that record which search execution and sync run observed a retained source record
- `opportunity_tasks`: execution work items with assignee, status, priority, due dates, and metadata
- `opportunity_milestones`: key capture dates and checkpoints with status and target dates
- `opportunity_notes`: pinned and unpinned workspace notes with author attribution
- `opportunity_documents`: linked or uploaded document metadata plus extracted text storage
- `opportunity_stage_transitions`: append-oriented stage-change history with rationale and required-field snapshots
- `opportunity_scorecards` plus `opportunity_score_factors`: score snapshots and factor-level explanations
- `bid_decisions`: persisted recommendation and final go/no-go decision history
- `opportunity_activity_events`: append-oriented workspace feed entries tied back to related entities where possible

Current schema assumptions:

- Each user belongs to exactly one organization in the initial release slice.
- Roles are organization-scoped database rows rather than enums so later admin tooling can inspect and evolve assignments without schema rewrites.
- Audit actions and target types are stored as strings to avoid a migration for every new auditable workflow while the product surface is still expanding.
- Source systems are stored as string keys such as `sam_gov` rather than a database enum so later connectors can be added without a schema migration purely for identifier expansion.
- Search and sync history use explicit join tables to preserve lineage to retained `source_records` without overwriting a prior execution every time the same external record is seen again.
- Connector configs are organization-scoped rows rather than enums so capability flags, auth types, and validation state can evolve without schema rewrites.
- Import decisions are modeled separately from retained source records so one source can create a canonical opportunity while another only enriches that same opportunity.
- Current pipeline stage state is denormalized onto `opportunities.currentStageKey` and `currentStageLabel` for later list/dashboard queries, while the full transition history remains append-oriented in `opportunity_stage_transitions`.
- Score factor explanations are stored as child rows rather than opaque JSON so later workspace UI and analytics can query factor-level results without re-parsing blobs.

Current seed defaults:

- one organization with slug `default-org`
- the seven core PRD roles
- six local development users spanning admin, executive, business development, capture, proposal, and contributor roles
- five agency records across Air Force, Army, VA, DHS, and Navy accounts
- five contract vehicles and five competitor records
- connector configs for `sam.gov`, `usaspending_api`, and `gsa_ebuy`
- one saved `sam.gov` search, one successful search execution, and one successful sync run
- one imported opportunity linked to its agency, vehicles, competitors, and canonical `sam.gov` source record
- one retained `sam.gov` source record containing raw payload, normalized payload, import-preview payload, attachments, contacts, and a create-opportunity import decision
- one retained `usaspending_api` source record linked to the same opportunity, with award enrichment data and a link-to-existing import decision
- four additional manual opportunities distributed across `qualified`, `proposal_in_development`, `submitted`, and `no_bid` pipeline states
- seeded workspaces that now cover blocked, in-progress, completed, and cancelled-style execution patterns plus `GO`, `DEFER`, and `NO_GO` scoring or bid-decision outcomes
- one bootstrap audit-log event recording the seed action

## Container And Environment Strategy

Canonical local orchestration is `docker compose`. The current compose file defines the default runtime stack plus a `test` profile for lint, build, unit-test, and Playwright execution.

Environment configuration is injected through `.env` / compose variables and validated at boot. The current required variables are:

- `DATABASE_URL`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `WORKER_POLL_INTERVAL_MS`

Docker dependency installation is performed offline from `vendor/npm-offline-cache.tar.gz`. That archive is generated from the lockfile plus the host npm cache by `npm run cache:npm:refresh` and is part of the repo’s durable build inputs.

## Testing Architecture

Current automated coverage consists of:

- Vitest unit tests for the homepage shell and env parsing
- Vitest unit coverage for the canonical system role catalog
- Vitest coverage for the typed opportunity repository DTO mapping and dashboard query contract
- Playwright Chromium smoke coverage for the homepage
- Prisma schema validation, migration, and seed verification against PostgreSQL
- compose-backed lint, build, unit-test, and browser-test workflows documented in `docs/testing.md`

## Connector Strategy

No live connector exists yet. The product architecture now persists source-agnostic connector metadata and multi-source lineage examples for `sam.gov`, `usaspending_api`, and session-backed `gsa_ebuy`, but executable connector services remain future work for Phase 7.

## Known Gaps

- No Auth.js runtime, protected routes, or authorization checks yet
- No audit event emitters on business workflows yet beyond the seed bootstrap record
- No executable connector service layer yet despite the new connector metadata baseline
- No production job runner beyond the placeholder worker heartbeat

These gaps are expected at the current phase and should be resolved through the sequenced PRD checklist rather than ad hoc refactors.
