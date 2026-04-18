# OneSource Architecture

## Purpose

This document records the truthful system architecture that exists in the repo today. It is intentionally narrower than the long-term product design in `SPEC.md` and `PRD.md`: the repo now includes the full Phase 0 runtime scaffold, all current Phase 1 foundation slices, the first live Phase 2 authentication, authorization, auditability, and admin-visibility slices, plus the first two Phase 3 UI slices on top of the Prisma baseline.

## Current System Shape

OneSource is currently a modular-monolith scaffold built with Next.js 16, TypeScript, Prisma ORM, and Auth.js. The app exposes a protected authenticated shell under the `(app)` route group with a shared desktop sidebar, sticky top bar, read-only global search affordance, and reusable mobile drawer navigation; a public sign-in route; a truthful source-intake preview page at `/sources`; protected placeholder routes for `/opportunities`, `/tasks`, and `/analytics`; a server-guarded admin console at `/settings` that now uses shared badge and table primitives; a public permission-denied route; an Auth.js route handler; and a health-check route, then runs alongside PostgreSQL and a placeholder worker in `docker compose`. The database now persists the auth baseline, the canonical opportunity/source-lineage aggregate, the connector metadata plus promotion-decision entities, and the execution-side workspace records needed for later capture workflows. Typed read boundaries now live under both `src/modules/opportunities` and `src/modules/admin`, while the first transactional write boundary for the opportunity domain emits append-only audit rows through a shared module-local audit service.

Current runtime components:

- `web`: Next.js application container serving the App Router UI and API routes
- `db`: PostgreSQL 16 container used by the health check and worker heartbeat
- `worker`: placeholder Node.js process that validates env, connects to PostgreSQL, and emits structured heartbeat logs
- `playwright`: profile-gated Chromium test container used only for compose-backed browser verification

The compose images install dependencies inside Docker rather than copying a host `node_modules` tree. By default the dependency stage runs `npm ci`, but it will switch to optional local offline archives under `vendor/` when those files have been generated for an environment that cannot reach the npm registry from containers. A repo-local `Makefile` now wraps Docker and compose entrypoints so those archives are prepared before builds start.

## Repository Layout

- `src/app`: App Router routes, layout, global styles, and route handlers
- `src/components`: shared UI components, shared UI primitives under `src/components/ui`, routed feature previews, and component tests
- `src/lib`: runtime helpers such as environment parsing, Prisma client construction, and database health checks
- `src/modules/admin`: typed admin DTOs and repository functions for user-role and audit-log read models
- `src/modules/audit`: typed audit-log helpers, stable action names, and append-only audit payload shaping
- `src/modules/opportunities`: shared DTOs and typed repository functions for opportunity-centric read models
- `prisma`: schema, generated migrations, and seed scripts
- `scripts`: operational helper scripts including the placeholder worker
- `tests`: Playwright smoke coverage
- `docs`: durable architecture, runbook, testing, and research notes

## Request And Runtime Flow

### Web App

1. Next.js boots and executes [instrumentation.ts](/Users/maverick/Documents/RalphLoops/OneSource/instrumentation.ts:1).
2. `register()` calls `getServerEnv()` from [src/lib/env.ts](/Users/maverick/Documents/RalphLoops/OneSource/src/lib/env.ts:1), which validates required environment variables with Zod and fails fast on invalid config.
3. Requests to [src/app/(app)/layout.tsx](</Users/maverick/Documents/RalphLoops/OneSource/src/app/(app)/layout.tsx:1>) call [requireAuthenticatedAppSession](/Users/maverick/Documents/RalphLoops/OneSource/src/lib/auth/authorization.ts:1) and redirect anonymous users to `/sign-in`.
4. The sign-in page at [src/app/sign-in/page.tsx](/Users/maverick/Documents/RalphLoops/OneSource/src/app/sign-in/page.tsx:1) renders [SignInForm](/Users/maverick/Documents/RalphLoops/OneSource/src/components/auth/sign-in-form.tsx:1), which uses the Auth.js credentials provider against seeded local users.
5. The protected `(app)` layout now renders [AuthenticatedAppShell](/Users/maverick/Documents/RalphLoops/OneSource/src/components/layout/authenticated-app-shell.tsx:1), which derives the active section from the current pathname and exposes the shared sidebar, top bar, sign-out control, read-only global search field, and a reusable mobile navigation drawer built from the shared UI kit.
6. The protected homepage route renders [AccessOverview](/Users/maverick/Documents/RalphLoops/OneSource/src/components/auth/access-overview.tsx:1), [AppShellPreview](/Users/maverick/Documents/RalphLoops/OneSource/src/components/home/app-shell-preview.tsx:1), and the authenticated session summary so the shared client-safe permission snapshot is visible within the shell chrome.
7. The protected `/sources` route renders [SourceIntakePreview](/Users/maverick/Documents/RalphLoops/OneSource/src/components/sources/source-intake-preview.tsx:1), which truthfully demonstrates the shared form, badge, table, dialog, empty-state, and error-state primitives before live connector work exists.
8. The protected `/opportunities`, `/tasks`, and `/analytics` routes still render [SectionPlaceholder](/Users/maverick/Documents/RalphLoops/OneSource/src/components/layout/section-placeholder.tsx:1) so those major navigation targets resolve truthfully before their later feature slices land.
9. The Auth.js route at [src/app/api/auth/[...nextauth]/route.ts](/Users/maverick/Documents/RalphLoops/OneSource/src/app/api/auth/[...nextauth]/route.ts:1) uses [src/lib/auth/auth-options.ts](/Users/maverick/Documents/RalphLoops/OneSource/src/lib/auth/auth-options.ts:1) to issue JWT-backed sessions enriched with `organizationId` and `roleKeys`.
10. The guarded settings route at [src/app/(app)/settings/page.tsx](</Users/maverick/Documents/RalphLoops/OneSource/src/app/(app)/settings/page.tsx:1>) calls [requireAppPermission](/Users/maverick/Documents/RalphLoops/OneSource/src/lib/auth/authorization.ts:1), loads organization-scoped admin data through [src/modules/admin/admin.repository.ts](/Users/maverick/Documents/RalphLoops/OneSource/src/modules/admin/admin.repository.ts:1), and renders [AdminConsole](/Users/maverick/Documents/RalphLoops/OneSource/src/components/admin/admin-console.tsx:1) through the shared table, badge, empty-state, and error-state primitives.
11. Non-admin users who navigate directly to `/settings` are redirected to `/forbidden`.
12. The health route at [src/app/api/health/route.ts](/Users/maverick/Documents/RalphLoops/OneSource/src/app/api/health/route.ts:1) calls [checkDatabaseConnection](/Users/maverick/Documents/RalphLoops/OneSource/src/lib/database-health.ts:1) and returns either `200 ok` or `503 degraded`.

