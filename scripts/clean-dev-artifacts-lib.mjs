import fs from "node:fs";
import path from "node:path";

const FIXED_ARTIFACTS = [
  [".next", "Next.js build output"],
  ["out", "exported app output"],
  ["build", "local build output"],
  ["coverage", "coverage reports"],
  ["playwright-report", "Playwright HTML report"],
  ["test-results", "Playwright test artifacts"],
  ["node_modules", "installed npm dependencies"],
  [".data", "local uploaded documents and runtime data"],
  [".docker/postgres-data", "bind-mounted PostgreSQL data"],
  ["tmp-app", "local scaffold scratch space"],
  ["next-env.d.ts", "generated Next.js environment types"],
  ["vendor/npm-offline-cache", "offline npm cache directory"],
  ["vendor/prisma-client", "offline Prisma client directory"],
  ["vendor/npm-offline-cache.tar.gz", "legacy offline npm cache archive"],
  ["vendor/prisma-client.tar.gz", "legacy offline Prisma client archive"],
];

function getRootDisposableEntries(repoRoot, { existsSync, readdirSync }) {
  const entries = [];

  for (const entryName of readdirSync(repoRoot)) {
    if (
      !entryName.startsWith(".tmp") &&
      !entryName.endsWith(".tsbuildinfo")
    ) {
      continue;
    }

    const targetPath = path.join(repoRoot, entryName);

    if (!existsSync(targetPath)) {
      continue;
    }

    entries.push([
      entryName,
      entryName.startsWith(".tmp")
        ? `repo-local temporary entry \`${entryName}\``
        : `TypeScript build info \`${entryName}\``,
    ]);
  }

  return entries.sort(([left], [right]) => left.localeCompare(right));
}

export function getDevArtifactPaths(repoRoot) {
  const root = path.resolve(repoRoot);

  return {
    repoRoot: root,
    fixedArtifacts: FIXED_ARTIFACTS.map(([relativePath, label]) => ({
      relativePath,
      label,
      path: path.join(root, relativePath),
    })),
  };
}

export function buildDevArtifactCleanupPlan({
  repoRoot,
  existsSync = fs.existsSync,
  readdirSync = fs.readdirSync,
}) {
  const paths = getDevArtifactPaths(repoRoot);
  const removals = [];

  for (const artifact of paths.fixedArtifacts) {
    if (existsSync(artifact.path)) {
      removals.push(artifact);
    }
  }

  for (const [relativePath, label] of getRootDisposableEntries(paths.repoRoot, {
    existsSync,
    readdirSync,
  })) {
    removals.push({
      relativePath,
      label,
      path: path.join(paths.repoRoot, relativePath),
    });
  }

  return {
    ...paths,
    removals,
  };
}
