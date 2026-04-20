# OneSource UI/UX Specification Guide

## Document Purpose

This document is a planning-grade specification for redesigning the OneSource application UI into a more professional enterprise capture-intelligence experience. It is intended for an implementation-planning agent that will translate the guidance into a phased development plan.

The target experience should be:

- Professional, credible, and enterprise-ready
- Optimized for government contracting workflows
- Similar in navigational discipline and information density to GovWin IQ
- Clearly original in visual execution, interaction details, and component design

This is not a request to copy GovWin IQ. It is a request to borrow the underlying product qualities that make enterprise research tools effective: persistent navigation, dense but structured scanning, clear list/detail workflows, saved views, and decision-oriented workspace organization.

## Scope

This specification covers:

- Global application shell
- Information architecture and navigation
- Dashboard
- Opportunity list and pipeline views
- Opportunity workspace/detail experience
- Source search and import workflow
- Knowledge library
- Personal task board
- Analytics pages
- Admin/settings surfaces
- Design system and interaction patterns
- Accessibility, responsiveness, and acceptance criteria

## Current State Assessment

### Overall strengths

- The app already has a consistent design language: custom typography, controlled color tokens, shared rounded surfaces, and reusable shell/table/form primitives.
- The product model is strong and aligns with the PRD: opportunity-centric workflow, external source search, promotion into tracked opportunities, reusable knowledge, tasks, analytics, and admin operations.
- Major pages are already segmented into meaningful product areas rather than generic CRUD pages.

### Current issues limiting perceived professionalism

#### 1. The UI is visually consistent but not hierarchically disciplined enough

Across the dashboard, opportunities, sources, and knowledge pages, the same pattern repeats:

- page hero
- badges
- summary cards
- filter card
- table or card list

This consistency is good, but it also flattens the product. Too many elements compete for the same visual weight, so users do not get a strong sense of primary action, secondary context, and deep detail.

Evidence:

- [authenticated-app-shell.tsx](/Users/maverick/Documents/RalphLoops/OneSource/src/components/layout/authenticated-app-shell.tsx:136)
- [dashboard-landing.tsx](/Users/maverick/Documents/RalphLoops/OneSource/src/components/home/dashboard-landing.tsx:27)
- [opportunity-list.tsx](/Users/maverick/Documents/RalphLoops/OneSource/src/components/opportunities/opportunity-list.tsx:50)
- [source-search.tsx](/Users/maverick/Documents/RalphLoops/OneSource/src/components/sources/source-search.tsx:75)
- [knowledge-library.tsx](/Users/maverick/Documents/RalphLoops/OneSource/src/components/knowledge/knowledge-library.tsx:47)

#### 2. The global shell is attractive but not yet operational enough

The shell has a left rail, top bar, and search slot, which is the right direction. However:

- the navigation is flat rather than grouped by user intent
- the top search is a read-only placeholder rather than a true global command/search surface
- there is no quick access to saved searches, recent opportunities, pinned workspaces, alerts, or notification state
- the left rail has descriptive text but not enough workflow shortcuts

Evidence:

- [authenticated-app-shell.tsx](/Users/maverick/Documents/RalphLoops/OneSource/src/components/layout/authenticated-app-shell.tsx:16)
- [authenticated-app-shell.tsx](/Users/maverick/Documents/RalphLoops/OneSource/src/components/layout/authenticated-app-shell.tsx:222)
- [authenticated-app-shell.tsx](/Users/maverick/Documents/RalphLoops/OneSource/src/components/layout/authenticated-app-shell.tsx:229)
- [authenticated-app-shell.tsx](/Users/maverick/Documents/RalphLoops/OneSource/src/components/layout/authenticated-app-shell.tsx:253)

#### 3. List pages are serviceable but too form-first

The list/search pages rely on large exposed filter forms above the results. That works, but it feels like a line-of-business admin tool more than a premium market-intelligence platform.

The result should feel more like:

- scan results first
- refine quickly from chips and collapsible filters
- save/share views
- open row detail without losing context

Current pages put too much vertical emphasis on the filter form before the user reaches the data.

