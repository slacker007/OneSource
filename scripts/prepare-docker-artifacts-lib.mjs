import fs from "node:fs";
import path from "node:path";

export function getDockerArtifactPaths(repoRoot) {
  return {
    packageJson: path.join(repoRoot, "package.json"),
    packageLockJson: path.join(repoRoot, "package-lock.json"),
    nodeModulesLockMarker: path.join(repoRoot, "node_modules", ".package-lock.json"),
    prismaSchema: path.join(repoRoot, "prisma", "schema.prisma"),
    prismaConfig: path.join(repoRoot, "prisma.config.mjs"),
    npmRefreshScript: path.join(repoRoot, "scripts", "refresh-offline-npm-cache.mjs"),
    prismaRefreshScript: path.join(
      repoRoot,
      "scripts",
      "refresh-offline-prisma-client.mjs",
    ),
    npmArchive: path.join(repoRoot, "vendor", "npm-offline-cache"),
    prismaArchive: path.join(repoRoot, "vendor", "prisma-client"),
  };
}

function getMtimeMs(filePath, existsSync, statSync) {
  if (!existsSync(filePath)) {
    return null;
  }

  return statSync(filePath).mtimeMs;
}

function isOutputMissingOrOlderThanInputs(
  outputPath,
  inputPaths,
  existsSync,
  statSync,
) {
  const outputMtimeMs = getMtimeMs(outputPath, existsSync, statSync);

  if (outputMtimeMs === null) {
    return true;
  }

  return inputPaths.some((inputPath) => {
    const inputMtimeMs = getMtimeMs(inputPath, existsSync, statSync);
    return inputMtimeMs !== null && inputMtimeMs > outputMtimeMs;
  });
}

export function buildDockerArtifactPlan({
  repoRoot,
  existsSync = fs.existsSync,
  statSync = fs.statSync,
}) {
  const paths = getDockerArtifactPaths(repoRoot);

  const hostInstallMissingOrStale = isOutputMissingOrOlderThanInputs(
    paths.nodeModulesLockMarker,
    [paths.packageJson, paths.packageLockJson],
    existsSync,
    statSync,
  );

  const npmArchiveNeeded =
    isOutputMissingOrOlderThanInputs(
      paths.npmArchive,
      [paths.packageLockJson, paths.npmRefreshScript],
      existsSync,
      statSync,
    );

  const prismaArchiveNeeded =
    isOutputMissingOrOlderThanInputs(
      paths.prismaArchive,
      [
        paths.packageLockJson,
        paths.prismaSchema,
        paths.prismaConfig,
        paths.prismaRefreshScript,
      ],
      existsSync,
      statSync,
    );

  const steps = [];

  const blockedByHostInstall =
    hostInstallMissingOrStale && (npmArchiveNeeded || prismaArchiveNeeded);

  if (!blockedByHostInstall) {
    if (prismaArchiveNeeded) {
      steps.push({
        label: "Generate Prisma client",
        command: ["npm", "run", "prisma:generate"],
      });
    }

    if (npmArchiveNeeded) {
      steps.push({
        label: "Refresh offline npm cache archive",
        command: ["npm", "run", "cache:npm:refresh"],
      });
    }

    if (prismaArchiveNeeded) {
      steps.push({
        label: "Refresh offline Prisma client archive",
        command: ["npm", "run", "cache:prisma:refresh"],
      });
    }
  }

  return {
    blockedByHostInstall,
    hostInstallReady: !hostInstallMissingOrStale,
    npmArchiveNeeded,
    paths,
    prismaArchiveNeeded,
    steps,
  };
}
