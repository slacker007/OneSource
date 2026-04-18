# OneSource Implementation PRD

## Product Summary

OneSource will be implemented as an opportunity-centric capture intelligence platform for government contractors. The product will unify opportunity intake, qualification, scoring, pipeline management, capture execution, collaboration, document handling, and analytics in a single web application.

The first release should optimize for three outcomes:

1. Reduce low-quality opportunity noise.
2. Make bid and pursuit decisions auditable and explainable.
3. Replace spreadsheet-based pipeline tracking with a structured shared workspace.

## Product Scope

### In Scope For V1

- Opportunity intake and normalization
- Searchable source integrations for external opportunity systems such as `sam.gov`
- Opportunity workspace with notes, documents, tasks, and activity history
- Configurable stage-based pipeline
- Rule-based fit scoring and go/no-go recommendations
- Dashboards for pipeline health and decision support
- Role-based access control and audit logging
- Manual import plus at least one real external opportunity connector with pull-into-pipeline tracking
- Knowledge repository for reusable past-performance and capture content
- Complete containerized local development and test execution using `docker compose`

### Explicit Non-Goals For The First Production Cut

- Fully autonomous proposal writing
- ML-trained probability models
- Deep ERP integration
- Full FedRAMP authorization package
- Native mobile apps
- Multi-region deployment

## Implementation Strategy

Build the system in thin vertical slices, not horizontal layers in isolation. Each completed slice must leave the application in a runnable state with visible user value.

Recommended stack:

- Frontend and server application: Next.js with TypeScript
- Styling and component primitives: Tailwind CSS plus accessible headless components
- Database: PostgreSQL
- ORM and migrations: Prisma
- Validation: Zod
- Background jobs: `pg-boss`
- Authentication: Auth.js with database-backed sessions
- File storage: local disk in development, S3-compatible abstraction in app code
- Testing: Vitest, React Testing Library, Playwright
- Local infrastructure and app orchestration: Docker Compose for the web app, PostgreSQL, worker processes, and test execution

Recommended repository shape:

- `src/app` for routes and layouts
- `src/modules` for domain modules such as opportunities, scoring, tasks, pipeline, knowledge, analytics
- `src/modules/source-integrations` for source connectors, search, normalization, and sync orchestration
- `src/components` for shared UI
- `src/lib` for shared utilities, auth, db, permissions, logging, jobs
- `prisma` for schema and seed data
- `docs` for architecture notes, runbooks, and handoff artifacts
- `scripts` for setup/import utilities

## MVP Architecture Decisions

- Use a single deployable web app first. Do not split into microservices.
- The entire local application stack must run through `docker compose`, including the web app, database, and background worker.
- Keep intelligence deterministic and explainable first. Use rule-based scoring instead of opaque ML.
- Treat the opportunity record as the primary aggregate root.
- Use background jobs only for ingestion, parsing, notifications, and recalculation.
- Separate external source search from internal tracked opportunities, but allow one-click promotion from source result to tracked opportunity.
- Represent pipeline stages, scoring weights, and role permissions as configuration stored in the database where practical.
- Make every major write path produce an audit event.

## Core User Roles

- Admin
- Executive
- Business Development
- Capture Manager
- Proposal Manager
- Contributor
- Viewer

## Core Domain Entities

- User
- Role
- Organization profile
- Opportunity
- Opportunity source
- Source connector
- Source search query
- Source sync run
- Agency
- Contract vehicle
- Competitor
- Opportunity scorecard
- Bid decision
- Pipeline stage transition
- Task
- Milestone
- Document
- Note
- Activity event
- Knowledge asset
- Proposal record
- Audit log

## Product Requirements

### Functional Requirements

- The system must maintain one canonical opportunity record regardless of source.
- The system must support manual opportunity creation and imported opportunity creation.
- The system must support searching external opportunity sources, including `sam.gov`, from within the application.
- The system must let users review source search results and pull selected opportunities into the internal tracking pipeline.
- The system must preserve source metadata and lineage when an externally sourced opportunity is imported.
- The system must support configurable pipeline stages with gate rules.
- The system must calculate a transparent fit score with factor-level explanations.
- The system must record go/no-go recommendations and final human decisions separately.
- The system must support task assignment, due dates, and milestone tracking per opportunity.
- The system must store documents and extracted text for later retrieval.
- The system must expose dashboards for stage distribution, deadlines, and top-ranked opportunities.
- The system must maintain an auditable activity history on each opportunity.
- The system must support reusable knowledge assets tagged by agency, capability, vehicle, and contract type.

### `sam.gov` Search API Contract

The first production source integration must target the official `sam.gov` Get Opportunities Public API v2 search endpoint.

- Endpoint: `https://api.sam.gov/opportunities/v2/search`
- Auth: user- or org-managed `sam.gov` public API key stored as an application secret, never in source control
- Pagination model: `limit` plus `offset`
- API constraints that the product must enforce in validation:
  - `postedFrom` and `postedTo` are mandatory for search requests
  - `postedFrom` and `postedTo` must use `MM/dd/yyyy`
  - posted-date range must not exceed 1 year
  - if `rdlfrom` and `rdlto` are provided, that range must not exceed 1 year
  - `limit` must be numeric and must not exceed `1000`
  - invalid upstream credentials, empty results, and upstream validation failures must surface as explicit UI states

