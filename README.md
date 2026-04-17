# OneSource

OneSource is a capture intelligence platform for government contracting teams. The repo now has the Phase 0 scaffold plus a compose-managed runtime stack: a Next.js app with TypeScript, Tailwind CSS, ESLint, Prettier, Vitest, Playwright, PostgreSQL, boot-time environment validation, and a placeholder worker process for future background jobs.

## Current Status

- Product intent is defined in `SPEC.md`.
- Implementation scope, checklist sequencing, and current handoff state live in `PRD.md`.
- Engineering and verification rules live in `AGENTS.md`.
- Active loop notes and crash-recovery context live in `NOTES.md`.
- `P0-01`, `P0-02`, `P0-03`, and `P0-04` are complete.
- `P0-02a` remains open. Compose-based lint, build, unit-test, and Chromium Playwright workflows now exist, but the item is still blocked because the current Docker build must reuse the repo-local `node_modules` tree until container access to `registry.npmjs.org` is resolved.

## Stack In Repo Today

- Next.js 16 App Router
- TypeScript
- Tailwind CSS 4
- PostgreSQL 16
- ESLint 9 with Next.js config
- Prettier 3 with Tailwind plugin
- Vitest + Testing Library
- Playwright for Chromium smoke coverage
- Zod environment validation
- A placeholder background worker with database heartbeat logging

## Repository Layout

- `src/app`: Next.js routes, layout, and global styling
- `src/components`: shared and page-specific UI components
- `src/lib`: shared runtime helpers such as env parsing and health checks
- `scripts`: runtime helper scripts including the placeholder worker
- `tests`: Playwright browser tests
- `docs/testing.md`: canonical host and compose verification workflows
- `docs/architecture.md`: current system topology, module boundaries, and Phase 0 constraints
- `docs/runbook.md`: operational commands, health checks, and failure recovery notes
- `docs/research`: dated external research notes
- `SPEC.md`: product context and market framing
- `PRD.md`: checklist state, contracts, and handoff
- `AGENTS.md`: operating rules for future loops
- `NOTES.md`: timestamped working notes for the current loop

## Local Setup

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

The current compose images intentionally reuse the repo-local dependency tree from `node_modules`, so run `npm install` before `docker compose up --build` or any compose-based test command. This is a temporary blocker tracked in `PRD.md`.

3. Install the Chromium browser used by host-side Playwright runs:

```bash
npm run e2e:install
```

The compose-managed Playwright workflow uses the official Playwright image and does not need a host browser install.

4. Start the local PostgreSQL, web app, and worker stack:

```bash
docker compose up --build
```

For a detached stack:

```bash
docker compose up --build -d
```

5. Optional: run the app directly on the host instead of through Compose:

```bash
npm run dev
```

The app serves at `http://127.0.0.1:3000`, PostgreSQL is exposed on `127.0.0.1:5432`, and the readiness endpoint is `http://127.0.0.1:3000/api/health`.

## Required Environment Variables

- `DATABASE_URL`: postgres connection string used by the app and worker. Required and validated at app boot.
- `POSTGRES_DB`: database name for the compose-managed PostgreSQL service.
- `POSTGRES_USER`: database user for the compose-managed PostgreSQL service.
- `POSTGRES_PASSWORD`: database password for the compose-managed PostgreSQL service.
- `WORKER_POLL_INTERVAL_MS`: optional worker heartbeat interval in milliseconds. Defaults to `30000`.

The committed `.env.example` contains the canonical development defaults.

## Verification Commands

- Lint: `npm run lint`
- Unit tests with coverage: `npm test`
- Production build: `npm run build`
- Chromium smoke test with a Playwright-managed local server: `npm run e2e`
- Chromium smoke test against an already-running compose stack: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npm run e2e`
- Compose lint: `docker compose --profile test run --rm test run lint`
- Compose unit tests with coverage: `docker compose --profile test run --rm test`
- Compose build validation: `docker compose --profile test run --rm test run build`
- Compose Chromium smoke test: `docker compose --profile test up --build --abort-on-container-exit --exit-code-from playwright playwright`
- Format check: `npm run format:check`
- Apply formatting: `npm run format`
- Compose stack status: `docker compose ps`
- Compose logs: `docker compose logs -f web worker`
- Compose teardown: `docker compose down`

`npm run e2e` starts the app automatically through the Playwright `webServer` configuration and injects a default local `DATABASE_URL` when one is not already set. When `PLAYWRIGHT_BASE_URL` is provided, Playwright skips the internal web server and targets the existing app instance instead.

See `docs/testing.md` for the durable verification workflow and the current compose limitation.
See `docs/architecture.md` and `docs/runbook.md` for the current system design and operator procedures.

## Current Workflow

The canonical Phase 0 loop is now:

1. Read `SPEC.md`, `PRD.md`, `AGENTS.md`, `README.md`, and `NOTES.md`.
2. Inspect `git status`.
3. Copy `.env.example` to `.env` if local env config is missing.
4. Select one unchecked PRD item.
5. Append timestamped task notes to `NOTES.md` during the loop.
6. Update durable docs in the same loop whenever setup, behavior, or requirements change.
7. Run the narrowest relevant verification, and for code changes also run the full automated suite currently available in the repo.
8. When the stack is needed, prefer `docker compose up --build` and a compose-backed Playwright smoke run.

## Known Gaps

- Compose test workflows still depend on a local `node_modules` tree because Docker containers in this environment cannot currently reach `registry.npmjs.org`
- No Prisma schema, auth layer, or real job runner yet
- `P0-02a` is still blocked on container access to `registry.npmjs.org`, so the compose verification path still depends on a prior host `npm install`

Those gaps are intentional scope still tracked in `PRD.md`; this README only documents what exists today.
