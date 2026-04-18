import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildDockerArtifactPlan,
  getDockerArtifactPaths,
} from "../../../scripts/prepare-docker-artifacts-lib.mjs";

function createMockFs(files: Record<string, number>) {
  return {
    existsSync(filePath: string) {
      return filePath in files;
    },
    statSync(filePath: string) {
      const mtimeMs = files[filePath];

      if (mtimeMs === undefined) {
        throw new Error(`Missing mock stat for ${filePath}`);
      }

      return { mtimeMs };
    },
  };
}

describe("buildDockerArtifactPlan", () => {
  const repoRoot = path.join("/tmp", "onesource");
  const paths = getDockerArtifactPaths(repoRoot);

  it("plans install plus both archive refreshes when the local environment is missing", () => {
    const plan = buildDockerArtifactPlan({
      repoRoot,
      ...createMockFs({
        [paths.packageJson]: 10,
        [paths.packageLockJson]: 10,
        [paths.prismaSchema]: 10,
        [paths.prismaConfig]: 10,
        [paths.npmRefreshScript]: 10,
        [paths.prismaRefreshScript]: 10,
      }),
    });

    expect(plan.installNeeded).toBe(true);
    expect(plan.npmArchiveNeeded).toBe(true);
    expect(plan.prismaArchiveNeeded).toBe(true);
    expect(plan.steps.map((step) => step.label)).toEqual([
      "Install npm dependencies",
      "Generate Prisma client",
      "Refresh offline npm cache archive",
      "Refresh offline Prisma client archive",
    ]);
  });

  it("skips all work when the install marker and archives are newer than their inputs", () => {
    const plan = buildDockerArtifactPlan({
      repoRoot,
      ...createMockFs({
        [paths.packageJson]: 10,
        [paths.packageLockJson]: 10,
        [paths.nodeModulesLockMarker]: 20,
        [paths.prismaSchema]: 10,
        [paths.prismaConfig]: 10,
        [paths.npmRefreshScript]: 10,
        [paths.prismaRefreshScript]: 10,
        [paths.npmArchive]: 20,
        [paths.prismaArchive]: 20,
      }),
    });

    expect(plan.steps).toEqual([]);
  });

  it("refreshes only the prisma-side artifacts when the schema is newer than the prisma archive", () => {
    const plan = buildDockerArtifactPlan({
      repoRoot,
      ...createMockFs({
        [paths.packageJson]: 10,
        [paths.packageLockJson]: 10,
        [paths.nodeModulesLockMarker]: 20,
        [paths.prismaSchema]: 30,
        [paths.prismaConfig]: 10,
        [paths.npmRefreshScript]: 10,
        [paths.prismaRefreshScript]: 10,
        [paths.npmArchive]: 20,
        [paths.prismaArchive]: 20,
      }),
    });

    expect(plan.installNeeded).toBe(false);
    expect(plan.npmArchiveNeeded).toBe(false);
    expect(plan.prismaArchiveNeeded).toBe(true);
    expect(plan.steps.map((step) => step.label)).toEqual([
      "Generate Prisma client",
      "Refresh offline Prisma client archive",
    ]);
  });
});