The app must support these explicit `sam.gov` search filters in the UI, internal query DTOs, validation schema, and connector implementation:

- `postedFrom` -> required date
- `postedTo` -> required date
- `limit` -> page size
- `offset` -> page index offset
- `ptype[]` -> procurement type codes; support multi-select
- `noticeid` -> notice ID exact lookup
- `solnum` -> solicitation number
- `title` -> title keyword search
- `organizationName` -> agency or organization name search
- `organizationCode` -> organization code
- `state` -> place of performance state
- `zip` -> place of performance ZIP code
- `typeOfSetAside` -> set-aside code
- `typeOfSetAsideDescription` -> set-aside description text
- `ncode` -> NAICS code
- `ccode` -> classification code
- `rdlfrom` -> response deadline from
- `rdlto` -> response deadline to
- `status` -> active, inactive, archived, cancelled, deleted

The connector should expose the following internal filter model for source-agnostic search:

- `sourceSystem`
- `keywords`
- `postedDateFrom`
- `postedDateTo`
- `responseDeadlineFrom`
- `responseDeadlineTo`
- `procurementTypes[]`
- `noticeId`
- `solicitationNumber`
- `organizationName`
- `organizationCode`
- `naicsCode`
- `classificationCode`
- `setAsideCode`
- `setAsideDescription`
- `placeOfPerformanceState`
- `placeOfPerformanceZip`
- `status`
- `pageSize`
- `pageOffset`

Every saved or executed `sam.gov` search must also persist this typed execution envelope:

- `sourceSystem` -> `sam_gov`
- `canonicalFilters`
  - `keywords`
  - `postedDateFrom`
  - `postedDateTo`
  - `responseDeadlineFrom`
  - `responseDeadlineTo`
  - `procurementTypes[]`
  - `noticeId`
  - `solicitationNumber`
  - `organizationName`
  - `organizationCode`
  - `naicsCode`
  - `classificationCode`
  - `setAsideCode`
  - `setAsideDescription`
  - `placeOfPerformanceState`
  - `placeOfPerformanceZip`
  - `status`
  - `pageSize`
  - `pageOffset`
- `sourceSpecificFilters`
  - reserved object for source-only fields that do not generalize into the canonical DTO
- `outboundRequest`
  - `endpoint` -> `https://api.sam.gov/opportunities/v2/search`
  - `queryParams.postedFrom`
  - `queryParams.postedTo`
  - `queryParams.limit`
  - `queryParams.offset`
  - `queryParams.ptype[]`
  - `queryParams.noticeid`
  - `queryParams.solnum`
  - `queryParams.title`
  - `queryParams.organizationName`
  - `queryParams.organizationCode`
  - `queryParams.state`
  - `queryParams.zip`
  - `queryParams.typeOfSetAside`
  - `queryParams.typeOfSetAsideDescription`
  - `queryParams.ncode`
  - `queryParams.ccode`
  - `queryParams.rdlfrom`
  - `queryParams.rdlto`
  - `queryParams.status`
  - `credentialReference` -> secret reference only, never the raw API key
- `executionMetadata`
  - `requestedByActorId`
  - `requestedByActorType` -> user, system_job, backfill
  - `requestedAt`
  - `connectorVersion`
  - `httpStatus`
  - `responseLatencyMs`
  - `resultCount`
  - `totalRecords`

Notes for implementation:

- Prefer `organizationName` and `organizationCode` as supported organization filters; do not build new product behavior around deprecated `deptname` and `subtier`.
- Treat `ptype` as a multi-select filter in product design because the published OpenAPI spec defines it as an array.
- Store both the normalized query object and the exact outbound request parameters for auditability and replay.
- Persist the source search timestamp, connector version, and requesting user or job actor for every executed search or sync.

The initial supported `ptype` value set must include the official codes currently documented for the public API:

- `u` -> Justification (J&A)
- `p` -> Pre-solicitation
- `a` -> Award Notice
- `r` -> Sources Sought
- `s` -> Special Notice
- `o` -> Solicitation
- `g` -> Sale of Surplus Property
- `k` -> Combined Synopsis/Solicitation
- `i` -> Intent to Bundle Requirements (DoD-Funded)

### Source Connector Extensibility Contract

The `sam.gov` connector must be implemented as the first adapter on top of a source-agnostic integration framework. The product must not hard-code `sam.gov` assumptions into the canonical opportunity model, search UI architecture, or ingestion pipeline.

Future source categories expected after `sam.gov`:

- Other federal contract opportunity systems
- Agency-specific forecast and procurement portals
- State, local, and education procurement sources
- Internal CRM or manually curated pipeline feeds
- Partner or reseller source feeds

Named near-term connector targets that the architecture must explicitly allow for:

- `usaspending_api`
  - Primary role: award and spending intelligence, incumbent analysis, and historical contract context rather than pure pre-award solicitation discovery
  - Expected auth model: `none`
  - Expected capabilities: award search, award detail fetch, scheduled sync, result preview, award-data enrichment
  - Initial data shapes to support: award identifier, recipient, awarding agency, funding agency, award amount, award date, period of performance, NAICS or category context, and related award metadata
  - Design implication: the canonical connector framework must support sources that enrich an opportunity or account record even when the source is not the system of record for new opportunities

