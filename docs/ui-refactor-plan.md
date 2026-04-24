# OneSource UI Refactor Plan

## Purpose

This document is the durable Ralph-Loop execution plan for OneSource UI evolution, anchored in `PRD.md` and the engineering rules in `AGENTS.md`.

The goal is not a cosmetic reskin. The goal is to turn the current product into a denser, more operational, enterprise-grade capture command center while preserving the functional coverage already delivered in Phases `P0` through `P10`.

## Source Inputs

- `PRD.md`
- `AGENTS.md`
- Current route and component inventory under `src/app` and `src/components`
- Historical UI direction previously captured in the removed root-level guide, now folded into this document for durable repo memory

## Program Guardrails

- Preserve feature parity while changing information architecture, hierarchy, and interaction design.
- Keep every loop scoped to one checklist item from the UI refactor program unless a trivial dependent follow-up is required to make that item usable.
- Reuse existing server-side modules, validation, permissions, and audit paths wherever possible. The refactor should change the UI operating model, not scatter business logic into components.
- Do not copy GovWin IQ layouts, copy, colors, iconography, or page composition. Borrow only the abstract product qualities captured in this plan.
- Treat saved views, command/search, notifications, preview panels, and denser list workflows as product features, not decorative upgrades. They need real data contracts, persistence where required, and automated coverage.
- No UI item is complete until the affected route is functional end to end, the full automated suite still passes, and the changed route has Playwright coverage on a live app instance.

## Refactor Objectives

- Strengthen global orientation through grouped navigation, active state, command access, and quick context.
- Shift list-heavy surfaces from form-first layouts to list-detail workflows with faster scanning and progressive disclosure.
- Turn the opportunity page into a true execution workspace with stable orientation and focused sub-navigation.
- Replace boutique visual softness with a more disciplined enterprise design system while keeping OneSource original.
- Remove implementation-facing copy from user-visible surfaces.
- Keep desktop-first density while maintaining accessible tablet and mobile triage paths.

## Non-Goals

- No reduction in current opportunity, source, task, knowledge, analytics, or admin functionality.
- No rewrite of the domain model unless the UI feature requires additive persistence such as saved views, pinned work, recents, or notifications.
- No big-bang redesign branch that leaves multiple routes broken at once.
- No reliance on chat context. All implementation decisions must be reflected back into `PRD.md`, `NOTES.md`, and any affected durable docs.

## Route Inventory And Target Outcomes

