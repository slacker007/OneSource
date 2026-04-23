# OneSource Testing Guide

## Purpose

This document records the canonical verification workflows for the repo as of the completed Phase 10 launch-hardening baseline. Use these commands instead of ad hoc local setup so the next loop can reproduce the same results without relying on chat history.

## Current Coverage

- Unit tests: Vitest with Testing Library for UI, shared UI primitives through routed feature usage, runtime helpers, Auth.js callback behavior, credential authentication, password verification, typed repository mapping, deterministic scoring and recommendation formulas plus fallback scorecard mapping, stage-policy coverage, permission-policy coverage, admin-console rendering, audit payload shaping, audited opportunity write flows, observed-outcome scoring recalibration logic, scheduled source-sync sweeps, queued document parsing retries, persisted scorecard recalculation logic, canonical CRM or document-repository or communication integration payload builders with dry-run adapter contracts, structured logger serialization, runtime-health aggregation, and route-level error-boundary rendering
- For MUI-backed UI tests, prefer accessible roles, names, `aria-current`, named regions/forms/complementary panels, and app-owned wrapper semantics over incidental DOM shape, generated MUI class names, or legacy Tailwind utility output.
- Seed-fixture tests: deterministic multi-source and workspace fixture coverage under `src/lib/opportunities/`
- Browser tests: Playwright Chromium smoke coverage in `tests/`, including redirect-to-sign-in, the redesigned MUI dashboard stage-count, conversion-rate, pipeline-aging, and upcoming-deadline widget visibility, authenticated-shell access, the refactored `/opportunities` saved-view plus filter-rail workflow and preview-first workspace entry path, the MUI-backed `/analytics` decision-console ranking flow plus decision-posture, score-band, stage-conversion, stage-aging, and drill-through analytics checks, the seeded opportunity workspace route plus visible overdue and upcoming reminder badges, ranked knowledge suggestions, live bid-decision recording, live task creation, live milestone creation, guarded note creation, guarded document upload plus stored-file download visibility, live proposal tracking updates, a live stage transition, and live closeout recording on a seeded closed opportunity, the guarded tracked-opportunity create/edit flow with browser-local draft restore, the `/tasks` personal execution queue with reminder state, the preview-first `/knowledge` browse/filter/copy/create flow with the desktop taxonomy rail plus linked-pursuit visibility, the `/sources` fixture-backed connector search flow with collapsible advanced filters, translated-query visibility, preview-and-merge or preview-and-link import behavior, the `/sources` CSV upload flow with preview, mapping, validation, and import confirmation, desktop mini-rail plus expanded-shell navigation, mobile drawer navigation, admin access to the ops-focused `/settings` workspace plus the dedicated `/settings/users` invite-or-role-or-access flow, and viewer denial on direct `/settings` navigation, plus a tablet-sized authenticated route sweep that checks `/`, `/opportunities`, `/tasks`, `/knowledge`, `/sources`, `/analytics`, `/settings`, and one opportunity workspace for horizontal-overflow regressions
- Schema verification: Prisma validate, migration generation and apply, and seed execution
- Containerized verification: `docker compose` test workflows for lint, build, unit tests, and Chromium end-to-end checks

The repo-level Vitest configuration now sets `testTimeout: 10_000`. Keep that as part of the canonical contract for the current MUI-heavy coverage suite; several routed render and shared data-display tests exceed the default 5-second timeout under compose coverage, and ad hoc per-run timeout overrides should no longer be needed.

Integration tests do not exist yet. When database-backed integration tests are added, the compose `test` service is the canonical place to run them because it joins the same network as PostgreSQL and receives the compose-managed `DATABASE_URL`.

## Optional Offline Container Dependency Strategy

Compose builds now default to normal `npm ci`. If the container environment cannot reach the npm registry, you can generate local fallback cache directories under `vendor/`; those artifacts are intentionally ignored by git and are not part of the committed repo state.

When `vendor/npm-offline-cache` exists locally, the Docker dependency stage runs `npm ci --offline` against that mounted cache directory automatically. When `vendor/prisma-client` exists locally, the same stage overlays that generated Prisma client after install. The dependency stage still accepts the older `*.tar.gz` artifacts if they already exist locally, but new refreshes now write directories instead of archives.

