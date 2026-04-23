import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(import.meta.dirname, "../../..");

type DevcontainerConfig = {
  build?: { dockerfile?: string; context?: string };
  containerEnv?: Record<string, string>;
  customizations?: {
    codespaces?: { openFiles?: string[] };
    vscode?: { extensions?: string[] };
  };
  features?: Record<string, unknown>;
  forwardPorts?: number[];
  postCreateCommand?: string;
  remoteUser?: string;
};

describe("devcontainer configuration", () => {
  it("defines a codespaces-ready workspace that preserves the repo compose workflow", () => {
    const config = JSON.parse(
      fs.readFileSync(
        path.join(repoRoot, ".devcontainer/devcontainer.json"),
        "utf8",
      ),
    ) as DevcontainerConfig;

    expect(config.build?.dockerfile).toBe("Dockerfile");
    expect(config.build?.context).toBe("..");
    expect(config.features).toHaveProperty(
      "ghcr.io/devcontainers/features/docker-outside-of-docker:1",
    );
    expect(config.features).toHaveProperty(
      "ghcr.io/devcontainers/features/github-cli:1",
    );
    expect(config.remoteUser).toBe("node");
    expect(config.containerEnv?.PLAYWRIGHT_BROWSERS_PATH).toBe(
      "/home/node/.cache/ms-playwright",
    );
    expect(config.postCreateCommand).toBe("bash .devcontainer/post-create.sh");
    expect(config.forwardPorts).toContain(3000);
    expect(config.forwardPorts).toContain(5432);
    expect(config.customizations?.codespaces?.openFiles).toEqual(
      expect.arrayContaining(["README.md", "PRD.md", "AGENTS.md"]),
    );
    expect(config.customizations?.vscode?.extensions).toEqual(
      expect.arrayContaining([
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "ms-playwright.playwright",
        "prisma.prisma",
        "ms-azuretools.vscode-docker",
      ]),
    );
  });

  it("installs Codex and bootstraps the repo for local dev and browser verification", () => {
    const dockerfile = fs.readFileSync(
      path.join(repoRoot, ".devcontainer/Dockerfile"),
      "utf8",
    );
    const postCreateScript = fs.readFileSync(
      path.join(repoRoot, ".devcontainer/post-create.sh"),
      "utf8",
    );

    expect(dockerfile).toContain(
      "mcr.microsoft.com/devcontainers/javascript-node:1-20-bookworm",
    );
    expect(dockerfile).toContain("postgresql-client");
    expect(dockerfile).toContain("npm install -g @openai/codex");
    expect(postCreateScript).toContain(
      "if [ ! -f .env ] && [ -f .env.example ]; then",
    );
    expect(postCreateScript).toContain("cp .env.example .env");
    expect(postCreateScript).toContain("npm ci");
    expect(postCreateScript).toContain("npm run prisma:generate");
    expect(postCreateScript).toContain(
      "sudo npx playwright install --with-deps chromium",
    );
  });
});
