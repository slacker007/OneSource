# OneSource Security Baseline

## Purpose

This document records the current security posture that exists in the repo today. It should evolve alongside authentication, authorization, auditability, connector handling, and deployment hardening.

## Current Baseline

The current repo includes the first live authentication, authorization, audit-emission, and admin-visibility slices on top of the earlier auth and audit persistence baseline plus the connector-metadata and workspace-persistence baselines. Security-relevant implementation present today:

- Prisma-managed tables for organizations, users, roles, accounts, sessions, verification tokens, and audit logs
- Prisma-managed organization scoring-input tables for organization profiles, capabilities, certifications, selected profile vehicles, and weighted scoring criteria
- Prisma-managed opportunity lineage tables for agencies, vehicles, opportunities, competitors, connector configs, saved searches, search executions, sync runs, retained source records, source child records, and import decisions
- Prisma-managed workspace tables for tasks, milestones, notes, documents, stage transitions, scorecards, bid decisions, and activity events
- Auth.js credentials-provider sign-in backed by seeded local users
- scrypt-based password-hash verification for local development credentials
- JWT-backed sessions enriched with `organizationId` and `roleKeys`
- shared role-to-permission policy helpers that can run in both server and client code
- server-side protected-route gating in the `(app)` route group
- server-side permission guards for restricted routes and mutating surfaces such as `/analytics`, `/settings`, source import actions under `/sources`, and `/opportunities/new` plus `/opportunities/[opportunityId]/edit`, with a public permission-denied route
- structured JSON logging for degraded health checks plus opportunity-document download authentication, authorization, and local-disk failure paths
- authenticated-shell navigation that hides the analytics route when the signed-in role set lacks `view_decision_support`
- an admin console that lets admins inspect current role assignments, recent audit events, source-sync health, and the seeded organization scoring profile, and lets only `manage_workspace_settings` users recalibrate scoring weights and thresholds with audited server-side writes
- database-backed role assignments rather than hard-coded role enums in application code
- append-oriented audit-log storage with actor, target, summary, and JSON metadata fields
- shared audited opportunity write services for create, update, delete, import-decision, stage-transition, and bid-decision flows
- boot-time environment validation for `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`, and the optional `sam.gov` connector runtime settings
- compose-managed PostgreSQL for local development

## Seed Defaults

The local seed command creates development-only bootstrap records:

- organization slug: `default-org`
- local users: `admin@onesource.local`, `jamie.chen@onesource.local`, `taylor.reed@onesource.local`, `morgan.patel@onesource.local`, `sam.rivera@onesource.local`, `casey.brooks@onesource.local`, and `avery.stone@onesource.local`
- system roles: admin, executive, business development, capture manager, proposal manager, contributor, viewer

These values are intended for local development only. They are not production credentials and must not be used as real identity defaults in deployed environments.

The current local credentials flow uses the shared development password documented in `src/lib/auth/local-demo-auth.mjs` and applied to each seeded user through deterministic password hashes. This is acceptable only for local development and test verification.

## Source Data Provenance

- External source payloads are treated as untrusted input and are stored in `source_records` as raw JSON plus normalized JSON for traceability.
- The executable `sam.gov` connector now persists outbound request envelopes in `source_search_executions`, retains normalized `source_records`, and materializes normalized attachment/contact/award child rows before any preview or import action is allowed.
- Source-import canonicalization now distinguishes exact source matches, exact notice matches, and weighted fuzzy duplicates on the server so strong duplicate imports merge into one canonical opportunity while every retained `source_record` still preserves its own lineage row.
- The seed path demonstrates raw payload retention, normalized payload retention, import-preview payload retention, attachment/contact retention for `sam.gov`, award-enrichment retention for `usaspending_api`, and multiple manual opportunities with varied stage and decision outcomes for development-only dashboard work.
- Search lineage and sync lineage are persisted separately through `source_search_results` and `source_sync_run_records` so later workflows can explain how a source record entered the system.
- Promotion decisions are stored separately in `source_import_decisions`, which preserves whether a source record created a new canonical opportunity or only linked enrichment data to an existing one, and now records requested-versus-applied import mode metadata when deduplication auto-merges a create request into an existing canonical opportunity.
- Workspace documents now support extracted text retention. Treat those rows as potentially sensitive because the extracted content can contain customer requirements, solution details, or partner information.