Generate or refresh the local fallback caches with the `Makefile` wrapper whenever `package-lock.json` changes or a Docker build needs offline inputs and you already have a healthy host install:

```bash
make docker-artifacts
```

When you need to reclaim disk space across the full local workflow rather than just refresh the Docker caches, use:

```bash
make clean-dev-artifacts
```

That cleanup target removes disposable repo-local outputs and caches, including `node_modules`, `.next`, coverage output, Playwright artifacts, local uploaded-document data, bind-mounted PostgreSQL data, generated `*.tsbuildinfo`, and optional `vendor/npm-offline-cache` plus `vendor/prisma-client` fallback directories after first stopping the default and test compose stacks. Any legacy `vendor/*.tar.gz` archives are removed too.
By repo policy, successful loops should end with this command after verification and any required commit so the next agent starts from a clean local development environment with minimal disk usage.

## Host Verification Commands

These are useful during local development when the host environment is intentionally bootstrapped:

```bash
npm run prisma:validate
npm run lint
npm test
npm run build
npm run e2e
SAM_GOV_USE_FIXTURES=true npm run job:source-sync
npm run job:document-parse
npm run job:scorecards
```

## Devcontainer And Codespaces Verification

The checked-in `.devcontainer/` flow is only a workspace bootstrap layer. It installs the repo dependencies, Prisma client, Playwright Chromium, PostgreSQL client tools, Docker CLI plus Compose access, GitHub CLI, and the Codex CLI, but it does not change the canonical verification commands. Inside a Dev Container or GitHub Codespace, use the same `npm run ...` and `make compose-test-*` commands documented in this guide after the standard database bootstrap:

```bash
docker compose up -d db
npx prisma migrate deploy
npm run db:seed
```

For the current auth and authz slices, the Playwright smoke test is expected to:

- redirect anonymous requests for `/` to `/sign-in`
- submit seeded local credentials through the credentials provider
- land back on the protected shell with the authenticated-session UI visible
- navigate into `/opportunities`, switch into a saved view, apply real source and stage filters from the filter rail, open a preview brief, and observe the URL plus result set update together before entering the workspace
- navigate into `/analytics`, switch the decision-console ranking lens, observe the URL plus ranked results update together, confirm the decision-posture, score-band, stage-conversion, and stage-aging sections render on the live app, and follow at least one analytics drill-through link into the underlying opportunity queue or workspace
- open a seeded opportunity workspace from `/opportunities`, verify the overview, scoring, suggested reusable content, tasks, documents, notes, and history sections render on the live app, then execute one guarded stage transition with recorded rationale
- record a final bid decision from the workspace scoring panel and verify the rationale appears in the visible decision-history surface
- update the seeded proposal record on the active proposal-stage workspace, changing status, owner, checklist state, and linked documents, then verify the saved values remain visible on the live route
- open a seeded closed opportunity workspace, record closeout notes with outcome reason, competitor context, and lessons learned, then verify the resulting postmortem remains visible on the route and in the history feed
- create a task from the workspace with assignee, due date, status, and priority, then confirm that task appears in the signed-in user’s `/tasks` personal queue
- render one seeded overdue task badge plus one seeded upcoming milestone badge before any new writes are made, proving the background worker and seed path persisted reminder state
- create a milestone from the workspace with title, type, target date, and status, then confirm that milestone appears on the dashboard deadline surface
- create a note from the workspace with title, pinned state, and body content, then confirm that note appears in the notes section and history feed
- upload a text document from the workspace, confirm the success state plus queued extraction status render, and confirm a stored-file download link is visible on the resulting document card
- open `/opportunities/new`, restore a browser-local draft, create a tracked opportunity through the guarded form path, then edit that opportunity through the guarded update flow
- navigate into `/knowledge`, verify the selected-asset preview and copy action, filter the seeded library by structured capability or vehicle coverage from the preview-first browse surface, create a reusable knowledge asset with freeform plus structured tags and linked opportunities, then return to the library and confirm the created asset can be filtered back down
- navigate into `/sources`, re-enter discovery through a visible saved search or manual filter edits, open the advanced-filter disclosure, submit a structured fixture-backed `sam.gov` search, and observe the URL plus connector-backed result set update together
- open a source-result preview, inspect duplicate detection plus the translated outbound query, and either link the result into the existing tracked opportunity or confirm the already-linked state on reruns
- upload a CSV file on `/sources`, confirm auto-detected mappings and row-level preview states render, then import one clean row and confirm it appears on the tracked opportunity list
- navigate from the desktop shell into another primary section with the top-bar search placeholder still visible
- open the small-screen drawer and navigate into another primary section successfully
- allow the admin user through the restricted `/settings` route and render the seeded connector-operations tables, saved-search registry, organization scoring profile, observed-outcome recalibration controls, users-and-roles visibility, and audit activity
- execute one `Retry sync` action from `/settings` and observe the queued success notice on the reloaded page
- redirect the seeded viewer user from `/settings` to `/forbidden`
- complete the tablet-sized route sweep for `/`, `/opportunities`, `/tasks`, `/knowledge`, `/sources`, `/analytics`, `/settings`, and one opportunity workspace while confirming `document.documentElement.scrollWidth <= window.innerWidth + 1` on each visited surface