Evidence:

- [opportunity-list.tsx](/Users/maverick/Documents/RalphLoops/OneSource/src/components/opportunities/opportunity-list.tsx:102)
- [source-search.tsx](/Users/maverick/Documents/RalphLoops/OneSource/src/components/sources/source-search.tsx:154)
- [knowledge-library.tsx](/Users/maverick/Documents/RalphLoops/OneSource/src/components/knowledge/knowledge-library.tsx:116)

#### 4. The data table primitive is too limited for enterprise scanning

The shared table primitive is clean, but it currently behaves like a static table wrapper. It does not convey higher-end enterprise affordances such as:

- sortable headers with visible state
- sticky header
- row selection
- density modes
- pinned columns
- inline status hierarchy
- expandable preview rows
- keyboard row navigation

Evidence:

- [data-table.tsx](/Users/maverick/Documents/RalphLoops/OneSource/src/components/ui/data-table.tsx:5)
- [data-table.tsx](/Users/maverick/Documents/RalphLoops/OneSource/src/components/ui/data-table.tsx:38)

#### 5. The opportunity workspace is comprehensive but too long-scroll

The opportunity workspace includes the right content domains, but it is assembled as a long stacked page with many major sections. That makes it harder to scan, harder to maintain orientation, and harder to support serious day-to-day capture work.

The workspace should become a clearer command surface with a stable summary area and section-level navigation or tabs.

Evidence:

- [opportunity-workspace.tsx](/Users/maverick/Documents/RalphLoops/OneSource/src/components/opportunities/opportunity-workspace.tsx:140)
- [opportunity-workspace.tsx](/Users/maverick/Documents/RalphLoops/OneSource/src/components/opportunities/opportunity-workspace.tsx:236)
- [opportunity-workspace.tsx](/Users/maverick/Documents/RalphLoops/OneSource/src/components/opportunities/opportunity-workspace.tsx:275)
- [opportunity-workspace.tsx](/Users/maverick/Documents/RalphLoops/OneSource/src/components/opportunities/opportunity-workspace.tsx:297)

#### 6. The visual system feels boutique rather than enterprise-command

The current palette and gradients are polished, but the overall impression is slightly soft and lifestyle-oriented because of:

- warm beige backgrounds
- heavy rounded corners everywhere
- repeated decorative gradients
- large card spacing on most surfaces

For a GovWin-like enterprise feel, OneSource should retain warmth and originality while becoming more controlled, denser, and more grid-driven.

Evidence:

- [globals.css](/Users/maverick/Documents/RalphLoops/OneSource/src/app/globals.css:3)
- [globals.css](/Users/maverick/Documents/RalphLoops/OneSource/src/app/globals.css:40)
- [dashboard-landing.tsx](/Users/maverick/Documents/RalphLoops/OneSource/src/components/home/dashboard-landing.tsx:90)

#### 7. Copy and labels are too implementation-aware in some key places

Several page headers and badges describe technical behavior instead of user value, for example:

- "URL-synced filters"
- "Server-rendered"
- "Connector-ready DTOs"
- "shared table pattern"

Those may be useful during development, but they reduce product polish in the live UI.

Evidence:

- [opportunity-list.tsx](/Users/maverick/Documents/RalphLoops/OneSource/src/components/opportunities/opportunity-list.tsx:55)
- [source-search.tsx](/Users/maverick/Documents/RalphLoops/OneSource/src/components/sources/source-search.tsx:80)
- [admin-console.tsx](/Users/maverick/Documents/RalphLoops/OneSource/src/components/admin/admin-console.tsx:58)

## Design Direction

## Core UX Goal

Make OneSource feel like a serious capture command center:

- fast to scan
- easy to trust
- dense without being cluttered
- oriented around decision-making rather than decoration

## Non-Infringing Inspiration Rules

The redesign may borrow these abstract traits from GovWin-like enterprise products:

- persistent app shell
- dominant list/detail workflows
- saved research views
- compact metadata chips
- strong tabular scanning
- clear separation between search, tracking, and workspace execution

