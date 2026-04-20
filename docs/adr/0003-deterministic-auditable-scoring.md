# ADR 0003: Deterministic And Auditable Scoring First

- Status: Accepted
- Recorded: 2026-04-20

## Context

OneSource is intended to improve pursuit decisions, but the first production cut must remain explainable, testable, and auditable. The repo already implements weighted scoring criteria, threshold-driven `GO` or `DEFER` or `NO_GO` recommendations, factor-level explanations, human decision override history, and recalibration through admin-managed scoring configuration.

## Decision

Keep the recommendation layer deterministic and explicitly auditable before introducing any ML-assisted ranking or proposal intelligence:

- calculate scorecards from persisted organization profile inputs plus opportunity metadata
- store factor-level outputs and recommendation thresholds as durable data, not opaque model state
- preserve the distinction between machine recommendation and final human decision
- require recalibration through explicit configuration changes and auditable write paths

## Consequences

Positive:

- recommendation behavior is testable with unit and integration coverage
- leadership can inspect why a score or recommendation was produced
- later AI-assisted features can be layered on top of a traceable baseline instead of replacing it

Tradeoffs:

- scoring remains limited by the quality of structured inputs and configured heuristics
- the product does not yet attempt probabilistic win modeling or opaque prediction
- future ML-assisted features will need separate guardrails, evaluation, and provenance rather than reusing this deterministic path implicitly