For the current audit slice, targeted unit verification should confirm:

- the shared audit helper produces append-only `audit_logs` create payloads with actor, target, action, summary, metadata, and occurrence timestamp fields
- the transactional opportunity write service emits audit rows for create, update, delete, task-create, task-update, task-delete, import-decision, stage-transition, and bid-decision operations
- the transactional opportunity write service emits audit rows plus workspace activity for document uploads, including stored metadata and extraction status
- update audits persist field-diff metadata rather than only a generic action label

For the current Phase 8 knowledge slices, targeted verification should confirm:

- the knowledge form schema validates asset type, title, summary, body, freeform tags, structured agency or capability or contract-type or vehicle tags, and linked opportunities into a stable typed write payload
- the typed knowledge repository parses URL search params into bounded list filters for freeform tags plus agency, capability, contract type, vehicle, and linked opportunity retrieval without leaking raw Prisma payloads into the page layer
- the audited knowledge write service creates, updates, and deletes knowledge assets while syncing freeform plus structured retrieval tags and opportunity links, then appends audit-log rows
- the rendered `/knowledge` surface shows preview-first browsing, truthful empty states, URL-synced structured filters, quick copy affordances, and create/edit affordances guarded by `manage_pipeline`
- the browser smoke flow can browse `/knowledge`, verify the selected-asset preview state, create one asset, and find it again through the library filter state, including at least one structured retrieval facet
- the typed opportunity repository ranks workspace knowledge suggestions from current opportunity metadata such as linked pursuits, lead agency, vehicles, inferred capability keywords, contract type, and keyword overlap without leaking raw Prisma payloads into the page layer
- the rendered opportunity workspace shows suggestion rationale, reusable-content previews, linked-pursuit context, and a filtered library affordance without leaving the route

For the current admin-console slice, targeted unit verification should confirm:

- the admin repository maps organization-scoped users with assigned roles into typed read models
- the admin repository maps recent audit rows into stable display fields without exposing raw Prisma records to the page
- the admin repository maps source connector health, recent sync runs, failed import review rows, and saved-search registry summaries into stable admin DTOs without leaking raw Prisma records to the page
- the admin console component renders populated and missing-organization states plus the guarded connector-operations, saved-search, scoring-profile, user-role, and audit sections

For the current Phase 7 source-sync observability slice, targeted verification should confirm:

- the source-operations read model derives connector health, latest successful sync state, rate-limit posture, retryability, and failed import review rows from retained connector config, sync-run, search-execution, and import-decision history
- the scheduled source-sync job logs upstream 429 rate limits at warning severity so the admin surface can distinguish throttling from generic connector failure
- the guarded `/settings` surface renders connector health, recent source sync runs, failed import review rows, and the retry success banner without exposing raw database state
- the Playwright smoke flow can queue one retry from `/settings` and observe the queued notice after the page reloads