| Route or Surface                                       | Current Primary Components                                                                               | Target Outcome                                                                                                                                        | Data or API Notes                                                                                                            |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Authenticated shell                                    | `src/app/(app)/layout.tsx`, `src/components/layout/authenticated-app-shell.tsx`                          | Grouped navigation, stronger active state, pinned or recent work, collapsed desktop behavior, mobile drawer parity                                    | Likely needs recent-item and pinned-view read models plus global notification summary data                                   |
| Dashboard `/`                                          | `src/components/home/dashboard-landing.tsx`                                                              | Action-first command center with attention queue, top pursuits, deadlines, pipeline risk, task burden, source activity                                | Existing dashboard analytics can be reused; may need additional summary queries for alerts, saved-search review, and imports |
| Opportunities `/opportunities`                         | `src/components/opportunities/opportunity-list.tsx`                                                      | Dense list-detail workflow with filter rail, active chips, saved views, sortable sticky table, preview panel, density modes                           | Existing filters, sort, pagination, and DTOs are reusable; saved named views likely need additive persistence                |
| Opportunity workspace `/opportunities/[opportunityId]` | `src/components/opportunities/opportunity-workspace.tsx` and related managers                            | Header plus sub-navigation plus focused content zones for Summary, Capture, Tasks, Documents, Notes, Proposal, History                                | Existing workspace DTO is reusable; likely benefits from tab-aware loaders or section partials for performance               |
| External search `/sources`                             | `src/components/sources/source-search.tsx`, `src/components/sources/csv-import-workspace.tsx`            | Connector-led discovery workspace with saved searches, collapsible filters, dense results, translated query panel, inline duplicate and import states | Existing source saved searches and execution metadata are reusable; may need better preview DTOs and inline status shaping   |
| Knowledge `/knowledge`                                 | `src/components/knowledge/knowledge-library.tsx`, `src/components/knowledge/knowledge-form.tsx`          | Preview-first asset browser with stronger taxonomy filters and linked-pursuit visibility                                                              | Existing knowledge tags and linked opportunities are reusable; may need preview and quick-action DTOs                        |
| Tasks `/tasks`                                         | `src/components/tasks/personal-task-board.tsx`                                                           | Triage-first task experience across personal, team, calendar, and Kanban views                                                                        | Existing task CRUD and reminder state are reusable; team and calendar views may need new read models or grouping queries     |
| Analytics `/analytics`                                 | `src/components/analytics/decision-console.tsx`                                                          | Comparison-first portfolio analytics with drill-through and reduced decorative framing                                                                | Existing analytics data is reusable; may need explicit drill-through query contracts and saved views                         |
| Settings `/settings`                                   | `src/components/admin/admin-console.tsx`                                                                 | Dense operator workspace for Workspace, Users & Roles, Connectors, Saved Searches, Audit, Scoring Profile                                             | Existing admin repo is reusable; saved-search visibility may need new admin-facing read models                               |
| Public auth and route boundaries                       | `src/app/sign-in/page.tsx`, `src/app/error.tsx`, `src/app/(app)/error.tsx`, `src/app/forbidden/page.tsx` | Visual alignment with the hardened design system and clearer enterprise tone                                                                          | Mostly visual and copy cleanup; keep existing auth and error behavior intact                                                 |

## Shared Component Inventory And Reuse Map

### Harden In Place

- `src/components/layout/authenticated-app-shell.tsx`
  Use as the base shell and split it into smaller navigation, utilities, and quick-context subcomponents rather than replacing route wiring.
- `src/components/ui/data-table.tsx`
  Evolve into the shared enterprise table foundation. It should serve opportunities, sources, knowledge, analytics, and admin without per-page forks.
- `src/components/ui/badge.tsx`
  Rework around semantic status tokens and compact density.
- `src/components/ui/drawer.tsx` and `src/components/ui/dialog.tsx`
  Reuse for mobile filters, preview drawers, and secondary actions.
- `src/components/ui/empty-state.tsx` and `src/components/ui/error-state.tsx`
  Keep as shared state primitives, but tighten copy, spacing, hierarchy, and visual tone.
- `src/components/ui/form-field.tsx`, `input.tsx`, `select.tsx`, `textarea.tsx`
  Retain as form primitives while adjusting density, borders, typography, and validation state hierarchy.
- `src/components/layout/app-error-boundary.tsx`
  Keep route-level recovery behavior and align it visually with the new system.

### Restructure, Not Rebuild Blindly

- `src/components/home/dashboard-landing.tsx`
  Replace the current metric-card emphasis with panel-led hierarchy and linked actions.
- `src/components/opportunities/opportunity-list.tsx`
  Split into page header, active filters, results table, and preview-panel subcomponents.
- `src/components/opportunities/opportunity-workspace.tsx`
  Break the long-scroll composition into header, subnav, and tab or section containers while retaining the existing manager components where possible.
- `src/components/sources/source-search.tsx`
  Separate connector controls, active filters, results, translated query, and import preview.
- `src/components/knowledge/knowledge-library.tsx`
  Split into filter taxonomy bar, results, and preview panel.
- `src/components/tasks/personal-task-board.tsx`
  Promote the current board into one view within a larger triage surface instead of throwing away the existing task cards.
- `src/components/analytics/decision-console.tsx`
  Recompose around comparison modules, drill-through affordances, and denser scanning.
