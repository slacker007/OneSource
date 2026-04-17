# 2026-04-17 Playwright Docker Workflow Note

- Source: https://playwright.dev/docs/docker
- Why this research was needed: `P0-02a` required a compose-based Chromium workflow that works without host browser installs and follows the vendor-supported container guidance.

## Relevant Guidance

- Use the official Playwright Docker image for end-to-end execution so the browser runtime and OS dependencies are already present.
- Use `ipc: host` for Chromium stability inside containers.
- Use an init process so the browser container reaps child processes cleanly during test execution.

## Repo Decision

- Added a compose `playwright` service built from `mcr.microsoft.com/playwright:v1.59.1-noble`.
- Added `ipc: host` and `init: true` to that service.
- Kept the browser test target separate from the app runtime image so the web and worker containers stay smaller and the Chromium-specific dependencies remain isolated to the test workflow.