For the current Phase 6 scoring slices, targeted verification should confirm:

- the deterministic seed scenario exposes one organization scoring profile with capabilities, certifications, selected vehicles, target agencies, target NAICS codes, and weighted criteria
- the admin repository maps the organization scoring profile plus recommendation-threshold fields, observed closed-outcome summaries, and suggested recalibration weights into typed display fields without leaking raw Prisma payloads into the page layer
- the admin console renders the scoring-profile sections, decision-threshold badges, weighted-criteria table, observed-outcome summaries, and recalibration form on the guarded `/settings` route
- canonical browser verification should prefer `make compose-test-e2e`; in this environment the host-started `npm run e2e` path can hit low-level PostgreSQL `XX000 unexpected data beyond EOF` storage errors on the bind-mounted local database even when the compose-managed Playwright run passes
- after a full local database reset, rerun `npx prisma migrate deploy` plus `npm run db:seed` before host-side browser checks; the compose Playwright target now bootstraps its disposable test database internally through `make compose-test-bootstrap`
- the pure scoring engine returns six factor scores with deterministic explanations plus `GO`, `DEFER`, and `NO_GO` recommendation outcomes across strong-fit, high-risk, borderline, and missing-profile edge cases
- the typed opportunity repository synthesizes a deterministic scorecard for workspaces and list snapshots when a persisted current scorecard is missing, including recommendation outcome and rationale
- the typed opportunity repository maps both the current workspace bid decision and a bounded decision-history list so the scoring panel can show human overrides without querying raw Prisma payloads in the page layer
- the typed opportunity repository maps a decision-console snapshot that ranks pursuits by strategic value, overall score, urgency, or risk pressure without leaking raw Prisma payloads into the page layer
- the decision-console component renders the URL-selected ranking lens, scope, and ranked comparison rows truthfully, including the documented temporary `value == strategic alignment` assumption

For the current dashboard command-center slice, targeted unit verification should confirm:

- the seeded dashboard landing component renders the attention queue, top pursuits, task-burden summaries, recent source activity, stage counts, pipeline conversion rates, active-stage aging, and upcoming deadlines from typed snapshot data through the shared MUI surface vocabulary
- the typed opportunity repository derives the dashboard snapshot without leaking raw Prisma model payloads into the page layer and calculates attention, task-burden, conversion, aging, and recent-source-activity summaries from persisted opportunity and sync state
- the decision-console component continues to render the URL-selected ranking lens, scoped summary modules, and drill-through comparison table truthfully after the MUI surface and table migration
- the authenticated shell still opens the mobile drawer through the shared drawer primitive

For the current Phase 7 connector-backed source-search slice, targeted unit verification should confirm:

- the typed source-integration module parses URL search params into a normalized canonical query object with `sam.gov` validation rules and bounded defaults
- the typed source-integration module translates canonical filters into the explicit `sam.gov` outbound request parameters, executes through the reusable connector boundary, and persists `source_search_executions`, `source_search_results`, `source_records`, and normalized attachment/contact/award child rows without leaking transport details into the page layer
- the rendered source-search page shows URL-synced control values, translated request visibility, execution-mode status, connector-backed result rows, and truthful empty or validation states

For the current Phase 7 connector-backed source-import slice, targeted unit verification should confirm:

- the preview service loads raw and normalized source payloads from retained `source_records` for the selected result without coupling preview rendering to page-local ad hoc logic
- duplicate detection ranks exact source matches, exact notice matches, and weighted fuzzy canonical matches deterministically from seeded opportunity metadata
- the guarded import service applies create-new and link-existing decisions against persisted `source_records`, auto-merges strong duplicate imports into the existing canonical opportunity, backfills missing canonical opportunity fields from retained source data, and maintains import decisions plus canonical opportunity linkage

For the current Phase 4 opportunities-list slice, targeted unit verification should confirm:

- the typed opportunity repository parses URL search params into a normalized query object with bounded defaults
- the typed opportunity repository filters, sorts, paginates, and labels seeded opportunities without leaking raw Prisma payloads into the page layer
- the rendered opportunity list page shows URL-synced control values, result rows, pagination state, and a truthful empty state