- `src/components/admin/admin-console.tsx`
  Split by operator domain so the surface can scale without looking like one long admin report.

### New Shared Primitives Expected

- Command palette and cross-entity search surface
- Active-filter chip bar
- Saved-view picker and management controls
- Preview panel or drawer shell
- Density toggle
- Table selection and keyboard-navigation model
- Sticky local workspace sub-navigation
- Notification tray or panel shell
- Skeleton loaders for list and detail routes
- Compact page-header pattern with counts, actions, and view controls

## Data And API Dependency Plan

### Can Reuse Existing Data Contracts

- Dashboard pipeline, deadline, and ranking data
- Opportunity list filters, pagination, sorting, and workspace reads
- Source connector search, execution, preview, import, and saved-search persistence
- Task CRUD, reminder state, and opportunity linkage
- Knowledge asset CRUD plus structured tags
- Analytics ranking and portfolio metrics
- Admin user, audit, connector health, and scoring-profile reads

### Likely Additive Contracts Needed

- Saved views outside `/sources`
  Opportunities, tasks, knowledge, analytics, and possibly admin need user-owned saved filter or sort states. This likely requires additive persistence and typed filter envelopes.
- Global command search
  Needs a cross-entity search boundary that can return opportunities, tasks, knowledge assets, and recent items without leaking raw Prisma models into the shell.
- Recent items and pinned work
  Likely needs either persisted user preferences or a derived recent-activity read model plus explicit pinning support.
- Notifications and alerts
  Existing reminders, saved-search hits, connector issues, and import conflicts need one aggregated read model. The first implementation can be read-only if mutation semantics are not yet required.
- List preview payloads
  Opportunities, sources, and knowledge may need narrower preview DTOs so preview panels do not depend on loading the full page route.
- Workspace partial loading
  The refactored workspace may benefit from tab-aware loaders or section endpoints to avoid rendering one oversized payload on every tab change.
- Analytics drill-through
  Ranking and chart interactions should open filtered opportunity views or detail panels with stable query-string contracts.

## Ralph-Loop Execution Sequence

This plan keeps the correct high-level order for the UI program. Future agents should execute the program in this sequence and keep each item independently shippable:

1. `UI-01` Design tokens and status semantics
2. `UI-02` Shared interaction primitives
3. `UI-03` Shell navigation redesign
4. `UI-04` Command/search and shell utilities
5. `UI-05` Dashboard command-center redesign
6. `UI-06` Opportunities list and preview workflow
7. `UI-07` Opportunity workspace restructuring
8. `UI-08` External search and import redesign
9. `UI-09` Task execution surfaces
10. `UI-10` Knowledge library redesign
11. `UI-11` Analytics redesign
12. `UI-12` Admin and settings redesign
13. `UI-13` Final hardening and full regression pass

## Phase-By-Phase Delivery Notes

### UI-01 Design System Hardening

Primary files:

- `src/app/globals.css`
- Shared UI primitives under `src/components/ui`
- Shell and page-level headings where token changes must be exercised

Implemented baseline:

- `src/app/globals.css` now defines the shared surface, border, radius, focus, and semantic status token model used by the refactor program.
- `src/components/ui/badge.tsx`, `input.tsx`, `select.tsx`, `textarea.tsx`, `form-field.tsx`, and `data-table.tsx` now use tighter default density and shared semantic styling.
- `src/components/ui/empty-state.tsx`, `error-state.tsx`, `permission-denied-state.tsx`, and `skeleton.tsx` now provide one standardized state hierarchy for empty, error, denied, and loading treatments.
- `src/app/forbidden/page.tsx` is the first route moved onto the new permission-denied primitive, and `src/components/ui/ui-foundation.test.tsx` is the regression suite that future UI loops should extend when they touch these primitives.

Key outcomes:

- Smaller global radius
- Enterprise-neutral palette with restrained accent use
- Compact, default, and comfortable density rules
- Semantic status colors and badge hierarchy
- Standardized state surfaces for empty, loading, error, and permission denied
- Copy audit list for implementation-facing labels that must be removed in later route phases

### UI-02 Shared Interaction Foundation

Primary files:

- `src/components/ui/data-table.tsx`
- New shared primitives under `src/components/ui`
- Route consumers updated only as needed to prove reuse

Implemented baseline:

- `src/components/ui/data-table.tsx` now supports sticky headers, visible sort-state indicators, selected-row treatment, and keyboard-focusable row scaffolding.
- `src/components/ui/active-filter-chip-bar.tsx`, `saved-view-controls.tsx`, `density-toggle.tsx`, `preview-panel.tsx`, `table-skeleton.tsx`, and `preview-panel-skeleton.tsx` now provide the reusable interaction kit for later list-heavy route refactors.
- `src/components/opportunities/opportunity-list.tsx` is the first proving consumer: it now uses standard view presets, removable filter chips, density-aware results, selected-row preview state, and the shared preview shell without changing the underlying repository query model.
- `src/app/(app)/opportunities/loading.tsx` is the first loading-state consumer of the new shared table and preview skeleton patterns.

Key outcomes:

- Sticky sortable tables
- Preview-panel shell
- Active-filter chips
- Saved-view controls
- Density toggles
- Skeleton loaders
- Keyboard row navigation model

### UI-03 And UI-04 Shell And Global Search

Primary files:

- `src/components/layout/authenticated-app-shell.tsx`
- New shell subcomponents
- App layout wrappers in `src/app/(app)/layout.tsx`

Implemented baseline for `UI-03`:

- `src/components/layout/authenticated-app-shell.tsx` now groups primary navigation by operator intent, keeps analytics and settings visibility permission-aware, and exposes clearer active-section orientation in both the rail and the sticky header.
- The desktop shell now uses an always-open persistent drawer on large screens, while the mobile shell reuses the grouped navigation, quick links, and recent-work sections inside the shared drawer.
- Shell-level quick links now replace ad hoc page shortcuts for high-frequency routes such as creating a pursuit, returning to the pipeline, opening the task queue, opening source discovery, the decision console, and workspace settings when the current role permits those routes.
- Recent-work persistence now uses localStorage snapshots plus a `useSyncExternalStore` subscription so the server-rendered shell stays hydration-safe while recent destinations still update immediately after shell navigation.

Remaining `UI-04` outcomes:

- `src/modules/shell/app-shell.repository.ts` plus `app-shell.types.ts` now provide the additive shell snapshot for server-backed command sections and notification summaries without leaking route-level queries into the client shell.
- The sticky header now launches a real command-center dialog with a searchable result list, keyboard open support on `Ctrl/Cmd+K`, arrow-key result movement, `Enter` navigation, quick-create actions, shell views, recent items, pinned work, and server-backed cross-entity sections for opportunities, assigned tasks, knowledge assets, and saved searches.
- Pinned-work persistence is now explicit beside the existing recent-work persistence, both stay hydration-safe through the shared localStorage plus `useSyncExternalStore` pattern, and the same state appears in the desktop rail and mobile drawer.
- The shell now exposes a notification entry point backed by overdue or upcoming task reminders plus recent failed saved-search sync runs, while keeping all resulting navigation permission-governed by the existing server routes.
- Notifications entry point

### UI-05 Dashboard

Primary files:

- `src/components/home/dashboard-landing.tsx`
- Supporting dashboard subcomponents

Key outcomes:

- Attention queue
- Top pursuits
- Upcoming deadlines
- Pipeline risk
- Task burden
- Recent source activity
- Secondary saved-search review and import review sections

### UI-06 Opportunities List

Primary files:

- `src/components/opportunities/opportunity-list.tsx`
- Shared table and preview primitives
- Opportunity list read models only if new saved-view or preview DTOs are needed

Implemented baseline:

- `src/modules/opportunities/opportunity.types.ts` and `src/modules/opportunities/opportunity.repository.ts` now extend the list query and snapshot with URL-backed saved-view keys plus server-shaped saved-view counts so the route can expose named queues without client-only state.
- `src/components/opportunities/opportunity-list.tsx` now renders as a dense list-detail workspace with a header-level saved-view strip, mobile filter drawer, sticky desktop filter rail, server-backed sort links, active filter chips, sticky results table headers, and a sticky preview panel with an explicit workspace-open action.
- `tests/smoke.spec.ts` now enters the opportunity workspace through the preview-first list interaction, while the route-level component and repository suites cover the additive saved-view and query-shaping behavior.

Key outcomes:

- Dense result scan
- Filter rail or drawer
- Active chips
- Saved views
- Preview-first workflow
- Explicit workspace-open action
- Bulk-selection scaffolding for future actions

### UI-07 Opportunity Workspace

Primary files:

- `src/components/opportunities/opportunity-workspace.tsx`
- Existing workspace manager components
- Optional tab-aware loader or new workspace subcomponents

Key outcomes:

- Persistent workspace header
- Sticky local sub-navigation
- Summary, Capture, Tasks, Documents, Notes, Proposal, History zones
- Preserved write flows inside the new structure
- Stronger orientation and shorter perceived page length

### UI-08 External Search And Import

Primary files:

- `src/components/sources/source-search.tsx`
- `src/components/sources/csv-import-workspace.tsx`
- Shared table, preview, filter, and saved-view primitives

Key outcomes:

- Connector-led top row
- Saved search visibility
- Collapsible advanced filters
- Dense results table
- Translated query inspection
- Inline duplicate and import state
- Intact create-or-link workflows

### UI-09 Tasks

Primary files:

- `src/components/tasks/personal-task-board.tsx`
- New task-surface subcomponents

Key outcomes:

- `My Tasks`
- `Team Tasks`
- `Calendar`
- `Kanban`
- Reminder and overdue emphasis
- Fast triage and assignment visibility

### UI-10 Knowledge

Primary files:

- `src/components/knowledge/knowledge-library.tsx`
- `src/components/knowledge/knowledge-form.tsx`

Implemented baseline:

- `src/components/knowledge/knowledge-library.tsx` now renders as a preview-first asset browser with asset-type views, a sticky desktop taxonomy rail, a mobile filter disclosure, active filter chips, and a right-side selected-asset brief.
- `src/modules/knowledge/knowledge.repository.ts` and `knowledge.types.ts` now expose the additive preview payload needed for the selected asset, including full reusable-content text while preserving the existing CRUD and tag-validation paths.
- `src/components/knowledge/knowledge-copy-button.tsx` now provides a lightweight reusable-content copy action from the preview panel, and the Chromium smoke flow plus component coverage now validate the browse, filter, preview, copy, and create path together.

Key outcomes:

- Preview-first browsing
- Stronger taxonomy filters
- Linked opportunity visibility
- Future-friendly copy or insert affordances
- Preserved CRUD

### UI-11 Analytics

Primary files:

- `src/components/analytics/decision-console.tsx`
- `src/modules/opportunities/opportunity.repository.ts`

Implemented baseline:

- `src/components/analytics/decision-console.tsx` now renders as a comparison-first analytics workspace with a denser ranking queue, compact decision-posture metrics, score-band comparison, stage-conversion funnel, active-stage aging, and effort-versus-outcome modules instead of the earlier decorative card stack.
- `src/modules/opportunities/opportunity.repository.ts` and `opportunity.types.ts` now expose additive analytics drill-through metadata for stage-queue links, oldest-stage opportunity jumps, and richer ranked-opportunity effort detail without creating a second analytics query path.
- The Chromium smoke flow plus analytics component and repository coverage now validate ranking control changes, section rendering, and at least one analytics drill-through jump into the underlying tracked-opportunity route.

