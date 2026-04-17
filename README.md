# OneSource

OneSource is a capture intelligence platform for government contracting teams. The repo now has the Phase 0 application scaffold in place: a Next.js app with TypeScript, Tailwind CSS, ESLint, Prettier, Vitest, and Playwright, plus a basic homepage shell that acts as the starting surface for later product work.

## Current Status

- Product intent is defined in `SPEC.md`.
- Implementation scope, checklist sequencing, and current handoff state live in `PRD.md`.
- Engineering and verification rules live in `AGENTS.md`.
- Active loop notes and crash-recovery context live in `NOTES.md`.
- `P0-01` is the current scaffold milestone.
- `P0-02`, `P0-02a`, and `P0-03` remain open. There is no `docker compose` stack, database, worker, or environment-schema layer yet.

## Stack In Repo Today

- Next.js 16 App Router
- TypeScript
- Tailwind CSS 4
- ESLint 9 with Next.js config
- Prettier 3 with Tailwind plugin
- Vitest + Testing Library
- Playwright for Chromium smoke coverage

## Repository Layout

- `src/app`: Next.js routes, layout, and global styling
- `src/components`: shared and page-specific UI components
- `tests`: Playwright browser tests
- `docs/research`: dated external research notes
- `SPEC.md`: product context and market framing
- `PRD.md`: checklist state, contracts, and handoff
- `AGENTS.md`: operating rules for future loops
- `NOTES.md`: timestamped working notes for the current loop

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Install the Chromium browser used by Playwright:

```bash
npm run e2e:install
```

3. Start the local dev server:

```bash
npm run dev
```

The app serves at `http://127.0.0.1:3000`.

## Verification Commands

- Lint: `npm run lint`
- Unit tests with coverage: `npm test`
- Production build: `npm run build`
- Chromium smoke test: `npm run e2e`
- Format check: `npm run format:check`
- Apply formatting: `npm run format`

`npm run e2e` starts the app automatically through the Playwright `webServer` configuration and runs the browser smoke test against `http://127.0.0.1:3000`.

## Current Workflow

Until the containerized stack exists, the canonical loop is:

1. Read `SPEC.md`, `PRD.md`, `AGENTS.md`, `README.md`, and `NOTES.md`.
2. Inspect `git status`.
3. Select one unchecked PRD item.
4. Append timestamped task notes to `NOTES.md` during the loop.
5. Update durable docs in the same loop whenever setup, behavior, or requirements change.
6. Run the narrowest relevant verification, and for code changes also run the full automated suite currently available in the repo.

## Known Gaps

- No `docker compose` workflow yet
- No environment-variable schema or example env file yet
- No database, Prisma schema, auth layer, or worker process yet
- `docs/architecture.md` and `docs/runbook.md` are still missing, so `P0-03` remains incomplete

Those gaps are intentional scope still tracked in `PRD.md`; this README only documents what exists today.