- `gsa_ebuy`
  - Primary role: RFQ and requirement discovery for schedule-based opportunities
  - Expected auth model: `session` or `file_import` unless an official public API becomes available
  - Expected search/filter concepts: request number, title keyword, description keyword, issue date range, close date range, category, agency, status, and source
  - Design implication: the connector framework must support non-API or session-backed sources without leaking those assumptions into shared opportunity logic

Every source connector must declare this metadata contract:

- `sourceSystemKey` -> stable internal ID such as `sam_gov`
- `sourceDisplayName`
- `sourceCategory` -> federal, state_local, forecast, internal, partner, other
- `authType` -> api_key, oauth, session, none, file_import
- `supportsSearch`
- `supportsScheduledSync`
- `supportsDetailFetch`
- `supportsDocumentFetch`
- `supportsResultPreview`
- `supportsSavedSearches`
- `supportsIncrementalSync`
- `supportsWebhooks`
- `supportsAttachments`
- `supportsAwardData`
- `defaultPageSize`
- `maxPageSize`
- `rateLimitProfile`
- `connectorVersion`

Every source connector implementation must provide these behaviors:

- `validateConfig(config)` -> verify credentials and required source settings
- `describeCapabilities()` -> expose supported filters, entities, and sync modes
- `translateSearchQuery(canonicalQuery)` -> map canonical filters into source-specific request parameters
- `search(canonicalQuery)` -> return normalized search results plus raw request and response metadata
- `fetchDetail(sourceRecordId)` -> return full source detail payload when the source supports it
- `normalize(rawPayload, context)` -> map source records into the canonical source-record contract
- `upsertSourceRecord(normalizedRecord)` -> persist lineage-safe source data without creating duplicates
- `promoteToOpportunity(sourceRecordId, mode)` -> create or link the canonical opportunity
- `healthCheck()` -> verify operational readiness and credential validity

Canonical source-agnostic search DTO fields must remain the stable product interface even as new sources are added:

- `sourceSystem`
- `keywords`
- `postedDateFrom`
- `postedDateTo`
- `responseDeadlineFrom`
- `responseDeadlineTo`
- `procurementTypes[]`
- `noticeId`
- `solicitationNumber`
- `organizationName`
- `organizationCode`
- `naicsCode`
- `classificationCode`
- `setAsideCode`
- `setAsideDescription`
- `placeOfPerformanceState`
- `placeOfPerformanceZip`
- `status`
- `pageSize`
- `pageOffset`
- `sortBy`
- `sortDirection`

Connector-specific filters may be added without changing the canonical DTO by using:

- `sourceSpecificFilters` -> validated object scoped to a specific `sourceSystem`

Source search and import persistence must support future connectors through these entities:

- `SourceConnectorConfig`
- `SourceSavedSearch`
- `SourceSearchExecution`
- `SourceSyncRun`
- `SourceRecord`
- `SourceRecordAttachment`
- `SourceRecordContact`
- `SourceRecordAward`
- `SourceImportDecision`

Extensibility rules:

- The UI must render common filters from the canonical DTO and source-specific filters from connector capability metadata.
- The ingestion pipeline must accept normalized source records from any connector without branching on `sam.gov` in shared domain code.
- The canonical opportunity record must not store source-specific semantics in top-level fields unless those semantics generalize across connectors.
- Every connector must preserve raw payloads, normalized payloads, normalization version, and source lineage.
- Deduplication must be source-aware but not source-dependent; `noticeId` is authoritative for `sam.gov` only, not globally.
- Scheduled sync must support multiple connectors without changing the job orchestration model.
- Connector failures must be isolated so one bad source does not block other sources or manual opportunity entry.

### Normalized Opportunity Mapping Contract

Every imported external opportunity must preserve the raw source payload and produce a stable normalized record. The app must support replaying normalization after mapping changes without data loss.

Required persisted source-record fields:

- `sourceSystem` -> `sam.gov`
- `sourceRecordId` -> `noticeId`
- `sourceApiEndpoint`
- `sourceUiUrl` -> `uiLink`
- `sourceDetailUrl` -> `links[self].href` when present
- `sourceDescriptionUrl` -> `description`
- `sourceFetchedAt`
- `sourceSearchExecutedAt`
- `sourceSearchQuery`
- `sourceRawPayload`
- `sourceNormalizedPayload`
- `sourceNormalizationVersion`
- `sourceNormalizationAppliedAt`
- `sourceRawPostedDate`
- `sourceRawResponseDeadline`
- `sourceRawArchiveDate`
- `sourceStatusRaw`
- `sourceImportMethod` -> manual pull, scheduled sync, or backfill
- `sourceImportActor`
- `sourceSyncRunId`
- `sourceHashFingerprint`

Required normalized opportunity fields and mappings:

