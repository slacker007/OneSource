# OneSource Architecture

## Purpose

This document records the truthful system architecture that exists in the repo today. It is intentionally narrower than the long-term product design in `SPEC.md` and `PRD.md`: the repo now includes the full Phase 0 runtime scaffold, all current Phase 1 foundation slices, the first live Phase 2 authentication, authorization, auditability, and admin-visibility slices, the first three Phase 3 UI slices, the full current Phase 4 opportunity-management baseline, the first three Phase 5 collaboration slices, the full current Phase 6 scoring-and-decision-support baseline, and the active Phase 7 intake work through the first executable `sam.gov` connector boundary plus multi-source canonical deduplication on top of the Prisma baseline.

## Current System Shape

OneSource is currently a modular-monolith scaffold built with Next.js 16, TypeScript, Prisma ORM, and Auth.js. The app exposes a protected authenticated shell under the `(app)` route group with a shared desktop sidebar, sticky top bar, read-only global search affordance, reusable mobile drawer navigation, and permission-aware analytics navigation; a public sign-in route; a real opportunity list page at `/opportunities`; a real opportunity workspace page at `/opportunities/[opportunityId]`; guarded create and edit pages at `/opportunities/new` and `/opportunities/[opportunityId]/edit`; a real external source search and CSV intake page at `/sources`; a real personal execution queue at `/tasks`; a guarded decision console route at `/analytics`; a server-guarded admin console at `/settings` that now uses shared badge and table primitives plus seeded scoring-profile visibility; a public permission-denied route; an Auth.js route handler; and a health-check route, then runs alongside PostgreSQL and a real multi-sweep background worker in `docker compose`. The database now persists the auth baseline, the canonical opportunity/source-lineage aggregate, the connector metadata plus promotion-decision entities, the execution-side workspace records needed for later capture workflows, explicit deadline-reminder state on tasks plus milestones, uploadable workspace document metadata plus extracted text storage and extraction status, retained source-sync history, and the organization scoring-input profile needed for deterministic scoring and recommendation thresholds. Typed read and write boundaries now live under `src/modules/opportunities`, `src/modules/source-integrations`, and `src/modules/admin`; the opportunity module now includes a pure scoring engine that evaluates capability fit, strategic alignment, vehicle access, relationship strength, schedule realism, and risk from a normalized organization profile plus opportunity snapshot, then converts the resulting score plus risk posture into deterministic `GO`, `DEFER`, or `NO_GO` recommendations for active opportunities while preserving separate human decision records. The repository can synthesize a scorecard on read when no persisted current scorecard exists, now returns a bounded bid-decision history so the workspace can show both the latest recommendation context and past human overrides, now maps document download URLs for stored files, now queues supported document uploads for asynchronous text extraction retries instead of extracting inside the request path, and now exposes a dedicated decision-console snapshot that ranks pursuits by strategic value, overall score, urgency, or risk pressure without leaking raw Prisma payloads into the page layer. The `/sources` route now combines two intake paths through the same modular-monolith boundary: a reusable live-or-fixture `sam.gov` connector that persists `source_search_executions`, `source_search_results`, normalized `source_records`, and normalized attachment/contact/award child rows before the preview/import path runs, then applies exact-notice and weighted fuzzy canonicalization so duplicate imports merge into one tracked opportunity while preserving source lineage; and a guarded CSV intake workspace that parses uploaded files, auto-suggests header mappings, validates tracked-opportunity fields, performs conservative duplicate review against current opportunities, and imports only ready rows through the audited opportunity-create service with `originSourceSystem = "csv_upload"`. Scheduled saved-search sweeps now reuse the same connector boundary so source ingestion can run asynchronously outside the page request path.

Current runtime components:

- `web`: Next.js application container serving the App Router UI and API routes
- `db`: PostgreSQL 16 container used by the health check and background worker
- `worker`: Node.js process that validates env, sweeps reminders, due source searches, queued document parsing work, and stale opportunity scorecards on an interval, persists results, and emits structured summary logs
- `playwright`: profile-gated Chromium test container used only for compose-backed browser verification

