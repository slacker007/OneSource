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
    const dockerfile = fs.readFileSync(
      path.join(repoRoot, "Dockerfile"),
      "utf8",
    );
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
    const dockerfile = fs.readFileSync(
      path.join(repoRoot, "Dockerfile"),
      "utf8",
    );
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"),
    ) as { scripts: Record<string, string> };
    const e2eWebStageMatch = dockerfile.match(
      /FROM base AS e2e-web([\s\S]*?)FROM mcr\.microsoft\.com\/playwright:v1\.59\.1-noble AS playwright/,
    );
    const composeFile = fs.readFileSync(
      path.join(repoRoot, "docker-compose.test.yml"),
      "utf8",
    );
    const webServiceBlock =
      composeFile.match(/\n  web:\s*([\s\S]*?)\n  playwright:/)?.[1] ?? "";
    const nextConfig = fs.readFileSync(
      path.join(repoRoot, "next.config.ts"),
      "utf8",
    );

    expect(nextConfig).toContain('output: "standalone"');
    expect(packageJson.scripts.start).toBe(
      "HOSTNAME=127.0.0.1 PORT=3000 node scripts/start-standalone.mjs",
    );
    expect(packageJson.scripts.start).not.toContain("next start");
    expect(packageJson.scripts["start:compose"]).toBe(
      "HOSTNAME=0.0.0.0 PORT=3000 node scripts/start-standalone.mjs",
    );
    expect(packageJson.scripts["start:compose"]).not.toContain("next start");
    expect(
      fs.readFileSync(
        path.join(repoRoot, "scripts/start-standalone.mjs"),
        "utf8",
      ),
    ).toContain("fs.cpSync(staticSource, staticTarget, { recursive: true })");
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
    expect(makefile).toContain(
      "$(TEST_COMPOSE) build --no-cache web playwright",
    );
    expect(makefile).toContain("$(TEST_COMPOSE) exec -T test npm run lint");
    expect(makefile).toContain("$(TEST_COMPOSE) exec -T test npm test");
    expect(makefile).toContain("$(TEST_COMPOSE) exec -T test npm run build");
    expect(makefile).toContain(
      "$(TEST_COMPOSE) run --rm test ./node_modules/.bin/prisma migrate deploy --schema prisma/schema.prisma",
    );
    expect(makefile).toContain(
      "$(TEST_COMPOSE) run --rm test node prisma/seed.mjs",
    );
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
    expect(makefile).not.toContain(
      "$(TEST_COMPOSE) run --rm --build test npm test",
    );
    expect(makefile).not.toContain(
      "$(TEST_COMPOSE) run --rm --build test npm run build",
    );
  });

  it("defines the hosted CI gate without using Docker Compose for tests", () => {
    const workflow = fs.readFileSync(
      path.join(repoRoot, ".github/workflows/ci.yml"),
      "utf8",
    );
    const testJobBlock =
      workflow.match(/\n  test:\s*([\s\S]*?)\n  image:/)?.[1] ?? "";
    const imageJobBlock = workflow.match(/\n  image:\s*([\s\S]*)/)?.[1] ?? "";

    expect(workflow).toContain("pull_request:");
    expect(workflow).toContain("branches:");
    expect(workflow).toContain("- main");
    expect(workflow).toContain("workflow_dispatch:");
    expect(testJobBlock).toContain("uses: actions/setup-node@v6");
    expect(testJobBlock).toContain("node-version: 20");
    expect(testJobBlock).toContain("image: postgres:16-bookworm");
    expect(testJobBlock).toContain("run: npm ci");
    expect(testJobBlock).toContain("run: npm run prisma:generate");
    expect(testJobBlock).toContain(
      "run: npx playwright install --with-deps chromium",
    );
    expect(testJobBlock).toContain("run: npm run prisma:validate");
    expect(testJobBlock).toContain("run: npx prisma migrate deploy");
    expect(testJobBlock).toContain("run: npm run db:seed");
    expect(testJobBlock).toContain("run: npm run lint");
    expect(testJobBlock).toContain("run: npm test");
    expect(testJobBlock).toContain("run: npm run build");
    expect(testJobBlock).toContain(
      "PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npm run e2e",
    );
    expect(testJobBlock).toContain("uses: actions/upload-artifact@v4");
    expect(testJobBlock).not.toContain("docker compose");
    expect(testJobBlock).not.toContain("make compose-test");
    expect(imageJobBlock).toContain("needs: test");
    expect(imageJobBlock).toContain("uses: docker/setup-buildx-action@v4");
    expect(imageJobBlock).toContain("docker login ghcr.io");
    expect(imageJobBlock).toContain("uses: docker/build-push-action@v7");
    expect(imageJobBlock).toContain("target: runner");
    expect(imageJobBlock).toContain("push: true");
    expect(imageJobBlock).toContain("ghcr.io/${GITHUB_REPOSITORY,,}");
  });
});