Key outcomes:

- Comparison-first module layout
- Denser ranking and comparison tables
- Drill-through from analytics modules and tables
- Reduced decorative framing

### UI-12 Admin And Settings

Primary files:

- `src/components/admin/admin-console.tsx`
- `src/modules/admin/admin.repository.ts`
- `src/modules/admin/admin.types.ts`

Implemented baseline:

- `src/components/admin/admin-console.tsx` originally rendered `/settings` as a dense operator workspace with a product-facing header, section-jump navigation, an operator briefing, connector operations, a saved-search registry, a tighter scoring-profile section, and audit sections instead of the earlier developer-console stack. Later MUI follow-ups split user management and then the remaining admin jobs into focused settings routes, so `/settings` is now a compact overview rather than the full operational console.
- `src/modules/admin/admin.repository.ts` and `admin.types.ts` now expose additive saved-search summaries for connector ownership, filter coverage, execution timestamps, and owner display labels without creating a second admin query path.
- The admin component suite, admin repository suite, and Chromium smoke flow now validate the product-facing settings copy, saved-search visibility, connector inspection, scoring-profile visibility, retry action, and viewer denial path together.

Key outcomes:

- Clear operator sections
- Dense health and status tables
- Product-facing copy
- Saved-search visibility where appropriate
- No permission regression

### MUI-21 Settings Route Split

Primary files:

- `src/components/admin/admin-console.tsx`
- `src/modules/admin/admin.repository.ts`
- `src/components/layout/authenticated-app-shell.tsx`

Implemented baseline:

- `/settings` is now a lightweight workspace-admin overview with summary cards and route cards into the focused settings workspaces.
- `/settings/connectors`, `/settings/saved-searches`, `/settings/scoring`, and `/settings/audit` now isolate connector operations, saved-search registry, scoring profile plus recalibration, and audit visibility from each other while preserving `/settings/users`.
- The admin rail exposes all focused settings destinations and the active-state contract chooses the most specific route so `/settings/scoring` or `/settings/users` does not also activate the overview link.

Key outcomes:

- Settings no longer depends on one long mixed scroll context.
- Existing `manage_workspace_settings` permission enforcement is preserved.
- Connector retry, scoring recalibration, and user-management mutations still redirect back to their owning workspaces.

### UI-13 Final Hardening

Primary files:

- `src/components/opportunities/opportunity-form.tsx`
- `src/components/home/dashboard-landing.tsx`
- `src/components/sources/source-search.tsx`
- `src/components/opportunities/opportunity-workspace.tsx`
- `src/components/analytics/decision-console.tsx`
- `src/components/layout/authenticated-app-shell.tsx`
- `src/app/globals.css`
- `tests/smoke.spec.ts`
- `README.md`, `PRD.md`, `NOTES.md`, and `docs/testing.md`

Implemented baseline:

- Product copy was normalized across the authenticated experience by removing implementation-facing phrases such as seeded-org references, roadmap labels, and developer-facing field guidance from the dashboard, opportunity form, source-search, opportunity workspace, and analytics surfaces.
- The shared authenticated shell was hardened for tablet-sized layouts by tightening flex child sizing, removing width forcing that caused document overflow, restoring explicit `body` margin reset coverage, and hiding shell-level horizontal overflow while preserving route-local scroll containers.
- The Chromium smoke suite now includes a tablet-sized route sweep across every major authenticated route plus one opportunity workspace, using a width-based overflow assertion to catch document-level regressions before closeout.
- The shared Playwright sign-in helper now waits for the authenticated redirect and visible signed-in shell state before continuing so multi-route browser checks do not race the auth transition.
- Final durable docs now record the compose-first browser path, the need to rebuild `web` and `playwright` after route-level or smoke-spec changes in this sandbox, and the verification evidence for the completed UI refactor program.

Key outcomes:

