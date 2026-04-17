# OneSource

OneSource is a capture intelligence platform for government contracting teams. The repository is currently in pre-scaffold documentation and planning state; the application stack has not been initialized yet.

## Current Status

- Product intent is defined in `SPEC.md`.
- Implementation scope, checklist sequencing, and current handoff state live in `PRD.md`.
- Engineering and verification rules live in `AGENTS.md`.
- The app, containers, and test harness have not been scaffolded yet.

## Planned Stack

- Next.js with TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma
- Zod
- Auth.js
- `pg-boss`
- Vitest
- Playwright
- Docker Compose

## Repository Docs

- `SPEC.md`: product intent and market context
- `PRD.md`: implementation plan, checklist state, and handoff
- `AGENTS.md`: repository operating rules
- `NOTES.md`: timestamped working notes for the active loop and crash-recovery handoff
- `README.md`: setup and workflow guide for the current repo state

## Current Workflow

There is no runnable application or container stack yet. Until `P0-01` and `P0-02` are implemented, the canonical workflow is documentation-first:

1. Read `SPEC.md`, `PRD.md`, `AGENTS.md`, and `NOTES.md` if it exists.
2. Inspect `git status`.
3. Work one PRD checklist item at a time.
4. Create `NOTES.md` if it does not exist and append timestamped working notes as the loop progresses.
5. Update durable docs in the same loop when requirements or workflows change.

## Commands Available Today

- Inspect repo status: `git status`
- Review implementation plan: `sed -n '1,240p' PRD.md`
- Review agent rules: `sed -n '1,240p' AGENTS.md`
- Review active loop notes: `sed -n '1,240p' NOTES.md`

## Commands Not Yet Available

These workflows are expected later but are not yet implemented in this repo:

- Application boot
- `docker compose` stack startup
- Database migration and seed commands
- Unit, integration, and Playwright test commands

## Documentation Gaps

The following required baseline docs are still pending:

- `docs/architecture.md`
- `docs/runbook.md`

`P0-03` remains incomplete until those files exist and the documentation reflects the real repo workflows.
