# GitHub Actions CI Gate And GHCR Image Publishing

Date: 2026-04-23

## Sources

- GitHub `actions/setup-node` README: https://github.com/actions/setup-node
- GitHub Actions Docker image publishing guide: https://docs.github.com/actions/guides/publishing-docker-images
- GitHub Actions artifact sharing guide: https://docs.github.com/actions/tutorials/store-and-share-data
- Docker `build-push-action` README: https://github.com/docker/build-push-action

## Decision Impact

- Use `actions/setup-node` with Node 20 plus npm cache from `package-lock.json` for the fast CI test job.
- Use a GitHub Actions PostgreSQL service container for database-backed Prisma migrate, seed, and Playwright checks instead of Docker Compose.
- Upload `coverage`, `playwright-report`, and `test-results` only on failure with short retention so CI failures remain diagnosable without storing routine artifacts.
- Use Docker Buildx and Docker `build-push-action` to publish the Dockerfile `runner` target to GHCR after the test gate passes on `main` or manual dispatch.

## Assumptions

- Hosted CI should optimize for speed and should not use Docker Compose for test execution.
- GHCR image publishing is a release artifact step only; no deployment host, environment, or secret model is defined in this loop.