The compose images install dependencies inside Docker rather than copying a host `node_modules` tree. By default the dependency stage runs `npm ci`, but it will switch to optional local offline archives under `vendor/` when those files have been generated for an environment that cannot reach the npm registry from containers. A repo-local `Makefile` now wraps Docker and compose entrypoints so those archives are prepared before builds start.

## Repository Layout

- `src/app`: App Router routes, layout, global styles, and route handlers
- `src/components`: shared UI components, shared UI primitives under `src/components/ui`, routed feature previews, and component tests
- `src/lib`: runtime helpers such as environment parsing, Prisma client construction, and database health checks
- `src/modules/admin`: typed admin DTOs and repository functions for user-role and audit-log read models
- `src/modules/audit`: typed audit-log helpers, stable action names, and append-only audit payload shaping
- `src/modules/opportunities`: shared DTOs, typed repository functions for opportunity-centric dashboard, list, form, and workspace read models, stage-policy rules, and audited write services
- `src/modules/source-integrations`: typed external-search parsing, connector capability metadata, reusable `sam.gov` request translation and live-or-fixture execution, persisted search/source lineage, CSV parsing and mapping, duplicate detection, and preview/import application services
- `prisma`: schema, generated migrations, and seed scripts
- `scripts`: operational helper scripts including the multi-sweep worker, one-shot job entrypoints, and Docker cache helpers
- `tests`: Playwright smoke coverage
- `docs`: durable architecture, runbook, testing, and research notes

## Request And Runtime Flow

### Web App