- `externalNoticeId` <- `noticeId`
- `title` <- `title`
- `solicitationNumber` <- `solicitationNumber`
- `sourceSummaryText` <- `description` when a text summary is returned inline; otherwise `null`
- `sourceSummaryUrl` <- `description` when the upstream field is a URL to the public description page
- `postedAt` <- `postedDate`
- `postedDateRaw` <- `postedDate`
- `responseDeadlineAt` <- `responseDeadLine`
- `responseDeadlineRaw` <- `responseDeadLine`
- `procurementTypeLabel` <- `type`
- `procurementBaseTypeLabel` <- `baseType`
- `archiveType` <- `archiveType`
- `archivedAt` <- `archiveDate`
- `archiveDateRaw` <- `archiveDate`
- `isActiveSourceRecord` <- `active == "Yes"`
- `isArchivedSourceRecord` <- `archiveDate != null` or `status == "archived"`
- `sourceStatus` <- `status` if provided by search context, otherwise derived from active or archive fields
- `setAsideCode` <- `typeOfSetAside`
- `setAsideDescription` <- `typeOfSetAsideDescription` or `setAside`
- `naicsCode` <- `naicsCode`
- `classificationCode` <- `classificationCode`
- `organizationType` <- `organizationType`
- `agencyPathName` <- `fullParentPathName` when present, otherwise compose from department, sub-tier, and office
- `agencyPathCode` <- `fullParentPathCode`
- `agencyDepartmentName` <- `department` when present
- `agencySubtierName` <- `subTier` or `subtier` when present
- `agencyOfficeName` <- `office`
- `officeCity` <- `officeAddress.city`
- `officeState` <- `officeAddress.state`
- `officePostalCode` <- `officeAddress.zip` or `officeAddress.zipcode`
- `officeCountryCode` <- `officeAddress.countryCode`
- `placeOfPerformanceStreet1` <- `placeOfPerformance.streetAddress`
- `placeOfPerformanceStreet2` <- `placeOfPerformance.streetAddress2`
- `placeOfPerformanceCityCode` <- `placeOfPerformance.city.code`
- `placeOfPerformanceCityName` <- `placeOfPerformance.city.name`
- `placeOfPerformanceStateCode` <- `placeOfPerformance.state.code`
- `placeOfPerformanceStateName` <- `placeOfPerformance.state.name`
- `placeOfPerformancePostalCode` <- `placeOfPerformance.zip`
- `placeOfPerformanceCountryCode` <- `placeOfPerformance.country.code`
- `additionalInfoUrl` <- `additionalInfoLink`
- `uiLink` <- `uiLink`
- `apiSelfLink` <- `links[self].href` when present
- `resourceLinks[]` <- `resourceLinks`

Required normalized child collections:

- `contacts[]` from `pointOfContact[]`
  - `contactType` <- `type`
  - `fullName` <- `fullName` or `fullname`
  - `title` <- `title`
  - `email` <- `email`
  - `phone` <- `phone`
  - `fax` <- `fax`
  - `additionalInfoText` <- `additionalInfo.content` when present

- `award` from `award`
  - `awardNumber` <- `award.number`
  - `awardAmount` <- `award.amount`
  - `awardDate` <- `award.date`
  - `awardeeName` <- `award.awardee.name`
  - `awardeeUEI` <- `award.awardee.ueiSAM`
  - `awardeeStreet1` <- `award.awardee.location.streetAddress`
  - `awardeeStreet2` <- `award.awardee.location.streetAddress2`
  - `awardeeCityCode` <- `award.awardee.location.city.code`
  - `awardeeCityName` <- `award.awardee.location.city.name`
  - `awardeeStateCode` <- `award.awardee.location.state.code`
  - `awardeeStateName` <- `award.awardee.location.state.name`
  - `awardeePostalCode` <- `award.awardee.location.zip`
  - `awardeeCountryCode` <- `award.awardee.location.country.code`
  - `awardeeCountryName` <- `award.awardee.location.country.name`

- `resourceLinks[]` from `resourceLinks[]`
  - `url` <- each item in `resourceLinks[]`
  - `linkType` <- derived stable enum such as `resource_link`
  - `displayLabel` <- derived from URL host or path when the upstream source does not provide a label

Normalized source-record wrapper fields must remain stable across connectors:

- `normalizationVersion`
- `normalizedAt`
- `sourceSystem`
- `sourceRecordId`
- `canonicalFingerprint`
- `rawPayload`
- `normalizedPayload`
- `importPreviewPayload`
- `warnings[]`

Normalization rules:

- Preserve all raw upstream keys even if they are not mapped into first-class fields yet.
- Normalize dates to UTC ISO timestamps where possible while retaining the raw string values for traceability.
- Trim leading and trailing whitespace on string identifiers such as `solicitationNumber`.
- Normalize blank strings and `"null"`-like string payloads to `null` in normalized fields while retaining raw values in the source payload.
- Deduplication must key first on `noticeId`, then fall back to a weighted match across solicitation number, title, posted date, and organization path.
- Import preview must show both source values and normalized values before the canonical opportunity is created or linked.

### Non-Functional Requirements