For the current Phase 4 opportunity-form slice, targeted unit verification should confirm:

- the typed opportunity form schema validates required fields, parses optional values, and converts deadline input into a stable typed write payload
- the client opportunity form restores browser-local drafts and persists updated draft state without coupling validation rules to page-local ad hoc logic
- the opportunity list exposes stable create and edit entry points into the guarded form routes

For the current Phase 4 opportunity-workspace slice, targeted verification should confirm:

- the typed opportunity repository loads one organization-scoped opportunity workspace with overview, scoring, tasks, documents, notes, activity, and stage-transition data without leaking raw Prisma payloads into the page layer
- the typed opportunity repository maps the current proposal record, completed-checklist counts, and linked proposal documents on the workspace snapshot without leaking raw Prisma payloads into the page layer
- the typed opportunity repository maps stored-file download URLs only when a document has a local storage path
- the rendered opportunity workspace shows the six primary sections from one server-rendered snapshot and degrades truthfully when the opportunity cannot be loaded
- the browser smoke flow can open a seeded workspace from the opportunity list and observe representative seeded data in each major section

For the current Phase 10 proposal slice, targeted verification should confirm:

- the proposal form schema validates stage gating, owner selection, repeated checklist values, and repeated linked-document values into a stable typed write payload
- the audited opportunity write service creates, updates, and deletes one proposal record per opportunity while syncing checklist-item rows and linked-document joins
- the rendered workspace exposes proposal status, owner, compliance checklist, and linked-document management only when the current stage supports proposal execution or a proposal record already exists
- the browser smoke flow can update the seeded proposal record and observe the saved status, owner, checklist, and linked-document state on the live route

For the current Phase 10 integration-boundary slice, targeted verification should confirm:

- the typed integration module prepares canonical CRM payloads from an opportunity workspace snapshot without leaking Prisma model shapes into adapter callers
- the typed integration module prepares document-repository payloads from workspace documents plus proposal checklist state without requiring file-transfer logic inside the opportunity module
- the typed integration module prepares communication-digest payloads that summarize score, proposal, overdue-task, and upcoming-milestone posture from one typed workspace snapshot
- the default dry-run adapters exercise the CRM, document-repository, and communication contracts deterministically so future live adapters can be added behind the same interfaces

For the current Phase 10 runtime-hardening slice, targeted verification should confirm:

- the shared structured logger writes JSON log entries with stable `timestamp`, `service`, `level`, `message`, and optional `detail` fields for both app and worker usage
- the runtime-health module reports database plus document-storage readiness, fixture-mode state, and uptime through one typed snapshot
- the `/api/health` route returns `200` for healthy dependencies and `503` for degraded dependencies without hiding the failing component details
- the shared route-level error-boundary component renders a consistent retry surface for both the public app tree and the authenticated workspace tree
- manual error-path validation covers at least `curl http://127.0.0.1:3000/api/health` for the healthy case and `curl -i http://127.0.0.1:3000/api/opportunities/documents/not-a-real-id/download` for the unauthenticated JSON failure path

For the current Phase 10 launch-hardening slice, targeted verification should confirm:

- the permission matrix remains explicit for admin, executive, business-development, capture-manager, proposal-manager, contributor, and viewer roles
- the reviewed routed surfaces keep their truthful empty and error states for the personal task board, decision console, and knowledge library
- the documented disposable local reset flow restores PostgreSQL, local document storage, migrations, seed data, and `/api/health`
- the compose-managed browser regression path still passes after the reset-and-reseed flow

For the current Phase 4 stage-transition slice, targeted verification should confirm:

- the stage-policy module exposes only adjacent pipeline transitions and marks blocked moves when required records are missing
- the audited opportunity write service rejects blank-rationale or missing-requirement transitions before mutating persistence
- valid stage transitions append both `opportunity_stage_transitions` and `opportunity_activity_events` rows while also emitting an audit log
- the browser smoke flow can execute a live stage move from the workspace and observe both inline success feedback and updated timeline evidence

For the current Phase 5 task slice, targeted verification should confirm:

- the task form schema validates assignee, due date, status, priority, and title fields into a stable typed write payload
- the typed opportunity repository exposes organization-scoped task-assignee options on the workspace snapshot and a signed-in-user personal task board with opportunity linkage
- the audited opportunity write service creates, updates, and deletes tasks while appending both activity-feed and audit-log evidence
- the rendered workspace exposes guarded task create, edit, and delete controls without leaving the opportunity route
- the browser smoke flow can create a task from the workspace and observe it in `/tasks`

For the current Phase 5 milestone slice, targeted verification should confirm:

- the milestone form schema validates title, target date, milestone type, and status fields into a stable typed write payload
- the audited opportunity write service creates, updates, and deletes milestones while appending both activity-feed and audit-log evidence
- the rendered workspace exposes guarded milestone create, edit, and delete controls without leaving the opportunity route
- the browser smoke flow can create a milestone from the workspace and observe it on the dashboard deadline widgets

For the current Phase 5 note slice, targeted verification should confirm:

- the note form schema validates body, title, and pinned-state fields into a stable typed write payload
- the audited opportunity write service creates notes while appending both activity-feed and audit-log evidence
- the rendered workspace exposes a guarded note-create form without leaving the opportunity route
- the browser smoke flow can create a note from the workspace and observe it in both the notes section and history feed

For the current Phase 5 reminder slice, targeted verification should confirm:

- the reminder job classifies active task and milestone deadlines into `NONE`, `UPCOMING`, and `OVERDUE` states from an explicit `now` reference and lookahead window
- the reminder job persists state transitions while appending both workspace activity events and audit-log rows
- the typed opportunity repository maps persisted reminder state into the workspace, dashboard attention logic, and personal task board without leaking raw Prisma payloads into the page layer
- the browser smoke flow can observe seeded reminder badges in both the workspace and `/tasks` queue without client polling logic

For the current Phase 7 background-job slice, targeted verification should confirm:

- the scheduled source-sync job selects only due saved searches, creates `source_sync_runs`, persists `source_search_executions` plus lineage joins, and remains idempotent across reruns against the same retained records
- the document-parsing job retries pending local documents, updates extraction status and attempt metadata, and records a bounded failed state once `DOCUMENT_PARSER_MAX_ATTEMPTS` is reached
- the scorecard job recalculates stale or missing-current scorecards, persists new current factor rows, and skips opportunities whose current scorecard already matches the deterministic scoring snapshot
- manual operator commands `SAM_GOV_USE_FIXTURES=true npm run job:source-sync`, `npm run job:document-parse`, and `npm run job:scorecards` complete successfully against the local stack before `P7-05` is closed

When the changed area includes Prisma schema or seed logic, also run:

```bash
docker compose up -d db
npm run prisma:migrate:dev -- --name your_migration_name
npm run db:seed
```

When a schema item depends on seeded relationships, verify the persisted graph directly with a narrow Prisma query before closing the loop.

For the current Phase 8 knowledge slices, host verification is expected to include:

```bash
docker compose up -d db
npx prisma migrate deploy
npm run db:seed
npm run prisma:validate
npm run lint
npm test
npm run build
npm run db:seed
npm run e2e
```

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

For launch-hardening recovery and pilot-readiness checks, the canonical disposable local reset flow is:

```bash
docker compose down -v --remove-orphans
rm -rf .data/opportunity-documents
mkdir -p .data/opportunity-documents
make compose-up-detached
npx prisma migrate deploy
npm run db:seed
curl http://127.0.0.1:3000/api/health
make compose-test-e2e
```

If host-side `npm run e2e` fails before tests start because the Next.js dev server reports a Turbopack checksum or cache-corruption panic, clear the generated `.next` directory and rerun the same Playwright command:

```bash
rm -rf .next
npm run e2e
```

The current Playwright smoke suite is intentionally serialized through `playwright.config.ts` because it mutates one shared seeded database. Do not re-enable fully parallel browser execution unless the browser tests are rewritten to isolate their data.
If you rerun either host or compose Playwright after a prior smoke run has already mutated the shared seed data, run `npm run db:seed` first so the proposal, task, and closeout assertions return to their deterministic baseline.