1. Next.js boots and executes [instrumentation.ts](/Users/maverick/Documents/RalphLoops/OneSource/instrumentation.ts:1).
2. `register()` calls `getServerEnv()` from [src/lib/env.ts](/Users/maverick/Documents/RalphLoops/OneSource/src/lib/env.ts:1), which validates required environment variables with Zod and fails fast on invalid config.
3. Requests to [src/app/(app)/layout.tsx](</Users/maverick/Documents/RalphLoops/OneSource/src/app/(app)/layout.tsx:1>) call [requireAuthenticatedAppSession](/Users/maverick/Documents/RalphLoops/OneSource/src/lib/auth/authorization.ts:1) and redirect anonymous users to `/sign-in`.
4. The sign-in page at [src/app/sign-in/page.tsx](/Users/maverick/Documents/RalphLoops/OneSource/src/app/sign-in/page.tsx:1) renders [SignInForm](/Users/maverick/Documents/RalphLoops/OneSource/src/components/auth/sign-in-form.tsx:1), which uses the Auth.js credentials provider against seeded local users.
5. The protected `(app)` layout now renders [AuthenticatedAppShell](/Users/maverick/Documents/RalphLoops/OneSource/src/components/layout/authenticated-app-shell.tsx:1), which derives the active section from the current pathname and exposes the shared sidebar, top bar, sign-out control, read-only global search field, and a reusable mobile navigation drawer built from the shared UI kit.
6. The protected homepage route renders [DashboardLanding](/Users/maverick/Documents/RalphLoops/OneSource/src/components/home/dashboard-landing.tsx:1), [AccessOverview](/Users/maverick/Documents/RalphLoops/OneSource/src/components/auth/access-overview.tsx:1), and the authenticated session summary so the shell opens with real stage, deadline, and ranked-opportunity widgets backed by the typed opportunity repository.
7. The protected `/opportunities` route renders [OpportunityList](/Users/maverick/Documents/RalphLoops/OneSource/src/components/opportunities/opportunity-list.tsx:1) from [src/app/(app)/opportunities/page.tsx](</Users/maverick/Documents/RalphLoops/OneSource/src/app/(app)/opportunities/page.tsx:1>), parsing `searchParams` into a typed repository query so search, filters, sort, pagination, and URL state stay server-driven.
8. The protected opportunity workspace route renders [OpportunityWorkspace](/Users/maverick/Documents/RalphLoops/OneSource/src/components/opportunities/opportunity-workspace.tsx:1) from [src/app/(app)/opportunities/[opportunityId]/page.tsx](</Users/maverick/Documents/RalphLoops/OneSource/src/app/(app)/opportunities/[opportunityId]/page.tsx:1>), which loads one organization-scoped pursuit snapshot through [src/modules/opportunities/opportunity.repository.ts](/Users/maverick/Documents/RalphLoops/OneSource/src/modules/opportunities/opportunity.repository.ts:1), derives allowed stage moves through [src/modules/opportunities/opportunity-stage-policy.ts](/Users/maverick/Documents/RalphLoops/OneSource/src/modules/opportunities/opportunity-stage-policy.ts:1), and exposes overview, weighted scoring, guarded bid-decision recording plus decision history, task CRUD, milestone CRUD, guarded note creation, guarded document upload plus stored-file download links, documents, notes, history, plus a guarded stage-transition panel without leaving the route.
9. The protected create and edit routes render [OpportunityForm](/Users/maverick/Documents/RalphLoops/OneSource/src/components/opportunities/opportunity-form.tsx:1) from [src/app/(app)/opportunities/new/page.tsx](</Users/maverick/Documents/RalphLoops/OneSource/src/app/(app)/opportunities/new/page.tsx:1>) and [src/app/(app)/opportunities/[opportunityId]/edit/page.tsx](</Users/maverick/Documents/RalphLoops/OneSource/src/app/(app)/opportunities/[opportunityId]/edit/page.tsx:1>), which load organization-scoped agency options and editable opportunity values through [src/modules/opportunities/opportunity-form.repository.ts](/Users/maverick/Documents/RalphLoops/OneSource/src/modules/opportunities/opportunity-form.repository.ts:1).
10. Opportunity create, edit, stage-transition, bid-decision, task CRUD, milestone CRUD, note-create, and document-upload submissions post to [src/app/(app)/opportunities/actions.ts](</Users/maverick/Documents/RalphLoops/OneSource/src/app/(app)/opportunities/actions.ts:1>), which requires `manage_pipeline`, validates inputs through [src/modules/opportunities/opportunity-form.schema.ts](/Users/maverick/Documents/RalphLoops/OneSource/src/modules/opportunities/opportunity-form.schema.ts:1), [src/modules/opportunities/opportunity-bid-decision-form.schema.ts](/Users/maverick/Documents/RalphLoops/OneSource/src/modules/opportunities/opportunity-bid-decision-form.schema.ts:1), [src/modules/opportunities/opportunity-task-form.schema.ts](/Users/maverick/Documents/RalphLoops/OneSource/src/modules/opportunities/opportunity-task-form.schema.ts:1), [src/modules/opportunities/opportunity-milestone-form.schema.ts](/Users/maverick/Documents/RalphLoops/OneSource/src/modules/opportunities/opportunity-milestone-form.schema.ts:1), [src/modules/opportunities/opportunity-note-form.schema.ts](/Users/maverick/Documents/RalphLoops/OneSource/src/modules/opportunities/opportunity-note-form.schema.ts:1), [src/modules/opportunities/opportunity-document-form.schema.ts](/Users/maverick/Documents/RalphLoops/OneSource/src/modules/opportunities/opportunity-document-form.schema.ts:1), plus the stage-policy module, stores uploaded files under the configured local document root, delegates metadata persistence to the audited write service, and either redirects back into the edit route or refreshes the workspace, dashboard, and personal task view with inline feedback.
11. The same workspace document manager uses [src/modules/opportunities/opportunity-document-storage.ts](/Users/maverick/Documents/RalphLoops/OneSource/src/modules/opportunities/opportunity-document-storage.ts:1) to bound file size, write local files beneath `DOCUMENT_UPLOAD_DIR`, persist supported UTF-8 text-like uploads as `PENDING` extraction work for the background parser, and preserve explicit extraction status for formats that are not currently queued.
12. Stored file downloads now flow through [src/app/api/opportunities/documents/[documentId]/download/route.ts](</Users/maverick/Documents/RalphLoops/OneSource/src/app/api/opportunities/documents/[documentId]/download/route.ts:1>), which requires an authenticated session plus `view_dashboard`, rechecks organization scope server-side, and streams either the local file or the retained external source URL.
13. The client opportunity form keeps browser-local draft autosave state so interrupted edits can be restored without prematurely creating server records, while the task manager, document manager, and stage-transition panel keep their guardrails visible on the live workspace route.
14. The protected `/sources` route renders [SourceSearch](/Users/maverick/Documents/RalphLoops/OneSource/src/components/sources/source-search.tsx:1) from [src/app/(app)/sources/page.tsx](</Users/maverick/Documents/RalphLoops/OneSource/src/app/(app)/sources/page.tsx:1>), which parses URL search params through [src/modules/source-integrations/source-search.service.ts](/Users/maverick/Documents/RalphLoops/OneSource/src/modules/source-integrations/source-search.service.ts:1), validates the canonical external-search query, translates it into explicit `sam.gov` request parameters, executes either the real upstream call or deterministic fixture mode through [src/modules/source-integrations/sam-gov.connector.ts](/Users/maverick/Documents/RalphLoops/OneSource/src/modules/source-integrations/sam-gov.connector.ts:1), and persists the resulting execution envelope, retained source records, and normalized child lineage rows before rendering the page snapshot.
15. The same `/sources` route now also renders [CsvImportWorkspace](/Users/maverick/Documents/RalphLoops/OneSource/src/components/sources/csv-import-workspace.tsx:1), which receives organization-scoped agencies plus current opportunities from [src/modules/source-integrations/csv-import.service.ts](/Users/maverick/Documents/RalphLoops/OneSource/src/modules/source-integrations/csv-import.service.ts:1), reads uploaded CSV content in the browser, auto-suggests column mappings, and previews row-level validation plus duplicate signals before any server write occurs.
16. When a preview is selected on `/sources`, the page also loads [src/modules/source-integrations/source-import.service.ts](/Users/maverick/Documents/RalphLoops/OneSource/src/modules/source-integrations/source-import.service.ts:1) to look up the retained `source_record`, shape raw-versus-normalized detail from persisted lineage data, rank duplicate opportunities against tracked records, classify exact-notice versus fuzzy canonical matches, and expose the guarded import decisions.
17. Form submissions from the preview panel post to [src/app/(app)/sources/actions.ts](</Users/maverick/Documents/RalphLoops/OneSource/src/app/(app)/sources/actions.ts:1>), which requires `manage_source_searches`, applies the selected import decision against the persisted `source_record`, auto-merges strong duplicate imports into the existing canonical opportunity when the caller requested create-new, backfills missing canonical opportunity fields from the retained normalized source payload, emits audit rows and opportunity activity events, and then redirects back into the preview state so the UI reflects the new canonical linkage.
18. CSV import submissions from the same route post to [src/app/(app)/sources/actions.ts](</Users/maverick/Documents/RalphLoops/OneSource/src/app/(app)/sources/actions.ts:1>), which rebuilds the preview server-side from the uploaded CSV text and mapping payload, imports only ready rows through the audited opportunity write service, and redirects back to `/sources` with import counts for user feedback.
19. The protected `/tasks` route renders [PersonalTaskBoard](/Users/maverick/Documents/RalphLoops/OneSource/src/components/tasks/personal-task-board.tsx:1) from [src/app/(app)/tasks/page.tsx](</Users/maverick/Documents/RalphLoops/OneSource/src/app/(app)/tasks/page.tsx:1>), which loads the signed-in user’s assigned tasks with opportunity linkage and persisted deadline-reminder state through [src/modules/opportunities/opportunity.repository.ts](/Users/maverick/Documents/RalphLoops/OneSource/src/modules/opportunities/opportunity.repository.ts:1).
20. The guarded `/analytics` route renders [DecisionConsole](/Users/maverick/Documents/RalphLoops/OneSource/src/components/analytics/decision-console.tsx:1) from [src/app/(app)/analytics/page.tsx](</Users/maverick/Documents/RalphLoops/OneSource/src/app/(app)/analytics/page.tsx:1>), which requires `view_decision_support`, parses URL search params into a typed ranking query, and ranks pursuits by strategic-alignment value, overall score, urgency, or risk pressure through the typed opportunity repository.
21. The Auth.js route at [src/app/api/auth/[...nextauth]/route.ts](/Users/maverick/Documents/RalphLoops/OneSource/src/app/api/auth/[...nextauth]/route.ts:1) uses [src/lib/auth/auth-options.ts](/Users/maverick/Documents/RalphLoops/OneSource/src/lib/auth/auth-options.ts:1) to issue JWT-backed sessions enriched with `organizationId` and `roleKeys`.
22. The guarded settings route at [src/app/(app)/settings/page.tsx](</Users/maverick/Documents/RalphLoops/OneSource/src/app/(app)/settings/page.tsx:1>) calls [requireAppPermission](/Users/maverick/Documents/RalphLoops/OneSource/src/lib/auth/authorization.ts:1), loads organization-scoped admin data plus the seeded scoring profile through [src/modules/admin/admin.repository.ts](/Users/maverick/Documents/RalphLoops/OneSource/src/modules/admin/admin.repository.ts:1), and renders [AdminConsole](/Users/maverick/Documents/RalphLoops/OneSource/src/components/admin/admin-console.tsx:1) through the shared table, badge, empty-state, and error-state primitives.
23. Non-admin users who navigate directly to `/settings` are redirected to `/forbidden`.
24. The health route at [src/app/api/health/route.ts](/Users/maverick/Documents/RalphLoops/OneSource/src/app/api/health/route.ts:1) calls [checkDatabaseConnection](/Users/maverick/Documents/RalphLoops/OneSource/src/lib/database-health.ts:1) and returns either `200 ok` or `503 degraded`.