- The app must be fully usable on desktop and workable on tablet/mobile.
- Core list pages should remain responsive with realistic seed data.
- External source integrations must degrade gracefully when credentials, rate limits, or upstream availability fail.
- The application must be runnable locally through `docker compose` without requiring host-installed database or worker dependencies.
- User-facing features must have browser-based verification coverage using Playwright with Chromium, unless an explicit temporary exception is documented in `Current Handoff`.
- Permissions must be enforced on both UI and server actions.
- Every create, update, delete, import, score recalculation, and stage transition must be auditable.
- Background jobs must be retryable and idempotent.
- The app must provide empty, loading, error, and permission-denied states.
- The codebase must favor modular domain boundaries over generic utility sprawl.

## Ralph Loops Operating Protocol

This section is mandatory for every future coding iteration because conversation context is non-persistent.

- [ ] At the start of every loop, read `SPEC.md`, `PRD.md`, `README.md`, and inspect `git status`.
- [ ] Treat `PRD.md` as the source of truth for scope, sequencing, and current progress.
- [ ] Pick exactly one unchecked checklist item unless a second item is a trivial follow-up required to make the first item usable.
- [ ] Before editing code, restate the target checklist item and its acceptance criteria in the loop output.
- [ ] Implement the smallest vertical slice that satisfies the selected item end to end.
- [ ] Run the narrowest relevant verification commands after changes.
- [ ] If the task writes or changes code, add or update automated tests for the new or changed behavior and run the full automated test suite that exists in the repo for that phase.
- [ ] If the item changes user-facing behavior, run Playwright against Chromium on the live application where feasible.
- [ ] Do not emit `<promise>complete</promise>` for ordinary loop completion or checklist-item completion. Reserve it for one final project-complete signal only.
- [ ] When setup, workflow, verification, or operational knowledge changes, write explicit documentation in `README.md`; if `README.md` does not exist yet, create it in the same loop.
- [ ] Update this `PRD.md` before ending the loop by checking completed items and appending a short handoff note.
- [ ] If the checklist item is completed and verified, create a non-amended git commit for that item unless the user explicitly says not to commit.
- [ ] If requirements changed, update this document in the same loop so the next agent does not rely on chat history.
- [ ] If blocked, do not guess silently. Add a blocker note under `Current Handoff` and mark the item as blocked in plain text.
- [ ] Never assume prior chat context exists. All required context must live in repo files.

## Definition Of Done For Every Checklist Item

- [ ] Code compiles or the repo remains in a clearly runnable intermediate state with documented next steps.
- [ ] If the task writes or changes code, automated tests covering the new or changed behavior are written or updated in the same loop.
- [ ] If the task writes or changes code, all automated tests in the repo for that phase, including previously written tests and newly written tests, pass in the current loop, or the reason they could not run is written in `Current Handoff` and the item remains incomplete.
- [ ] User-facing work has Playwright verification in Chromium against a live app instance, or the exception is documented in `Current Handoff`.
- [ ] Documentation is updated if setup, behavior, data model, or workflow changed.
- [ ] The feature runs in the `docker compose` stack if the stack exists for that phase.
- [ ] A non-amended git commit was created for the completed item unless the user explicitly asked not to commit.
- [ ] The checklist item is marked complete in this file only after verification.
- [ ] `Current Handoff` records the exact commands run and whether verification used `docker compose` and Playwright.
- [ ] The next recommended checklist item is named in `Current Handoff`.

## Phase Plan

### Phase 0: Foundation And Working Agreement

- [x] P0-01 Initialize the application with Next.js, TypeScript, Tailwind, ESLint, Prettier, Vitest, Playwright, and a basic app shell.
      Done when: the repo installs cleanly, the app starts locally, lint/test scripts exist, a placeholder homepage renders, and Playwright can launch Chromium against the app.
      Verify with: install, lint, unit test, build, and a Playwright Chromium smoke test documented in `README.md`.

- [x] P0-02 Add Docker Compose for the full local stack and an environment variable schema with example env file.
      Done when: the web app, PostgreSQL, and required worker processes start through one compose workflow, required env vars are documented, and the app validates env at boot.
      Verify with: `docker compose up` on the stack, app boot against validated env, and one browser smoke test against the compose-managed app.

- [x] P0-02a Add compose profiles or equivalent workflows for test execution, including Playwright against Chromium.
      Done when: the repo supports containerized test runs for unit, integration, and browser-based end-to-end verification without requiring a manually bootstrapped host environment.
      Verify with: documented compose-based test commands and at least one successful Playwright Chromium run through the containerized workflow.

- [x] P0-03 Create baseline documentation files: `README.md`, `docs/architecture.md`, and `docs/runbook.md`.
      Done when: `README.md` exists and contains explicit setup, stack choices, folder layout, daily dev commands, compose workflows, and verification commands, and `docs/architecture.md` plus `docs/runbook.md` exist with truthful initial project context.
      Verify with: the documentation files exist and reflect actual scripts, files, and currently available workflows in the repo.

- [x] P0-04 Add a persistent `Current Handoff` section to this PRD and update it at the end of every loop.
      Done when: this document contains a handoff template and at least one concrete entry.
      Verify with: `PRD.md` shows current status, next item, blockers, files touched, and tests run.

### Phase 1: Data Model And Core Infrastructure

