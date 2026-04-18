# OneSource Testing Guide

## Purpose

This document records the canonical verification workflows for the repo as of the current Phase 7 CSV-intake and document-upload baseline. Use these commands instead of ad hoc local setup so the next loop can reproduce the same results without relying on chat history.

## Current Coverage

- Unit tests: Vitest with Testing Library for UI, shared UI primitives through routed feature usage, runtime helpers, Auth.js callback behavior, credential authentication, password verification, typed repository mapping, deterministic scoring and recommendation formulas plus fallback scorecard mapping, stage-policy coverage, permission-policy coverage, admin-console rendering, audit payload shaping, and audited opportunity write flows
- Seed-fixture tests: deterministic multi-source and workspace fixture coverage under `src/lib/opportunities/`
- Browser tests: Playwright Chromium smoke coverage in `tests/`, including redirect-to-sign-in, seeded dashboard widget visibility, authenticated-shell access, the `/opportunities` filter flow, the `/analytics` decision-console ranking flow, the seeded opportunity workspace route plus visible overdue and upcoming reminder badges, live bid-decision recording, live task creation, live milestone creation, guarded note creation, guarded document upload plus stored-file download visibility, and a live stage transition, the guarded tracked-opportunity create/edit flow with browser-local draft restore, the `/tasks` personal execution queue with reminder state, the `/sources` mocked external-search flow plus preview-and-link import behavior, the `/sources` CSV upload flow with preview, mapping, validation, and import confirmation, desktop shell navigation, mobile drawer navigation, admin access to the `/settings` admin console with scoring-profile visibility, and viewer denial on direct `/settings` navigation
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
- navigate into `/opportunities`, apply real source and stage filters, and observe the URL plus result set update together
- navigate into `/analytics`, switch the decision-console ranking lens, and observe the URL plus ranked results update together
- open a seeded opportunity workspace from `/opportunities`, verify the overview, scoring, tasks, documents, notes, and history sections render on the live app, then execute one guarded stage transition with recorded rationale
- record a final bid decision from the workspace scoring panel and verify the rationale appears in the visible decision-history surface
- create a task from the workspace with assignee, due date, status, and priority, then confirm that task appears in the signed-in user’s `/tasks` personal queue
- render one seeded overdue task badge plus one seeded upcoming milestone badge before any new writes are made, proving the background worker and seed path persisted reminder state
- create a milestone from the workspace with title, type, target date, and status, then confirm that milestone appears on the dashboard deadline surface
- create a note from the workspace with title, pinned state, and body content, then confirm that note appears in the notes section and history feed
- upload a text document from the workspace, confirm the success state and extracted-text snippet render, and confirm a stored-file download link is visible on the resulting document card
- open `/opportunities/new`, restore a browser-local draft, create a tracked opportunity through the guarded form path, then edit that opportunity through the guarded update flow
- navigate into `/sources`, submit a structured mocked `sam.gov` search, and observe the URL plus mocked result set update together
- open a source-result preview, inspect duplicate detection, and either link the result into the existing tracked opportunity or confirm the already-linked state on reruns
- upload a CSV file on `/sources`, confirm auto-detected mappings and row-level preview states render, then import one clean row and confirm it appears on the tracked opportunity list
- navigate from the desktop shell into another primary section with the top-bar search placeholder still visible
- open the small-screen drawer and navigate into another primary section successfully
- allow the admin user through the restricted `/settings` route and render the seeded organization scoring profile plus assigned-role visibility and recent audit activity
- redirect the seeded viewer user from `/settings` to `/forbidden`

For the current audit slice, targeted unit verification should confirm:

- the shared audit helper produces append-only `audit_logs` create payloads with actor, target, action, summary, metadata, and occurrence timestamp fields
- the transactional opportunity write service emits audit rows for create, update, delete, task-create, task-update, task-delete, import-decision, stage-transition, and bid-decision operations
- the transactional opportunity write service emits audit rows plus workspace activity for document uploads, including stored metadata and extraction status
- update audits persist field-diff metadata rather than only a generic action label