### Worker

1. `docker compose` starts [scripts/worker.ts](/Users/maverick/Documents/RalphLoops/OneSource/scripts/worker.ts:1).
2. The worker validates `DATABASE_URL`, `WORKER_POLL_INTERVAL_MS`, `DEADLINE_REMINDER_LOOKAHEAD_DAYS`, `SOURCE_SYNC_INTERVAL_MINUTES`, `SOURCE_SYNC_BATCH_SIZE`, `DOCUMENT_PARSER_BATCH_SIZE`, `DOCUMENT_PARSER_MAX_ATTEMPTS`, and `OPPORTUNITY_SCORECARD_BATCH_SIZE`.
3. On each polling interval it runs [scripts/deadline-reminder-job.mjs](/Users/maverick/Documents/RalphLoops/OneSource/scripts/deadline-reminder-job.mjs:1), which scans active tasks plus milestones, classifies each deadline as `NONE`, `UPCOMING`, or `OVERDUE`, persists state transitions, and appends both activity-feed and audit-log evidence for reminder changes.
4. The same worker iteration runs [src/modules/source-integrations/source-sync-job.ts](/Users/maverick/Documents/RalphLoops/OneSource/src/modules/source-integrations/source-sync-job.ts:1), which selects due saved searches, creates `source_sync_runs`, reuses the `sam.gov` connector boundary in fixture or live mode, persists `source_search_executions`, updates retained source-record lineage, and marks each sync run succeeded or failed. Saved searches for future connectors are skipped with explicit warning logs until those connector implementations land.
5. The same worker iteration runs [src/modules/opportunities/opportunity-document-parsing-job.ts](/Users/maverick/Documents/RalphLoops/OneSource/src/modules/opportunities/opportunity-document-parsing-job.ts:1), which scans queued local documents, retries supported text extraction up to the configured attempt limit, updates extraction metadata, and emits workspace activity plus audit evidence for successful extraction.
6. The same worker iteration runs [src/modules/opportunities/opportunity-scorecard-job.ts](/Users/maverick/Documents/RalphLoops/OneSource/src/modules/opportunities/opportunity-scorecard-job.ts:1), which scans stale or missing-current scorecards, recalculates deterministic factor outputs, persists the new current scorecard snapshot, and emits audit plus activity evidence without duplicating already-current results.
7. Each sweep emits structured JSON summary logs with scanned and updated counts so operators can tell whether reminder, source-sync, document-parsing, and scorecard work is running.
8. `SIGINT` and `SIGTERM` trigger a clean shutdown loop exit.