The redesign must not copy:

- GovWin IQ branding
- layout dimensions verbatim
- iconography or illustrations
- exact color palette
- exact menu labels or grouping if distinctive
- page composition copied from screenshots

## Design Principles

1. Opportunity-first
   Every major flow should either discover, qualify, execute, or analyze opportunities.

2. Dense but ordered
   Prioritize compact, structured information over oversized cards.

3. Stable orientation
   Users should always know where they are: app area, active view, active filters, and active opportunity.

4. Progressive disclosure
   Show essentials first; push less-frequent actions into tabs, drawers, accordions, and side panels.

5. Actionable context
   Surface deadlines, status, ownership, and next action prominently.

6. Original visual identity
   Keep OneSource recognizable and distinct from GovWin IQ.

## Target Information Architecture

### Primary navigation groups

Replace the flat left-rail list with grouped navigation:

- `Command`
  - Dashboard
  - Alerts
  - Recent work
- `Discover`
  - External Search
  - Saved Searches
  - Imports Review
- `Pipeline`
  - Opportunities
  - Kanban / Stage Board
  - Calendar / Deadlines
- `Execution`
  - Tasks
  - Knowledge
  - Documents
- `Analytics`
  - Decision Console
  - Pipeline Health
  - Win/Loss
- `Admin`
  - Workspace Settings
  - Connectors
  - Audit

### Shell utilities

Top bar must include:

- global search / command bar
- quick-create action
- notifications
- current workspace selector if multi-org is planned
- user menu

Left rail should include:

- grouped navigation labels
- active page state
- quick links for saved views or pinned pursuits
- collapsed mode on narrower desktop widths

## Global App Shell Specification

### Layout

- Left rail: fixed on desktop, overlay drawer on mobile/tablet
- Top bar: sticky
- Main content: max width for dashboards, full-width mode for tables/workspaces
- Optional right-side contextual panel for selected row detail or alerts

### Behavior

- Global search opens a command palette and cross-entity search
- Navigation supports keyboard use
- Recent items appear under the command bar or user menu
- Saved views can be pinned into the rail

### Visual direction

- Reduce corner radius globally from the current oversized treatment
- Use flatter panels and more disciplined borders
- Reserve gradients for a few highlight surfaces only
- Increase contrast in navigation and table states

## Dashboard Specification

### Purpose

Provide leadership and capture managers with an immediate answer to:

- What needs attention today?
- Which opportunities matter most?
- Where is pipeline risk accumulating?

### Layout

Top row:

- page title
- date range selector
- workspace selector if applicable
- quick actions: `New Opportunity`, `Run Search`, `Open Tasks`

Primary content:

- `Attention queue` panel
- `Top pursuits` ranked panel
- `Upcoming deadlines` panel
- `Pipeline by stage` visualization
- `Task burden / overdue work` widget
- `Recent source activity` widget

Secondary content:

- saved searches requiring review
- recent imports
- knowledge reuse suggestions

### Replace current issues

- Reduce the number of equally weighted metric cards
- Promote one or two actionable panels above passive metrics
- Replace decorative emphasis with scanable operational emphasis

## Opportunities List Specification

### Purpose

Support high-volume scanning, refinement, saving views, and opening an opportunity without losing list context.

### Required layout

Header row:

- page title
- result count
- `New Opportunity`
- `Save View`
- `Export`

Sub-header:

- active filter chips
- saved view selector
- sort selector
- density toggle

Body:

- left filter rail or collapsible filter drawer
- central results table
- optional right preview panel on row selection

### Required table columns

- opportunity title
- agency
- stage
- source
- score
- final/recommended decision
- due date
- owner
- last activity

### Required interactions

- sticky header
- server-backed sorting
- row click opens preview panel first
- explicit `Open workspace` action
- multi-select for bulk status/owner/tag actions later
- save current filter/sort configuration as named view

### Visual rules

- status badges should be compact and color-disciplined
- overdue and urgent rows need strong but accessible emphasis
- row density should support expert users

## External Search Specification

### Purpose

