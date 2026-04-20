# ADR 0002: Source-Agnostic Connector Boundary

- Status: Accepted
- Recorded: 2026-04-20

## Context

`sam.gov` is the first live connector, but the product requirements and current seed data already assume additional sources such as `usaspending_api`, `gsa_ebuy`, and CSV upload. The codebase persists connector configs, saved searches, search executions, sync runs, retained source records, and import decisions in source-agnostic tables, and the shared opportunity model must not become dependent on one upstream system.

## Decision

Preserve a source-agnostic integration boundary with these rules:

- canonical search DTOs remain the stable product interface for external discovery
- each connector translates canonical filters into source-specific requests behind its own adapter
- raw payloads, normalized payloads, execution envelopes, and import lineage are retained per source record
- promotion into a tracked opportunity happens through an import-decision boundary rather than page-local mapping
- shared opportunity logic must not branch on `sam.gov` semantics outside connector-owned normalization and translation code

## Consequences

Positive:

- new connectors can be added without rewriting the opportunity domain model
- search, preview, sync, deduplication, and import workflows remain auditable across sources
- sources that enrich existing opportunities, not just create new ones, fit the same persistence model

Tradeoffs:

- connector DTOs and normalization contracts must remain disciplined even when only one live connector exists
- product UI surfaces have to support both canonical filters and connector-specific capability metadata
- source-aware deduplication still needs careful tuning because no single external identifier is globally authoritative