## Module Boundaries

Current boundaries are intentionally simple but no longer purely route-plus-lib:

- Route rendering stays in `src/app`.
- Shared presentation logic lives in `src/components`.
- Cross-route UI primitives now live under `src/components/ui` so later pages can reuse one table, form-field, badge, drawer, dialog, empty-state, and error-state baseline instead of reimplementing them.
- Cross-route runtime helpers live in `src/lib`.
- Shared authenticated shell chrome now lives under `src/components/layout`, while analytics-specific comparison UI now lives under `src/components/analytics`.
- Organization-scoped admin read models now live in `src/modules/admin`.
- Shared audit helpers live in `src/modules/audit`.
- Typed entity DTOs, repository functions, deterministic scoring and recommendation logic, opportunity-workspace mapping, personal-task-board mapping, stage-policy rules, form-validation helpers, and audited write-service integration now live in `src/modules/opportunities`.
- Typed external-search parsing, connector capability metadata, reusable `sam.gov` connector execution, persisted execution and source-record lineage, preview payload shaping, exact and fuzzy duplicate ranking, canonical merge rules, and import application now live in `src/modules/source-integrations`.
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
- `organization_profiles`: one organization-scoped scoring-profile root carrying overview, strategic focus, target NAICS codes, focus-agency IDs, relationship-agency IDs, active scoring-model metadata, and deterministic recommendation thresholds
- `organization_capabilities`: capability inventory rows with labels, categories, keyword hints, and descriptions used for later capability-fit scoring
- `organization_certifications`: certification inventory rows with codes, issuers, and descriptions used for later qualification and compliance scoring
- `organization_profile_vehicles`: the subset of contract vehicles considered active scoring inputs, including preferred-vehicle flags
- `organization_scoring_criteria`: weighted factor definitions for capability fit, strategic alignment, vehicle access, relationship strength, schedule realism, and risk
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
- `opportunity_tasks`: execution work items with assignee, status, priority, due dates, persisted deadline-reminder state, and metadata
- `opportunity_milestones`: key capture dates and checkpoints with status, target dates, and persisted deadline-reminder state
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
- Import decisions are modeled separately from retained source records so one source can create a canonical opportunity while another only enriches that same opportunity, and current import metadata can preserve requested-versus-applied mode when deduplication auto-merges a create request into an existing canonical record.
- Current pipeline stage state is denormalized onto `opportunities.currentStageKey` and `currentStageLabel` for later list/dashboard queries, while the full transition history remains append-oriented in `opportunity_stage_transitions`.
- Score factor explanations are stored as child rows rather than opaque JSON so later workspace UI and analytics can query factor-level results without re-parsing blobs.

