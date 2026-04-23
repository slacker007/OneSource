import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(import.meta.dirname, "../../..");

describe("compose test stack configuration", () => {
  it("defines a compose dev override that runs the web service in Next.js dev mode", () => {
    const composeDevFile = fs.readFileSync(
      path.join(repoRoot, "docker-compose.dev.yml"),
      "utf8",
    );
    const webServiceBlock =
      composeDevFile.match(/\n  web:\s*([\s\S]*?)\nvolumes:/)?.[1] ?? "";
    const makefile = fs.readFileSync(path.join(repoRoot, "Makefile"), "utf8");

    expect(webServiceBlock).toContain("target: deps");
    expect(webServiceBlock).toContain("NODE_ENV: development");
    expect(webServiceBlock).toContain('WATCHPACK_POLLING: "true"');
    expect(webServiceBlock).toContain("command: npm run dev:compose");
    expect(webServiceBlock).toContain("- .:/app");
    expect(webServiceBlock).toContain("- web_node_modules:/app/node_modules");
    expect(webServiceBlock).toContain("start_period: 45s");
    expect(composeDevFile).toContain("web_node_modules:");
    expect(makefile).toContain(
      "DEV_COMPOSE = $(COMPOSE) -f docker-compose.yml -f docker-compose.dev.yml",
    );
    expect(makefile).toContain("compose-dev:");
    expect(makefile).toContain("$(DEV_COMPOSE) up --build");
  });

  it("uses the dedicated non-production Docker target for the test service", () => {
    const composeFile = fs.readFileSync(
      path.join(repoRoot, "docker-compose.test.yml"),
      "utf8",
    );
    const testServiceBlock =
      composeFile.match(/\n  test:\s*([\s\S]*?)\n  web:/)?.[1] ?? "";

    expect(testServiceBlock).toContain("target: test");
    expect(testServiceBlock).not.toContain("target: runner");
    expect(testServiceBlock).toContain("- .:/app");
    expect(testServiceBlock).toContain("- test_node_modules:/app/node_modules");
    expect(testServiceBlock).toContain("while sleep 3600; do :; done");
    expect(testServiceBlock).toContain(
      "test -f /app/node_modules/.onesource-deps-hash && test -x /app/node_modules/.bin/eslint",
    );
    expect(testServiceBlock).toContain("retries: 90");
    expect(testServiceBlock).toContain("start_period: 10s");
  });

  it("defines a dedicated test Docker stage that skips the app build", () => {
    const dockerfile = fs.readFileSync(path.join(repoRoot, "Dockerfile"), "utf8");
    const testStageMatch = dockerfile.match(
      /FROM base AS test([\s\S]*?)FROM base AS builder/,
    );

    expect(testStageMatch?.[1]).toBeDefined();
    expect(testStageMatch?.[1]).toContain("ENV NODE_ENV=test");
    expect(testStageMatch?.[1]).toContain(
      "COPY --from=deps /app/node_modules /opt/onesource-test/node_modules",
    );
    expect(testStageMatch?.[1]).toContain("COPY . .");
    expect(testStageMatch?.[1]).not.toContain("npm run build");
  });

  it("uses a slim standalone browser-app target for compose e2e runs", () => {
    const dockerfile = fs.readFileSync(path.join(repoRoot, "Dockerfile"), "utf8");
    const e2eWebStageMatch = dockerfile.match(
      /FROM base AS e2e-web([\s\S]*?)FROM mcr\.microsoft\.com\/playwright:v1\.59\.1-noble AS playwright/,
    );
    const composeFile = fs.readFileSync(
      path.join(repoRoot, "docker-compose.test.yml"),
      "utf8",
    );
    const webServiceBlock =
      composeFile.match(/\n  web:\s*([\s\S]*?)\n  playwright:/)?.[1] ?? "";
    const nextConfig = fs.readFileSync(path.join(repoRoot, "next.config.ts"), "utf8");

    expect(nextConfig).toContain('output: "standalone"');
    expect(e2eWebStageMatch?.[1]).toBeDefined();
    expect(e2eWebStageMatch?.[1]).toContain(
      "COPY --from=builder /app/.next/standalone ./",
    );
    expect(e2eWebStageMatch?.[1]).toContain(
      "COPY --from=builder /app/.next/static ./.next/static",
    );
    expect(e2eWebStageMatch?.[1]).toContain('CMD ["node", "server.js"]');
    expect(webServiceBlock).toContain("target: e2e-web");
    expect(webServiceBlock).not.toContain("target: runner");
    expect(webServiceBlock).toContain("HOSTNAME: 0.0.0.0");
    expect(webServiceBlock).toContain("command: node server.js");
  });

  it("runs repeated compose test commands through exec instead of rebuilding", () => {
    const makefile = fs.readFileSync(path.join(repoRoot, "Makefile"), "utf8");

    expect(makefile).toContain(
      "TEST_COMPOSE = $(COMPOSE) -p onesource-test -f docker-compose.test.yml",
    );
    expect(makefile).toContain("compose-test-image:");
    expect(makefile).toContain("$(TEST_COMPOSE) build test");
    expect(makefile).toContain("compose-test-env-up:");
    expect(makefile).toContain("$(TEST_COMPOSE) up -d --wait db test");
    expect(makefile).toContain("compose-test-browser-image:");
    expect(makefile).toContain("$(TEST_COMPOSE) build web playwright");
    expect(makefile).toContain("compose-test-browser-image-fresh:");
    expect(makefile).toContain("$(TEST_COMPOSE) build --no-cache web playwright");
    expect(makefile).toContain("$(TEST_COMPOSE) exec -T test npm run lint");
    expect(makefile).toContain("$(TEST_COMPOSE) exec -T test npm test");
    expect(makefile).toContain("$(TEST_COMPOSE) exec -T test npm run build");
    expect(makefile).toContain(
      "$(TEST_COMPOSE) run --rm test ./node_modules/.bin/prisma migrate deploy --schema prisma/schema.prisma",
    );
    expect(makefile).toContain("$(TEST_COMPOSE) run --rm test node prisma/seed.mjs");
    expect(makefile).toContain("$(MAKE) compose-test-browser-image");
    expect(makefile).toContain("compose-down:");
    expect(makefile).toContain("$(DEV_COMPOSE) down --remove-orphans");
    expect(makefile).toContain("clean-dev-artifacts:");
    expect(makefile).toContain(
      "$(DEV_COMPOSE) down --rmi local -v --remove-orphans",
    );
    expect(makefile).not.toContain(
      "$(TEST_COMPOSE) run --rm --build test npm run lint",
    );
    expect(makefile).not.toContain("$(TEST_COMPOSE) run --rm --build test npm test");
    expect(makefile).not.toContain(
      "$(TEST_COMPOSE) run --rm --build test npm run build",
    );
  });
});