- [x] P1-01 Create the initial Prisma schema for users, roles, sessions, organizations, and audit logs.
      Done when: auth and audit tables exist with migrations and seed-safe defaults.
      Verify with: Prisma validate, migration generation, and seed run.

- [x] P1-02 Add the core opportunity schema including agencies, vehicles, opportunities, source records, source sync entities, saved source searches, raw source payload storage, and competitors.
      Done when: one opportunity can relate to agency, vehicle, source metadata, import lineage, search lineage, sync history, raw payload retention, and competitor records.
      Verify with: migration plus seed examples covering these relationships.

- [x] P1-02a Add source-connector metadata and persistence models that support more than one external source without schema rewrites.
      Done when: connector configs, saved searches, search executions, sync runs, source records, and promotion decisions are modeled as source-agnostic entities that can support `sam.gov`, `usaspending_api`, and session-backed sources such as `gsa_ebuy` without schema rewrites.
      Verify with: schema examples for `sam.gov` plus one concrete second-source scenario from `usaspending_api` or `gsa_ebuy`.

- [x] P1-03 Add execution schema for tasks, milestones, notes, activity events, documents, stage transitions, scorecards, and bid decisions.
      Done when: the full opportunity workspace can be persisted without TODO schema gaps.
      Verify with: schema tests or seed script that inserts a realistic opportunity workspace.

- [x] P1-04 Add a typed database access layer and shared domain types for the core entities.
      Done when: app code stops reaching directly into raw Prisma models in route handlers without module wrappers.
      Verify with: at least one domain module exposes typed query/service functions.

- [x] P1-05 Create realistic seed data representing multiple agencies, opportunities, stages, tasks, and score outcomes.
      Done when: seeded data is sufficient to exercise dashboards, filtering, and scoring in development.
      Verify with: seed command populates visible demo data.

### Phase 2: Authentication, Authorization, And Auditability

- [x] P2-01 Implement Auth.js sign-in, sign-out, session handling, and protected routes.
      Done when: anonymous users cannot access the app shell and authenticated users can.
      Verify with: auth flow unit coverage and a Playwright sign-in smoke test.

- [x] P2-02 Implement role-based permissions in server-side guards and shared client helpers.
      Done when: restricted actions are blocked even if triggered outside the UI.
      Verify with: permission tests for at least admin, executive, BD, and viewer.

- [x] P2-03 Implement audit event creation for create, update, delete, import, stage transition, and decision actions.
      Done when: important state changes emit structured audit rows with actor, target, action, and timestamp.
      Verify with: tests covering at least three audit-producing flows.

- [x] P2-04 Add a simple admin page for user role visibility and audit-log inspection.
      Done when: admins can inspect recent audit events and see assigned roles.
      Verify with: UI smoke tests and permission enforcement tests.

### Phase 3: App Shell And Navigation

- [x] P3-01 Build the primary authenticated layout with sidebar, top bar, global search placeholder, and responsive navigation.
      Done when: all major sections are navigable and the shell works on desktop and small screens.
      Verify with: responsive UI smoke test in Chromium via Playwright.

- [x] P3-02 Establish shared UI patterns for tables, forms, badges, drawers, dialogs, empty states, and error states.
      Done when: feature modules reuse these primitives instead of reimplementing them.
      Verify with: component stories or usage in at least two pages.

- [x] P3-03 Add a dashboard landing page showing counts by stage, upcoming deadlines, and top opportunities.
      Done when: seeded data renders meaningful dashboard widgets with real queries.
      Verify with: dashboard page tests and a Playwright Chromium dashboard smoke flow.

### Phase 4: Opportunity Management

- [x] P4-01 Build the opportunities list page with search, sort, filter, pagination, and URL-synced query state.
      Done when: users can filter by agency, NAICS or capability tag, stage, due date, and source.
      Verify with: list query tests and one Playwright Chromium filter flow.

- [x] P4-01a Build an external source search page for connectors such as `sam.gov` with keyword and structured filters.
      Done when: users can search available external opportunities by the explicit `sam.gov` filter set defined in this PRD, including posted-date range, response-deadline range, notice ID, solicitation number, procurement type, organization, NAICS, classification code, set-aside, place of performance, and status.
      Verify with: search parameter tests and one Playwright Chromium search flow using mocked connector responses.

- [x] P4-01b Add source-result actions to preview, deduplicate, and pull an external opportunity into the tracking pipeline.
      Done when: a user can select a source result, review raw and normalized details side by side, detect likely duplicates, and create or link the canonical tracked opportunity.
      Verify with: deduplication tests and one Playwright Chromium UI flow covering import from search result.

- [x] P4-02 Build create and edit flows for opportunities with validation and autosaved draft behavior where practical.
      Done when: users can create and update opportunities without direct database manipulation.
      Verify with: form validation tests and a Playwright Chromium happy-path UI test.

- [x] P4-03 Build the opportunity detail workspace with overview, scoring, tasks, documents, notes, and history sections.
      Done when: a user can stay inside one workspace to understand and execute a pursuit.
      Verify with: integration test covering page load and section data rendering plus a Playwright Chromium workspace smoke flow.