Separate external market discovery from internal pipeline tracking, while making promotion into the pipeline frictionless.

### Layout

Top row:

- search title
- connector selector
- saved search selector
- `Run Search`

Main body:

- collapsible filter builder
- results table
- translated query/request panel
- import preview panel

### Workflow

1. User selects connector or saved search
2. User adjusts filters
3. User runs search
4. Results load in dense table
5. Selecting a result opens preview drawer or side panel
6. User imports to tracked opportunity or links to existing record

### Key improvements over current page

- do not expose all fields at equal weight by default
- group advanced filters under `More filters`
- support saved searches and rerun behavior visibly
- make import status and duplicate detection easier to scan inline

## Opportunity Workspace Specification

### Purpose

Turn the opportunity detail page into a true execution workspace, not a long report.

### Layout model

Use a three-zone structure:

- `Workspace header`
  - title
  - stage
  - decision state
  - source
  - due date
  - owner
  - primary actions
- `Sub-navigation`
  - Summary
  - Capture
  - Tasks
  - Documents
  - Notes
  - Proposal
  - History
- `Content area`
  - tab content or anchored sections with sticky subnav

### Workspace header requirements

- include breadcrumb back to opportunities or saved view
- include key metadata in a compact summary strip
- include quick actions:
  - edit details
  - open source notice
  - assign owner
  - add task
  - record bid decision

### Summary tab

- executive summary
- scorecard snapshot
- next milestone
- top risks
- linked knowledge suggestions

### Capture tab

- pursuit status
- bid/no-bid rationale
- qualifiers
- vehicles / NAICS / set-aside
- competitor and teaming context

### Tasks tab

- task list with assignee, due date, priority, reminder state
- inline task create/edit
- filters for open, overdue, complete

### Documents tab

- uploaded files
- parsed text status
- document type
- latest upload activity

### Notes tab

- chronological notes with author and timestamp
- pinned notes
- decision notes

### Proposal tab

- proposal status
- owners
- section tracking
- milestone summary

### History tab

- activity log
- stage transitions
- major decision changes

### Key improvement requirement

The workspace must stop being a long-scroll page with equal-weight sections. It should maintain user orientation through sticky local navigation and clearer section priority.

## Knowledge Library Specification

### Purpose

Make reusable content feel like a strategic asset library, not a generic records table.

### Layout

- header with counts and create action
- saved filters / taxonomy filters
- results table or card-table hybrid
- preview panel with summary, tags, linked pursuits, and edit action

### Recommended features

- strong taxonomy chips
- preview-first browsing
- relation visibility to agencies, vehicles, and linked opportunities
- quick insert/copy actions for future proposal workflows

## Tasks Board Specification

### Purpose

Provide a personal and team execution surface for capture work.

### Recommended views

- `My Tasks`
- `Team Tasks`
- `Calendar`
- `Kanban`

### Default layout

- summary strip
- filter bar
- grouped task lanes by status or due window

The current personal task board is clear, but it is too linear. The redesign should support triage first, not just task listing.

## Analytics Specification

### Purpose

Give leadership a portfolio-quality decision surface.

### Required modules

- ranking table
- score distribution
- conversion funnel
- stage aging
- effort vs outcome
- decision alignment

### UX requirements

- analytics pages should prioritize comparison and trends over decorative cards
- charts should always allow click-through to underlying opportunities
- ranking changes should feel immediate and controlled

## Admin and Settings Specification

### Purpose

Support operators without making the admin area feel like a developer console.

### Required structure

- `Workspace`
- `Users & Roles`
- `Connectors`
- `Saved Searches`
- `Audit`
- `Scoring Profile`

### UX notes

- avoid exposing implementation phrases in visible UI
- keep admin tables dense and operational
- use clear health statuses for connectors and sync jobs

## Design System Specification

### Visual direction

Target a restrained, high-trust enterprise aesthetic:

- neutral base: slate, stone, or warm gray
- primary accent: deep green or blue-green
- secondary accent: muted amber for warnings/deadlines
- minimal decorative gradients
- more visible structural dividers

### Typography