- Product-facing copy is consistent across the authenticated routes
- Tablet responsiveness is verified across every major route
- The shell no longer pushes document width beyond the viewport on the hardened paths
- Browser regression coverage now exercises a final route-wide hardening pass
- Final durable docs capture the completed UI operating model and verification workflow

## Testing Strategy

### Shared Expectations For Every UI Item

- Add or update unit or component tests for any changed shared primitive or route behavior.
- Add or update integration tests for query-state handling, server actions, permissions, or write flows affected by the redesign.
- Run the full automated suite in the repo before marking the item complete.
- Run Playwright in Chromium against a live app instance for the changed route.
- Record exact commands and whether verification used `docker compose` and Playwright in `PRD.md` and `NOTES.md`.

### Recommended Verification Commands

- Focused tests for changed files, for example `npm test -- <paths>`
- Full lint: `npm run lint`
- Full unit and component suite: `npm test`
- Production build: `npm run build`
- Seed reset before browser reruns when needed: `npm run db:seed`
- Preferred browser path when available: `make compose-test-e2e`
- In this sandbox, rebuild `web` and `playwright` first with `docker compose -f docker-compose.test.yml build web playwright` after route-level or smoke-spec changes so the compose browser run does not mix new assertions with a stale web image.
- Fallback browser path already used in this repo when compose app builds are unstable: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 SAM_GOV_USE_FIXTURES=true npm run e2e`
- Diff hygiene: `git diff --check`

### Coverage Matrix

| Surface               | Minimum Automated Coverage                                                                                                | Minimum Browser Coverage                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Shared shell          | Component tests for nav groups, active state, drawer behavior, command launcher state                                     | Desktop and narrow-viewport navigation, command launch, one quick action         |
| Dashboard             | Component tests plus any supporting read-model tests                                                                      | Load dashboard, inspect attention panel, navigate to one linked downstream route |
| Opportunities list    | Query-state, sorting, saved-view, preview-state tests                                                                     | Filter, sort, preview, open workspace                                            |
| Opportunity workspace | Component tests plus write-path regressions for tasks, notes, documents, decisions, stage transitions, proposal, closeout | Visit workspace, move across local subnav, execute critical actions              |
| External search       | Source-search UI tests plus import and connector regression tests                                                         | Run search, inspect preview, confirm duplicate state, create or link import      |
| Tasks                 | Task-board UI tests plus task-service regressions                                                                         | Review personal task triage and complete one secondary task-view scenario        |
| Knowledge             | Knowledge browse and form tests                                                                                           | Filter, preview, create or edit asset                                            |
| Analytics             | Analytics component and repository tests                                                                                  | Use ranking or chart surface and drill through to opportunities                  |
| Admin                 | Admin component tests plus permission tests                                                                               | Admin access path plus viewer denial path                                        |

## Rollout Risk Management

- Do not redesign multiple route families in one loop just because they share a component. Land the shared primitive first, then consume it route by route.
- Keep old and new compositions behind the same data contracts whenever possible so backend risk stays low.
- When additive persistence is needed for saved views, recents, notifications, or pins, land the schema and typed service before wiring the final UI.
- Prefer extracting subcomponents from existing files over deleting and recreating large route components with no migration path.
- If a planned UX improvement cannot be supported by the current data model without risky scope creep, document the blocker in `PRD.md` and split the additive data work into its own checklist item before the surface redesign is marked complete.

## Completion Standard For The Program

The UI refactor program is complete only when all `UI-01` through `UI-13` items are complete in `PRD.md` and these conditions are true:

- The shell provides clear enterprise navigation and orientation.
- List-heavy routes scan faster than the current form-first layouts.
- The opportunity page behaves like an execution workspace rather than a long report.
- Every major authenticated route uses the hardened design system.
- Saved views, command search, preview flows, and denser tables are functional where planned.
- Accessibility, responsiveness, and copy cleanup have been verified and documented.
- Full automated verification and route-level Playwright evidence have been recorded for each completed item.