## Secrets And Configuration

- `DATABASE_URL` is required and loaded from `.env` through `prisma.config.ts` and the runtime env parser.
- `AUTH_SECRET` is required and is used by Auth.js to sign and verify session tokens.
- `NEXTAUTH_URL` is required and must be an absolute base URL so Auth.js redirect handling stays deterministic.
- `DOCUMENT_UPLOAD_DIR` controls where guarded local opportunity-document uploads are stored on disk. The default development value is `.data/opportunity-documents`.
- `SAM_GOV_API_KEY` is optional in local development and required only when the connector is running in live upstream mode.
- `SAM_GOV_SEARCH_ENDPOINT` defaults to the official `https://api.sam.gov/prod/opportunities/v2/search` endpoint and should only be overridden for controlled testing.
- `SAM_GOV_TIMEOUT_MS` bounds connector request duration.
- `SAM_GOV_USE_FIXTURES` switches the connector into deterministic fixture mode for automated verification and should remain `false` in production-like environments.
- `.env` is ignored by git; `.env.example` is the only committed env file.
- Connector configs can store a `credentialReference` string, but the repo still stores only secret references such as `secret://sam-gov/public-api-key`, never raw connector credentials.
- The new Phase 10 integration-boundary module ships dry-run CRM, document-repository, and communication adapters only; it prepares canonical payloads but does not yet persist external credentials or perform live outbound dispatch.
- No production API keys, auth provider secrets, or session secrets are committed.

## Audit Model

The `audit_logs` table is the durable sink for future security-relevant activity. Current fields support:

- optional organization scope
- optional user actor linkage
- actor type and free-form actor identifier
- action string
- target type and target identifier
- human-readable summary
- structured JSON metadata
- optional IP address and user-agent capture
- immutable occurrence timestamp

Current audit producers are the bootstrap seed path, the shared opportunity write service under `src/modules/opportunities/opportunity-write.service.ts`, and the source-import canonicalization flow under `src/modules/source-integrations/source-import.service.ts`. Those boundaries emit structured audit rows for representative create, update, delete, import-decision, stage-transition, bid-decision, and canonical merge refresh flows.

## Current Risks And Pending Work

- Only the initial role-based authorization slice exists today. The app shell requires authentication, `/analytics` requires `view_decision_support`, `/settings` requires the admin role, source-search and CSV import actions require `manage_source_searches`, and the tracked-opportunity create/edit flows require `manage_pipeline`, but most business workflows still need finer-grained per-action and per-record enforcement.
- CSV import rows are treated as untrusted input. The browser preview is advisory only; the server action rebuilds the preview from uploaded CSV text, revalidates mapped fields, and rechecks duplicates before importing ready rows into the pipeline.
- Document uploads are treated as untrusted input. The server action revalidates the file metadata, bounds file size, writes under the configured storage root, and only exposes downloads back through an authenticated organization-scoped route.
- Plain-text extraction currently runs only for UTF-8 text-like uploads. Binary formats are retained with explicit `NOT_REQUESTED` extraction status so later retry jobs can process them without fabricating content.
- The current admin console is read-only and meant for visibility, not user-role mutation or audit remediation workflows yet.
- Fixture-backed connector mode is for deterministic local and CI-style verification only; it is not evidence that live upstream credentials, rate limits, or validation failure handling have been exercised in this environment.
- No auth-event or permission-failure audit emission yet
- Auth events and permission failures still do not emit audit rows, and many future user-facing mutations have not been wired to the audited write-service boundary yet
- The new integration boundary proves contract shape only; no live external-system auth, outbound delivery, webhook verification, or callback-signature validation exists yet
- No production-grade password reset, OAuth, MFA, or account-recovery workflow yet
- No secret-vault integration behind connector credential references yet
- Credentialed live `sam.gov` validation is intentionally deferred to post-project follow-on `FP-01`; its absence does not block current fixture-backed `P7-03` acceptance
- No authorization guardrails around specific retained source records, workspace notes, documents, or future mutating actions yet

Until the later hardening items are complete, this authz slice should be treated as a baseline security boundary rather than full production-ready RBAC coverage.
