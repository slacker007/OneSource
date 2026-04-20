# OneSource Deployment Guide

## Purpose

This guide captures the truthful deployment posture for the current repo. The only verified target today is a single-host internal pilot that runs the compose-managed `web`, `worker`, and `db` services with environment variables injected from `.env` or the host runtime.

## Current Supported Topology

- `web`: Next.js production server
- `worker`: background sweeps for reminders, saved-search sync, document parsing, and scorecard recalculation
- `db`: PostgreSQL 16
- persistent local volumes for PostgreSQL data and document uploads

This repo does not yet ship Kubernetes manifests, Terraform, managed-secret integrations, or a hosted deployment pipeline. A controlled internal pilot should therefore use the compose-managed topology that is already verified in this repo.

## Pre-Deploy Checklist

1. Build and test the exact revision you intend to deploy:

```bash
npm run prisma:validate
npm run lint
npm test
npm run build
make compose-test-e2e
```

2. Prepare the runtime environment:

- set `DATABASE_URL`, `AUTH_SECRET`, and `NEXTAUTH_URL`
- set `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD`
- set `DOCUMENT_UPLOAD_DIR` to a persistent writable path
- leave `SAM_GOV_USE_FIXTURES=false` unless you are intentionally deploying a deterministic demo environment
- set `SAM_GOV_API_KEY` only when live upstream `sam.gov` search is intended

3. Confirm host persistence paths exist and are writable:

- `./.docker/postgres-data` or your chosen PostgreSQL volume override
- `DOCUMENT_UPLOAD_DIR`

## Pilot Deployment Procedure

1. Start the compose-managed stack:

```bash
make compose-up-detached
```

2. Apply migrations against the running database:

```bash
npx prisma migrate deploy
```

3. Seed only when the target environment is intentionally disposable or demo-oriented:

```bash
npm run db:seed
```

Do not run the local demo seed against a persistent pilot environment unless the goal is to bootstrap the known demo workspace.

4. Confirm service health:

```bash
docker compose ps
curl http://127.0.0.1:3000/api/health
docker compose logs --tail=40 web worker
```

5. Run one browser smoke pass against the live stack:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npm run e2e
```

In this environment the canonical browser gate is still `make compose-test-e2e`, but the command above is useful for validating the already-running pilot stack directly.

## Post-Deploy Validation

Confirm all of the following before calling the pilot ready:

- `/api/health` returns HTTP `200` with `status: "ok"`
- admin sign-in works and `/settings` renders for `admin@onesource.local` in a seeded environment
- viewer users are redirected from `/settings` to `/forbidden`
- web logs remain structured JSON
- worker logs show successful sweep summaries rather than repeated failures
- document downloads for authenticated users remain organization-scoped

## Rollback Guidance

The repo currently supports operational rollback only at the compose-and-database level:

1. Stop the stack:

```bash
make compose-down
```

2. Restore the previous application image or checked-out revision.
3. Restore the database from the last known-good snapshot if the schema or seed state regressed.
4. Restart with `make compose-up-detached`.
5. Re-run `curl http://127.0.0.1:3000/api/health` and the compose-backed browser smoke check.

## Known Deployment Limits

- live `sam.gov` verification is already recorded in the repo, but automated acceptance still depends on deterministic fixture mode rather than live upstream availability
- CRM, document-repository, and communication adapters remain dry-run only
- the compose stack is the only verified runtime target in-repo today
- host-started Playwright `webServer` runs can be less stable than the compose-managed browser path on this machine