- [x] P4-04 Add stage transition controls with required-field gating and recorded rationale.
      Done when: invalid stage changes are blocked and valid changes emit activity and audit records.
      Verify with: tests for blocked and allowed transitions.

### Phase 5: Tasks, Milestones, And Collaboration

- [x] P5-01 Implement task CRUD with assignee, due date, status, priority, and opportunity linkage.
      Done when: tasks can be created from an opportunity and surfaced in personal views.
      Verify with: task service tests and a Playwright Chromium UI smoke test.

- [x] P5-02 Implement milestone tracking for key capture dates, proposal deadlines, and decision checkpoints.
      Done when: milestones appear in the opportunity workspace and on the dashboard.
      Verify with: milestone queries render in both places.

- [x] P5-03 Implement notes and activity feed entries with actor attribution and timestamps.
      Done when: users can add context and see a chronological trail of important events.
      Verify with: notes create/display tests.

- [x] P5-04 Add deadline reminders and overdue indicators using a background job.
      Done when: upcoming and overdue tasks or milestones are detectable without page polling logic.
      Verify with: job execution test and visible reminder state in UI.

### Phase 6: Scoring, Decision Support, And Down-Selection

- [x] P6-01 Create the organization profile and scoring configuration models for capabilities, certifications, vehicles, and weighted criteria.
      Done when: the system has structured input data required to score an opportunity.
      Verify with: admin form or seed path to manage scoring inputs.

- [x] P6-02 Implement the deterministic scoring engine for capability fit, strategic alignment, vehicle access, relationship strength, schedule realism, and risk.
      Done when: every opportunity can produce a normalized score and factor breakdown.
      Verify with: pure unit tests for scoring formulas and edge cases.

- [x] P6-03 Implement go/no-go recommendation logic that combines score, risk, and configurable thresholds.
      Done when: the app produces a recommended decision with explanation but still allows human override.
      Verify with: tests covering recommend-go, recommend-no-go, and borderline cases.

- [x] P6-04 Build the scoring and decision UI in the opportunity workspace.
      Done when: users can inspect factor weights, rationale, recommendation, and final decision history.
      Verify with: UI integration test on the opportunity detail page and a Playwright Chromium decision-view flow.

- [x] P6-05 Build a decision console page ranking opportunities by value, score, urgency, or risk.
      Done when: leadership can sort and compare pursuit options across the pipeline.
      Verify with: ranking query tests and one Playwright Chromium browser flow.

### Phase 7: Ingestion, Normalization, And Documents

- [ ] P7-01 Implement CSV import for opportunities with preview, mapping, validation, and deduplication.
      Done when: users can ingest spreadsheets without direct database edits.
      Verify with: import parser tests and a sample file fixture.

- [ ] P7-02 Add document upload support with stored metadata, linked opportunity records, and extracted plain text.
      Done when: PDF, DOCX, or TXT files can be attached and text extraction succeeds for common cases.
      Verify with: upload and extraction tests using small fixtures.

- [ ] P7-03 Implement a source connector abstraction and build the first live connector for `sam.gov`.
      Done when: the app can authenticate to `sam.gov`, execute the full supported filter set, fetch normalized opportunity details, preserve raw payloads, and pass selected results into the import pipeline on demand or by schedule, all through a reusable connector interface that can also accommodate award-centric sources such as `usaspending_api` and constrained-access sources such as `gsa_ebuy`.
      Verify with: connector translation and normalization tests plus a manual search/import run against the configured `sam.gov` source.

- [ ] P7-04 Implement deduplication and canonicalization rules for multi-source opportunities.
      Done when: duplicate imports merge into one opportunity record with source lineage preserved.
      Verify with: tests for exact-match and fuzzy-match scenarios.

- [ ] P7-05 Add background jobs for scheduled ingestion, document parsing retries, and score recalculation after imports.
      Done when: ingestion and parsing workloads are asynchronous, retryable, and idempotent.
      Verify with: job tests and manual runbook steps.

- [ ] P7-06 Add source sync observability for connector health, last successful sync, rate-limit handling, and failed import review.
      Done when: admins can inspect whether `sam.gov` searches and imports are healthy and retry failed runs without touching the database directly.
      Verify with: job/admin tests and manual review of sync status UI.

### Phase 8: Knowledge System

- [ ] P8-01 Build a knowledge asset model and CRUD UI for past-performance snippets, boilerplate content, and win themes.
      Done when: assets can be created, tagged, filtered, and linked to opportunities.
      Verify with: CRUD tests and a Playwright Chromium browse/create flow.

- [ ] P8-02 Implement tagging and retrieval by agency, capability, contract type, and vehicle.
      Done when: relevant assets can be filtered down quickly in the UI.
      Verify with: query tests on seeded tagged content.

- [ ] P8-03 Surface suggested knowledge assets inside the opportunity workspace based on current opportunity metadata.
      Done when: users see reusable content suggestions without leaving the workspace.
      Verify with: suggestion ranking tests and detail-page rendering.

### Phase 9: Analytics And Feedback Loops

- [ ] P9-01 Build pipeline analytics for stage counts, conversion rates, aging, and upcoming deadlines.
      Done when: leadership can evaluate pipeline health from the dashboard area.
      Verify with: analytics query tests and dashboard widgets.