For the current admin-console slice, targeted unit verification should confirm:

- the admin repository maps organization-scoped users with assigned roles into typed read models
- the admin repository maps recent audit rows into stable display fields without exposing raw Prisma records to the page
- the admin console component renders both populated and missing-organization states

For the current Phase 6 scoring slices, targeted verification should confirm:

- the deterministic seed scenario exposes one organization scoring profile with capabilities, certifications, selected vehicles, target agencies, target NAICS codes, and weighted criteria
- the admin repository maps the organization scoring profile plus recommendation-threshold fields into typed display fields without leaking raw Prisma payloads into the page layer
- the admin console renders the scoring-profile sections, decision-threshold badges, and weighted-criteria table on the guarded `/settings` route
- the pure scoring engine returns six factor scores with deterministic explanations plus `GO`, `DEFER`, and `NO_GO` recommendation outcomes across strong-fit, high-risk, borderline, and missing-profile edge cases
- the typed opportunity repository synthesizes a deterministic scorecard for workspaces and list snapshots when a persisted current scorecard is missing, including recommendation outcome and rationale
- the typed opportunity repository maps both the current workspace bid decision and a bounded decision-history list so the scoring panel can show human overrides without querying raw Prisma payloads in the page layer
- the typed opportunity repository maps a decision-console snapshot that ranks pursuits by strategic value, overall score, urgency, or risk pressure without leaking raw Prisma payloads into the page layer
- the decision-console component renders the URL-selected ranking lens, scope, and ranked comparison rows truthfully, including the documented temporary `value == strategic alignment` assumption

For the current Phase 3 dashboard slice, targeted unit verification should confirm:

- the seeded dashboard landing component renders stage counts, ranked opportunities, and upcoming deadlines from typed snapshot data
- the typed opportunity repository derives the dashboard snapshot without leaking raw Prisma model payloads into the page layer
- the authenticated shell still opens the mobile drawer through the shared drawer primitive

For the current Phase 4 source-search slice, targeted unit verification should confirm:

- the typed source-integration module parses URL search params into a normalized canonical query object with `sam.gov` validation rules and bounded defaults
- the typed source-integration module translates canonical filters into the explicit `sam.gov` outbound request parameters and filters deterministic mocked results without leaking transport details into the page layer
- the rendered source-search page shows URL-synced control values, translated request visibility, mocked result rows, and truthful empty or validation states

For the current Phase 4 source-import slice, targeted unit verification should confirm:

- the preview service builds raw and normalized mocked source payloads for the selected result without coupling preview rendering to page-local ad hoc logic
- duplicate detection ranks exact source matches and likely tracked-opportunity matches deterministically from seeded opportunity metadata
- the guarded import service persists source records, import decisions, and canonical opportunity linkage for both create-new and link-existing decisions

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
- the typed opportunity repository maps stored-file download URLs only when a document has a local storage path
- the rendered opportunity workspace shows the six primary sections from one server-rendered snapshot and degrades truthfully when the opportunity cannot be loaded
- the browser smoke flow can open a seeded workspace from the opportunity list and observe representative seeded data in each major section

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

If host-side `npm run e2e` fails before tests start because the Next.js dev server reports a Turbopack checksum or cache-corruption panic, clear the generated `.next` directory and rerun the same Playwright command:

```bash
rm -rf .next
npm run e2e
```

The current Playwright smoke suite is intentionally serialized through `playwright.config.ts` because it mutates one shared seeded database. Do not re-enable fully parallel browser execution unless the browser tests are rewritten to isolate their data.

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
If the local `.env` is missing `DEADLINE_REMINDER_LOOKAHEAD_DAYS`, prefix the compose command with `DEADLINE_REMINDER_LOOKAHEAD_DAYS=7`.

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
