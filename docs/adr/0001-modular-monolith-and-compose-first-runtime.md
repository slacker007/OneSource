# ADR 0001: Modular Monolith And Compose-First Runtime

- Status: Accepted
- Recorded: 2026-04-20

## Context

OneSource needs production-grade behavior, but the current product scope is still evolving across opportunity management, source integrations, scoring, analytics, and workspace execution. The repo already runs as one Next.js application with typed module boundaries, a shared PostgreSQL database, and a background worker. The local verification and recovery workflows also depend on `docker compose` as the standard runtime surface.

## Decision

Keep OneSource as a modular monolith:

- one deployable Next.js application for web UI, route handlers, and server actions
- one PostgreSQL database as the primary persistence boundary
- one worker process for retryable background sweeps
- `src/modules/*` as the internal domain boundary instead of splitting into networked services

Keep `docker compose` as the canonical local orchestration surface for development, test, browser verification, and operational recovery.

## Consequences

Positive:

- product slices can ship vertically without paying distributed-systems overhead
- route handlers can reuse shared typed domain services without network translation layers
- the compose-managed app, database, worker, and Playwright flows stay aligned with the documented verification path

Tradeoffs:

- module boundaries must stay explicit so the monolith does not collapse into page-level coupling
- worker jobs and integration adapters must remain isolated from shared domain logic even though they run in the same repo
- later service extraction, if ever needed, should happen from stable module contracts rather than from ad hoc page code