Current seed defaults:

- one organization with slug `default-org`
- the seven core PRD roles
- seven local development users spanning admin, executive, business development, capture, proposal, contributor, and viewer roles
- one organization scoring profile with focus agencies, relationship agencies, target NAICS codes, four capabilities, three certifications, three selected vehicles, six weighted scoring criteria, and seeded `GO`/`DEFER`/risk-threshold defaults
- five agency records across Air Force, Army, VA, DHS, and Navy accounts
- five contract vehicles and five competitor records
- connector configs for `sam.gov`, `usaspending_api`, `gsa_ebuy`, and `csv_upload`
- one saved `sam.gov` search, one successful search execution, and one successful sync run
- one imported opportunity linked to its agency, vehicles, competitors, and canonical `sam.gov` source record
- one retained `sam.gov` source record containing raw payload, normalized payload, import-preview payload, attachments, contacts, and a create-opportunity import decision
- one retained `usaspending_api` source record linked to the same opportunity, with award enrichment data and a link-to-existing import decision
- four additional manual opportunities distributed across `qualified`, `proposal_in_development`, `submitted`, and `no_bid` pipeline states
- seeded workspaces that now cover blocked, in-progress, completed, and cancelled-style execution patterns plus `GO`, `DEFER`, and `NO_GO` scoring or bid-decision outcomes
- one bootstrap audit-log event recording the seed action
- one seeded overdue active task plus one seeded upcoming milestone reminder after the reminder sweep runs

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
- `DEADLINE_REMINDER_LOOKAHEAD_DAYS`
- `SOURCE_SYNC_INTERVAL_MINUTES`
- `SOURCE_SYNC_BATCH_SIZE`
- `DOCUMENT_PARSER_BATCH_SIZE`
- `DOCUMENT_PARSER_MAX_ATTEMPTS`
- `OPPORTUNITY_SCORECARD_BATCH_SIZE`