- keep a distinctive heading font only if it remains disciplined
- prioritize legibility and density over novelty
- use consistent type scales across list pages and detail pages

### Spacing

- reduce oversized padding on repeated cards
- support compact, default, and comfortable density modes for data-heavy views

### Surface rules

- standard panel radius smaller than current default
- cards only where grouping matters
- tables and workspaces should feel more architectural than soft

### Status system

Define semantic status tokens:

- success
- warning
- danger
- info
- neutral
- stage-specific metadata colors only if accessible and consistent

### Iconography

- use clean system icons
- prioritize utility over illustration

## Interaction Patterns

### Search

- one true global search/command surface
- page-level search scoped to entity type
- support recent searches and saved searches

### Filters

- inline chips for active filters
- advanced filters hidden by default
- save, rename, duplicate, and share views

### Tables

- sortable
- sticky headers
- keyboard navigable
- row hover and selected states
- empty, loading, and error states standardized

### Preview panels

- list pages should use side preview where practical
- preview panels reduce full-page hopping

### Notifications

- deadlines
- saved-search hits
- import conflicts
- assigned tasks
- connector issues

## Responsiveness

### Desktop

- primary target
- optimized for 1280px to 1600px widths
- tables may use full-width layout

### Tablet

- collapsible left rail
- filters move into slide-over panels
- preview panels become drawers

### Mobile

- support core review and triage tasks
- do not force full analytical workflows
- keep workspace summary and task actions accessible

## Accessibility Requirements

- WCAG 2.1 AA contrast minimum
- visible keyboard focus states
- semantic headings
- logical tab order
- table headers and labels correctly associated
- color should never be the only status signal
- interactive targets must meet pointer size guidelines

## Performance Requirements

- perceived page response under 200ms for cached transitions where possible
- avoid heavy client-side state for primary data tables unless needed
- use skeleton loaders for list/detail pages
- keep sticky shell interactions smooth on lower-end enterprise laptops

## Content and Tone Requirements

UI copy should be:

- product-facing
- operational
- concise
- credible

Avoid implementation-facing phrases in user-facing UI such as:

- server-rendered
- DTO
- shared table pattern
- typed query
- seeded workspace

## Suggested Implementation Sequence

The planning agent should structure delivery in this order:

1. Design system hardening
2. Global shell redesign
3. Opportunities list and preview pattern
4. Opportunity workspace restructuring
5. External search redesign
6. Knowledge and task surfaces
7. Analytics polish
8. Admin polish

## Deliverables Expected From The Planning Agent

The next agent should produce:

- a phased implementation plan
- component inventory and reuse map
- route-by-route change list
- API/data dependencies for each redesign area
- testing strategy
- rollout order with low-risk milestones
- explicit acceptance criteria per phase

## Acceptance Criteria For The Redesign

The redesign should be considered successful when:

- the shell clearly supports enterprise navigation and orientation
- list pages support faster scanning than the current form-first experience
- the workspace feels like an execution hub rather than a long document
- the visual system feels original, premium, and disciplined
- saved views, global search, and preview flows reduce navigation friction
- the app remains accessible and responsive

## External Reference Cues

These are reference cues only, not templates to copy:

- Deltek’s GovWin IQ marketing and product positioning emphasize government opportunity intelligence, market visibility, and workflow support.
- Deltek help materials indicate patterns such as opportunity search, list management, tracked views, and detail-oriented research workflows.

Useful references:

- [Deltek GovWin IQ product page](https://www.deltek.com/en/products/govwin/government-contracting-intelligence)
- [GovWin IQ site](https://iq.govwin.com/)
- [Deltek help search for GovWin IQ](https://help.deltek.com/product/GovWin/)

## Notes For The Planning Agent

Do not treat this as a cosmetic reskin. The required outcome is a stronger operating model for capture teams:

- better orientation
- better research flow
- better list/detail handling
- better workspace execution
- better enterprise trust signals

The existing codebase already has solid product coverage. The redesign should preserve that functional coverage while reorganizing the experience around faster scanning, stronger hierarchy, and more professional enterprise UX.
