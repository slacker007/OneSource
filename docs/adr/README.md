# OneSource Architecture Decision Records

This directory holds the durable record of high-impact architecture decisions that are already implemented in the repo.

Current ADRs:

- [ADR 0001](./0001-modular-monolith-and-compose-first-runtime.md): keep OneSource as a modular monolith with a Compose-first local runtime
- [ADR 0002](./0002-source-agnostic-connector-boundary.md): preserve a source-agnostic connector boundary and canonical search DTO
- [ADR 0003](./0003-deterministic-auditable-scoring.md): keep scoring and recommendations deterministic, explainable, and auditable before any ML-assisted layer

Add a new ADR when a decision is hard to reverse, materially changes operational expectations, or creates a stable contract other modules must preserve.
