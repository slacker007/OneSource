# 2026-04-17 Connector And Engineering Standards Research Note

## Scope

This note captures the external research used to tighten `PRD.md` and `AGENTS.md` for:

- `sam.gov` search filters and normalization requirements
- future connector support for USAspending and GSA eBuy
- production-grade engineering, security, containerization, observability, testing, and AI-agent practices

## Primary Sources

### `sam.gov`

- GSA Open Government API docs: `https://open.gsa.gov/api/get-opportunities-public-api/`
- `sam.gov` Get Opportunities API OpenAPI spec: `https://api.sam.gov/prod/opportunities/v2/api-details`

### USAspending

- USAspending API intro/tutorial: `https://api.usaspending.gov/docs/intro-tutorial`
- USAspending endpoint index: `https://api.usaspending.gov/docs/endpoints`

### GSA eBuy

- GSA eBuy Open user guide PDF: `https://www.ebuy.gsa.gov/ebuyopen/assets/eBuyOpenUserGuide.pdf`
- GSA eBuy access guidance: `https://www.gsa.gov/buy-through-us/products-and-services/professional-services/buy-services/oasis-plus/buyers-guide/gsa-ebuy-for-oasis`

### Engineering, Security, Observability, And AI-Agent Standards

- NIST Secure Software Development Framework: `https://csrc.nist.gov/projects/ssdf`
- OWASP Application Security Verification Standard: `https://owasp.org/www-project-application-security-verification-standard/`
- OWASP GenAI Security Project: `https://genai.owasp.org/introduction/`
- The Twelve-Factor App: `https://12factor.net/`
- OpenTelemetry signals: `https://opentelemetry.io/docs/concepts/signals/`
- Playwright Docker guidance: `https://playwright.dev/docs/docker`
- OpenAI evals guide: `https://platform.openai.com/docs/guides/evals`
- OpenAI agent safety guidance: `https://platform.openai.com/docs/guides/agent-builder-safety`
- Anthropic prompt engineering best practices: `https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/claude-4-best-practices`

## Findings

### 1. `sam.gov` search needs an explicit request and execution contract

The official `sam.gov` public opportunities search documentation and OpenAPI specification define:

- `postedFrom` and `postedTo` as required request parameters
- posted and response-deadline date ranges constrained to one year
- `limit` with an upper bound of `1000`
- `ptype` as a multi-value filter
- supported search fields including notice ID, solicitation number, title, organization name and code, state, ZIP, set-aside fields, NAICS, classification code, response deadline range, and status

Decision impact:

- `PRD.md` now requires a typed `sam.gov` search execution envelope, not just a loose list of filters.
- The product must persist both canonical filters and exact outbound request parameters for replay, audit, and troubleshooting.
- The connector design must treat `ptype` as a multi-select and must not rely on deprecated organization filter behavior.

### 2. `sam.gov` normalization must preserve both traceability and replayability

The public opportunities docs and schema show stable response fields such as notice ID, title, solicitation number, posted date, response deadline, type/base type, archive fields, active state, set-aside fields, organization fields, office address, place of performance, points of contact, award data, UI links, and related resource links.

Decision impact:

- `PRD.md` now distinguishes raw source values from normalized fields where date parsing or status derivation occurs.
- The normalized record contract now includes raw date retention, stable wrapper metadata, fingerprinting, import-preview payloads, and normalized child collections for contacts, awards, and resource links.
- Future normalization replays can occur without losing the original upstream payload.

### 3. USAspending is a different connector class than `sam.gov`

USAspending exposes a documented API and endpoint catalog oriented around award and spending data rather than live solicitation search.

Decision impact:

- The connector framework must support sources that enrich opportunity decisions with incumbent and spend intelligence even when they are not the primary opportunity-discovery system.
- `PRD.md` now names `usaspending_api` as a near-term connector target and preserves room for award-centric search and detail-fetch behavior.

### 4. GSA eBuy should not be modeled as a normal public API connector

The eBuy Open materials and access guidance show search concepts such as request number, title, description, issue date, close date, category, agency, status, and source, but they do not present the product as an openly documented public API similar to `sam.gov`.

Decision impact:

- `PRD.md` now treats `gsa_ebuy` as a connector that may require session-based automation or file-import-assisted workflows.
- The shared connector architecture must support constrained-access or non-API sources without pushing those assumptions into the canonical opportunity model.

### 5. Production-grade loop closure requires stronger verification and evidence

NIST SSDF, OWASP ASVS, Twelve-Factor, Playwright Docker guidance, and OpenTelemetry guidance all reinforce predictable environments, secure defaults, verification evidence, and operational diagnosability.

Decision impact:

- `AGENTS.md` now requires `docker compose` as the canonical local stack and prefers compose-managed verification once the stack exists.
- User-facing work now requires Playwright on Chromium against a live app unless the repo state makes that impossible and the gap is documented.
- `PRD.md` now requires `Current Handoff` to include exact verification commands and whether compose and Playwright were used.

### 6. AI-agent practices need explicit safety and quality requirements

OWASP GenAI guidance plus OpenAI and Anthropic agent/prompt guidance emphasize treating prompts and retrieved content as untrusted, using structured outputs, retaining traceability, and evaluating AI-assisted workflows before production use.

Decision impact:

- `AGENTS.md` now treats AI-generated code and model outputs as untrusted drafts that require inspection and verification.
- The repo standard now explicitly blocks arbitrary external text from directly driving privileged actions or destructive mutations.
- Future AI-assisted product features must include structured outputs, guardrails, human-review checkpoints for high-impact actions, and evaluation coverage.

## Assumptions And Open Questions

- `sam.gov` search and detail payloads may vary slightly across endpoint versions and documentation snapshots; implementation should rely on captured fixtures and validation schemas when coding begins.
- USAspending may be more valuable initially as enrichment rather than as a first-class opportunity discovery source; this should be revisited once capture-user workflows are prototyped.
- GSA eBuy access and automation constraints may require legal, operational, or terms-of-use review before a live connector is built.
- Browser-test and compose conventions should be tightened again once the app scaffold exists and actual service names, ports, and CI workflows are known.
