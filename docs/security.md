# OneSource Security Baseline

## Purpose

This document records the current security posture that exists in the repo today. It should evolve alongside authentication, authorization, auditability, connector handling, and deployment hardening.

## Current Baseline

The current repo includes the first persistence slice for auth and audit work plus the connector-metadata and workspace-persistence baselines, but it does not yet expose live sign-in flows. Security-relevant implementation present today:

- Prisma-managed tables for organizations, users, roles, accounts, sessions, verification tokens, and audit logs
- Prisma-managed opportunity lineage tables for agencies, vehicles, opportunities, competitors, connector configs, saved searches, search executions, sync runs, retained source records, source child records, and import decisions
- Prisma-managed workspace tables for tasks, milestones, notes, documents, stage transitions, scorecards, bid decisions, and activity events
- database-backed role assignments rather than hard-coded role enums in application code
- append-oriented audit-log storage with actor, target, summary, and JSON metadata fields
- boot-time environment validation for `DATABASE_URL`
- compose-managed PostgreSQL for local development

## Seed Defaults

The local seed command creates development-only bootstrap records:

- organization slug: `default-org`
- admin user: `admin@onesource.local`
- system roles: admin, executive, business development, capture manager, proposal manager, contributor, viewer

These values are intended for local development only. They are not production credentials and must not be used as real identity defaults in deployed environments.

## Source Data Provenance

- External source payloads are treated as untrusted input and are stored in `source_records` as raw JSON plus normalized JSON for traceability.
- The seed path demonstrates raw payload retention, normalized payload retention, import-preview payload retention, attachment/contact retention for `sam.gov`, and award-enrichment retention for `usaspending_api`.
- Search lineage and sync lineage are persisted separately through `source_search_results` and `source_sync_run_records` so later workflows can explain how a source record entered the system.
- Promotion decisions are stored separately in `source_import_decisions`, which preserves whether a source record created a new canonical opportunity or only linked enrichment data to an existing one.
- Workspace documents now support extracted text retention. Treat those rows as potentially sensitive because the extracted content can contain customer requirements, solution details, or partner information.

## Secrets And Configuration

- `DATABASE_URL` is required and loaded from `.env` through `prisma.config.ts` and the runtime env parser.
- `.env` is ignored by git; `.env.example` is the only committed env file.
- Connector configs can store a `credentialReference` string, but the repo still stores only secret references such as `secret://sam-gov/public-api-key`, never raw connector credentials.
- No API keys, auth provider secrets, or session secrets are committed yet.

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

The only current producer is the bootstrap seed path. Future loops must add audit writes for auth events, permission failures, imports, edits, stage transitions, and decisions.

## Current Risks And Pending Work

- No live authentication flow yet
- No server-side authorization guards yet
- No session-secret management yet
- No route-level or action-level audit emission yet
- No password, OAuth, MFA, or account-recovery workflow yet
- No secret-vault integration behind connector credential references yet
- No authorization guardrails around access to retained source records, workspace notes, or extracted document text yet

Until `P2-01` and `P2-02` are complete, this schema should be treated as a persistence baseline rather than an end-user security feature.
