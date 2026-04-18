# 2026-04-18 `sam.gov` Connector Runtime Note

## Source

- Official documentation: `https://open.gsa.gov/api/get-opportunities-public-api/`

## Decision Impact

- The executable `sam.gov` connector uses the documented production search endpoint `https://api.sam.gov/prod/opportunities/v2/search`.
- The connector translates the canonical OneSource search DTO into the upstream query-parameter shape rather than letting page code assemble transport details directly.
- Search execution now persists outbound request envelopes in `source_search_executions` and retains normalized `source_records` before preview or import actions run.
- Deterministic fixture mode was added so host and compose verification can exercise the connector-backed `/sources` flow without depending on upstream availability or live credentials.

## Assumptions

- The public API key is passed as a query parameter as documented by GSA.
- The `/prod/opportunities/v2/search` endpoint remains the canonical production search path for this integration baseline.

## Open Questions

- Live upstream behavior from this environment is still unverified because no `SAM_GOV_API_KEY` is configured here.
- Manual live search and import verification is now deferred to post-project follow-on `FP-01`; deterministic fixture-backed verification is the current acceptance path for `P7-03`.