Automated browser verification intentionally runs the `sam.gov` connector in fixture mode. That deterministic mocked path remains the automated acceptance path for `P7-03`. Manual live upstream verification is also now recorded: on `2026-04-19`, the app ran a credentialed `/sources` notice search against the real SAM.gov API, loaded the persisted preview for notice `f40018c4e8394c98af3555e336a149f8`, and promoted that retained `source_record` into a new tracked opportunity through the real import action. For future live checks, set `SAM_GOV_API_KEY`, ensure `SAM_GOV_USE_FIXTURES=false`, seed the database, and then exercise the `/sources` search-and-import flow against the running app. When `PLAYWRIGHT_BASE_URL` points at an already running host-started app, start that app itself with `SAM_GOV_USE_FIXTURES=true` if the browser run should stay deterministic on the mocked connector path, because Playwright cannot retrofit fixture mode into an external server. When `HTTP_PROXY` or `HTTPS_PROXY` is present, the live connector now routes server-side requests through that proxy automatically.

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

The Playwright workflow automatically starts PostgreSQL and the web app, waits for the app health check, then runs Chromium from the dedicated Playwright container. Compose-backed browser execution uses the same serialized Playwright configuration as host-side `npm run e2e`.
The compose verification targets now run through [`docker-compose.test.yml`](/Users/maverick/Documents/RalphLoops/OneSource/docker-compose.test.yml:1), which uses a disposable `tmpfs` PostgreSQL data mount for the test stack so browser verification no longer depends on the host bind-mounted database directory. The test-stack PostgreSQL service also stays internal to the compose network and no longer publishes host port `5432`, which avoids collisions with unrelated local Postgres containers.
The `make compose-test*` targets force `SAM_GOV_USE_FIXTURES=true` so connector-backed `/sources` verification stays deterministic in CI-like local runs.
Because the smoke suite mutates one shared seeded database inside the disposable test stack, `make compose-test-e2e` now starts from an empty `tmpfs` database, then runs `npx prisma migrate deploy` and `npm run db:seed` inside the disposable `test` container before Chromium runs. You can run that setup phase directly with `make compose-test-bootstrap`.
The compose `test` service now runs in the isolated `onesource-test` compose project, keeps a persistent bind-mounted runner alive with a named `test_node_modules` volume, and targets a dedicated non-production Docker stage. Normal `make compose-test-lint`, `make compose-test`, `make compose-test-build`, and `make compose-test-bootstrap` runs therefore reuse the existing runner through `docker compose exec` instead of rebuilding and exporting a disposable image every time. The cold-start healthcheck window is intentionally long enough for an empty dependency volume to finish `npm ci` plus `prisma generate` before the service is considered unhealthy. Use `make compose-test-image` only when Docker inputs or dependency inputs changed and you intentionally need to refresh the baked runner image. The compose browser path now also targets a dedicated standalone `e2e-web` image so Playwright reruns export a much smaller web image than the full production runner.
For normal reruns, let `make compose-test-e2e` call the cached `make compose-test-browser-image` path automatically. Use `make compose-test-browser-image-fresh` before `make compose-test-e2e` only when you intentionally need a no-cache browser rebuild to debug Docker layer reuse.
The current `make compose-test-e2e` target begins by running `docker compose down --remove-orphans`, so it will stop a user-kept default `web`/`worker` stack before the disposable browser stack starts. If the live environment needs to remain available after browser verification, restore it with `docker compose up --build -d web worker`; if earlier direct `docker compose -f docker-compose.test.yml run --rm --build test ...` commands recreated `db`, rerun the documented default-stack `npx prisma migrate deploy` plus `npm run db:seed` bootstrap first.
If the compose browser run leaves `db` restarting, rerun `make compose-down` and then `make compose-test-e2e`. The test stack is intentionally disposable; no manual cleanup of PostgreSQL files is required beyond clearing `.data/opportunity-documents` if uploaded test artifacts need to be reset.
After the loop is closed and any debugging evidence is no longer needed, run `make clean-dev-artifacts` instead of leaving the rebuilt verification environment in place.

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