- [ ] P9-02 Build decision analytics for bid volume, go/no-go outcomes, score distribution, and effort versus outcome.
      Done when: the system starts showing whether decision quality is improving.
      Verify with: seeded analytics outputs and snapshot-style query tests.

- [ ] P9-03 Add win/loss outcome capture and postmortem fields.
      Done when: closed opportunities can record outcome reason, competitor, and lessons learned.
      Verify with: closeout form and persistence tests.

- [ ] P9-04 Add an admin recalibration workflow for updating scoring weights based on observed outcomes.
      Done when: scoring configuration can evolve without code edits.
      Verify with: config update tests and recalculation flow.

### Phase 10: Proposal Layer, Integrations, And Hardening

- [ ] P10-01 Add a lightweight proposal record with status, owner, compliance checklist, and linked documents.
      Done when: proposal execution can be tracked after pursuit approval without building full authoring.
      Verify with: proposal CRUD tests and workspace rendering.

- [ ] P10-02 Add integration boundaries for CRM export or sync, document repositories, and communication tools.
      Done when: outbound or inbound integration can be added behind stable interfaces without rewriting core modules.
      Verify with: interface tests or stub adapters.

- [ ] P10-03 Add observability and operational safeguards including structured logs, error boundaries, and health checks.
      Done when: failures are diagnosable and basic runtime health can be inspected.
      Verify with: health endpoint tests, compose-managed service validation, and manual error-path validation.

- [ ] P10-04 Perform end-to-end launch hardening: permissions review, seed reset flow, empty/error state review, and deployment docs.
      Done when: the repo is ready for a controlled internal pilot.
      Verify with: Playwright Chromium regression pass against the compose-managed stack and updated runbook.

## Release Gates

- [ ] MVP Gate: Phases 0 through 7 are complete and the system supports real opportunity intake, scoring, workspace execution, and dashboards.
- [ ] Beta Gate: Phases 8 and 9 are complete and the system supports knowledge reuse plus feedback loops.
- [ ] Pilot Gate: Phase 10 is complete and the app is ready for a real internal team trial.

## Quality Bar

- [ ] Prefer server-side data access and validation over client-only logic.
- [ ] Keep business rules in domain modules, not scattered across pages.
- [ ] Add or update tests for every code change, including business logic, permissions, parsing, scoring, imports, and UI behavior where applicable.
- [ ] Do not consider a code-writing task complete until the full automated test suite for the current phase passes, including previously existing tests and newly added tests.
- [ ] Use feature folders and explicit file names so a new agent can find context quickly.
- [ ] Update docs whenever setup or architecture changes.

## Current Handoff

Update this section at the end of every coding loop.

- Current status: `P0-01`, `P0-02`, `P0-02a`, `P0-03`, `P0-04`, `P1-01`, `P1-02`, `P1-02a`, `P1-03`, `P1-04`, `P1-05`, `P2-01`, `P2-02`, `P2-03`, `P2-04`, `P3-01`, `P3-02`, `P3-03`, `P4-01`, `P4-01a`, `P4-01b`, `P4-02`, `P4-03`, `P4-04`, `P5-01`, `P5-02`, `P5-03`, `P5-04`, `P6-01`, `P6-02`, `P6-03`, `P6-04`, and `P6-05` are complete. This loop replaced the `/analytics` placeholder with a guarded decision console backed by a typed repository snapshot, added deterministic ranking lenses for value, score, urgency, and risk plus active-vs-all scope, documented the temporary `value == strategic alignment` assumption, and hid analytics navigation for roles that lack `view_decision_support`.
- Next recommended item: `P7-01 Implement CSV import for opportunities with preview, mapping, validation, and deduplication.`
- Blockers: No product blocker for `P7-01`. Unrelated repo sync blocker remains: the earlier local history rewrite still has not been force-pushed to `origin` from this environment because the remote is SSH-based and this runtime lacks an authenticated SSH path.
- Files touched in latest loop: `NOTES.md`, `PRD.md`, `README.md`, `docs/architecture.md`, `docs/security.md`, `docs/testing.md`, `src/app/(app)/analytics/page.tsx`, `src/app/(app)/layout.tsx`, `src/components/analytics/decision-console.test.tsx`, `src/components/analytics/decision-console.tsx`, `src/components/layout/authenticated-app-shell.test.tsx`, `src/components/layout/authenticated-app-shell.tsx`, `src/modules/opportunities/opportunity.repository.test.ts`, `src/modules/opportunities/opportunity.repository.ts`, `src/modules/opportunities/opportunity.types.ts`, and `tests/smoke.spec.ts`.
- Tests run in latest loop: `npm test -- src/modules/opportunities/opportunity.repository.test.ts src/components/analytics/decision-console.test.tsx src/components/layout/authenticated-app-shell.test.tsx`; `npm run lint`; `npm run build`; `docker compose up -d db`; `npm run prisma:validate`; `npm run db:seed`; `npm test`; `npm run build`; `npm run e2e`; `make compose-test-lint`; `make compose-test`; `make compose-test-build`; `make compose-test-e2e`; `make compose-down`; and `git diff --check`. Verification used Docker and Playwright.