### Worker

1. `docker compose` starts `scripts/worker.mjs`.
2. The worker validates `DATABASE_URL` plus `WORKER_POLL_INTERVAL_MS`.
3. On each polling interval it opens a PostgreSQL connection, executes `select 1 as heartbeat`, and logs a structured JSON heartbeat.
4. `SIGINT` and `SIGTERM` trigger a clean shutdown loop exit.

## Module Boundaries

Current boundaries are intentionally simple but no longer purely route-plus-lib:

- Route rendering stays in `src/app`.
- Shared presentation logic lives in `src/components`.
- Cross-route UI primitives now live under `src/components/ui` so later pages can reuse one table, form-field, badge, drawer, dialog, empty-state, and error-state baseline instead of reimplementing them.
- Cross-route runtime helpers live in `src/lib`.
- Shared authenticated shell chrome and placeholder page scaffolds now live under `src/components/layout`.
- Organization-scoped admin read models now live in `src/modules/admin`.
- Shared audit helpers live in `src/modules/audit`.
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
- `accounts`, `sessions`, and `verification_tokens`: Auth.js-compatible auth tables for current and future sign-in flows
- `users.password_hash`: additive local-credentials field used by the current credentials-provider sign-in path
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
- seven local development users spanning admin, executive, business development, capture, proposal, contributor, and viewer roles
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
- `AUTH_SECRET`
- `NEXTAUTH_URL`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `WORKER_POLL_INTERVAL_MS`

Docker dependency installation defaults to online `npm ci`. Optional local fallback archives can be generated through `make docker-artifacts` when a specific environment needs offline container inputs, but those tarballs are intentionally ignored and are not durable repo inputs.

## Testing Architecture

Current automated coverage consists of:

- Vitest unit tests for the homepage shell, env parsing, password verification, credential authentication, Auth.js JWT/session callbacks, the centralized permission matrix, the admin console component, and the shared audit-log helper
- Vitest unit coverage for the canonical system role catalog
- Vitest coverage for the admin repository DTO mapping and organization-scoped audit preview contract
- Vitest coverage for the typed opportunity repository DTO mapping and dashboard query contract
- Vitest coverage for the transactional opportunity write service that emits audit rows for create, update, delete, import-decision, stage-transition, and bid-decision flows
- Playwright Chromium smoke coverage for protected-route redirect, sign-in, desktop shell navigation, the `/sources` preview dialog, small-screen drawer navigation, admin access to the `/settings` admin console, and viewer denial on direct settings navigation
- Prisma schema validation, migration, and seed verification against PostgreSQL
- compose-backed lint, build, unit-test, and browser-test workflows documented in `docs/testing.md`

## Connector Strategy

No live connector exists yet. The product architecture now persists source-agnostic connector metadata and multi-source lineage examples for `sam.gov`, `usaspending_api`, and session-backed `gsa_ebuy`, but executable connector services remain future work for Phase 7.

## Known Gaps

- The shared app shell and reusable UI-pattern kit now exist, but most primary routes still render placeholders or preview-only surfaces rather than real list, intake, task, or analytics modules
- Only one restricted surface currently uses role-based permission enforcement; most business workflows still need per-action authorization
- The opportunity write service now emits audit rows for representative business writes, but no user-facing route handlers or auth events call that boundary yet
- No executable connector service layer yet despite the new connector metadata baseline
- No production job runner beyond the placeholder worker heartbeat

These gaps are expected at the current phase and should be resolved through the sequenced PRD checklist rather than ad hoc refactors.