Docker dependency installation defaults to online `npm ci`. Optional local fallback archives can be generated through `make docker-artifacts` when a specific environment needs offline container inputs, but those tarballs are intentionally ignored and are not durable repo inputs.

## Testing Architecture

Current automated coverage consists of:

- Vitest unit tests for the homepage shell, env parsing, password verification, credential authentication, Auth.js JWT/session callbacks, the centralized permission matrix, the admin console component, and the shared audit-log helper
- Vitest unit coverage for the canonical system role catalog
- Vitest coverage for the admin repository DTO mapping and organization-scoped audit preview contract
- Vitest coverage for the typed opportunity repository DTO mapping, deterministic scoring and recommendation formulas, and seeded dashboard query contract
- Vitest coverage for the stage-policy boundary plus the transactional opportunity write service that emits audit rows and activity events for create, update, delete, import-decision, stage-transition, and bid-decision flows
- Vitest coverage for scheduled source-sync sweeps, queued document parsing retries, extraction-status persistence, and deterministic scorecard recalculation persistence
- Playwright Chromium smoke coverage for protected-route redirect, sign-in, the `/opportunities` filter flow, the seeded `/opportunities/[opportunityId]` workspace route plus weighted scoring, decision-history visibility, live bid-decision recording, live overdue and upcoming reminder badges, live task creation, live milestone creation, guarded note creation, guarded document upload plus stored-file download visibility, and a live stage transition, the guarded tracked-opportunity create/edit flow with browser-local draft restore, the `/tasks` queue with persisted reminder state, the `/sources` fixture-backed connector search plus preview/link import flow and guarded CSV upload flow, desktop shell navigation, small-screen drawer navigation, admin access to the `/settings` admin console, and viewer denial on direct settings navigation
- Prisma schema validation, migration, and seed verification against PostgreSQL
- compose-backed lint, build, unit-test, and browser-test workflows documented in `docs/testing.md`

## Connector Strategy

The first executable connector now exists behind a source-agnostic integration boundary. The `sam.gov` adapter translates canonical filters into the documented `/prod/opportunities/v2/search` request shape, executes in either live or deterministic fixture mode, persists execution envelopes plus retained source records and normalized attachment/contact/award child rows, and feeds the preview/import flow through stored lineage rows instead of page-local synthetic IDs. Scheduled sync orchestration now exists for due `sam.gov` saved searches through the same boundary, while sync health surfacing and operator retry tooling remain later Phase 7 work. The credentialed live verification run is intentionally deferred to post-project follow-on `FP-01`.

## Known Gaps

- The shared app shell, reusable UI-pattern kit, seeded dashboard landing page, real opportunity list, real opportunity workspace, real decision console, task CRUD, milestone CRUD, guarded note creation, guarded document upload, real personal `/tasks` queue, and real external-search page now exist, but the later connector hardening, ingestion orchestration, knowledge, feedback-loop analytics, and proposal slices still need to land
- Only a subset of business workflows currently use role-based permission enforcement; `manage_pipeline`, `manage_source_searches`, and `manage_workspace_settings` now guard the current mutating or restricted surfaces, but finer-grained record-level authorization is still future work
- The opportunity write service now emits audit rows for representative business writes and is exercised by the tracked-opportunity forms plus source-import actions, but auth events and later workspace mutations still need to call that boundary consistently
- Scheduled ingestion now exists for due `sam.gov` saved searches, but sync-health dashboards, failed-run review, rate-limit surfaces, and non-`sam.gov` connector execution remain future Phase 7 work
- The worker now handles reminders, source sync, document parsing retries, and scorecard recalculation, but queue isolation, backpressure controls, and richer job observability remain future work

These gaps are expected at the current phase and should be resolved through the sequenced PRD checklist rather than ad hoc refactors.
