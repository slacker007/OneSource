import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildDevArtifactCleanupPlan,
  getDevArtifactPaths,
} from "../../../scripts/clean-dev-artifacts-lib.mjs";

function createMockFs(
  existingPaths: string[],
  rootEntries: string[] = [],
) {
  const pathSet = new Set(existingPaths);

  return {
    existsSync(filePath: string) {
      return pathSet.has(filePath);
    },
    readdirSync(directoryPath: string) {
      if (directoryPath !== path.join("/tmp", "onesource")) {
        throw new Error(`Unexpected readdir for ${directoryPath}`);
      }

      return rootEntries;
    },
  };
}

describe("buildDevArtifactCleanupPlan", () => {
  const repoRoot = path.join("/tmp", "onesource");
  const paths = getDevArtifactPaths(repoRoot);

  it("includes the known disposable repo-local development artifacts", () => {
    const dynamicTmpPath = path.join(repoRoot, ".tmp-playwright");
    const dynamicTsBuildInfoPath = path.join(repoRoot, "tsconfig.tsbuildinfo");
    const plan = buildDevArtifactCleanupPlan({
      repoRoot,
      ...createMockFs(
        [
          paths.fixedArtifacts.find((artifact) => artifact.relativePath === ".next")
            ?.path ?? "",
          paths.fixedArtifacts.find(
            (artifact) => artifact.relativePath === "node_modules",
          )?.path ?? "",
          paths.fixedArtifacts.find(
            (artifact) =>
              artifact.relativePath === "vendor/npm-offline-cache",
          )?.path ?? "",
          paths.fixedArtifacts.find(
            (artifact) => artifact.relativePath === ".docker/postgres-data",
          )?.path ?? "",
          dynamicTmpPath,
          dynamicTsBuildInfoPath,
        ],
        [".tmp-playwright", "README.md", "tsconfig.tsbuildinfo"],
      ),
    });

    expect(plan.removals.map((artifact) => artifact.relativePath)).toEqual([
      ".next",
      "node_modules",
      ".docker/postgres-data",
      "vendor/npm-offline-cache",
      ".tmp-playwright",
      "tsconfig.tsbuildinfo",
    ]);
  });

  it("returns no cleanup work when the repo has no disposable artifacts", () => {
    const plan = buildDevArtifactCleanupPlan({
      repoRoot,
      ...createMockFs([], ["README.md", "package.json"]),
    });

    expect(plan.removals).toEqual([]);
  });
});
