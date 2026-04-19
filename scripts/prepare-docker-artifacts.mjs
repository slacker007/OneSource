import fs from "node:fs";
import { spawnSync } from "node:child_process";

import { buildDockerArtifactPlan } from "./prepare-docker-artifacts-lib.mjs";

const repoRoot = process.cwd();

if (!fs.existsSync(`${repoRoot}/package.json`)) {
  throw new Error("Run this script from the repository root.");
}

const plan = buildDockerArtifactPlan({ repoRoot });

if (plan.blockedByHostInstall) {
  console.error(
    [
      "Host npm dependencies are missing or stale.",
      "`make docker-artifacts` is an optional fallback for environments that already have a healthy host install.",
      "Run `npm ci --ignore-scripts` or `npm install` in a supported host runtime first, then rerun this command.",
    ].join(" "),
  );
  process.exit(1);
}

if (plan.steps.length === 0) {
  console.log("Local Docker cache archives are already up to date.");
  process.exit(0);
}

for (const step of plan.steps) {
  console.log(`==> ${step.label}: ${step.command.join(" ")}`);

  const result = spawnSync(step.command[0], step.command.slice(1), {
    cwd: repoRoot,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(`Prepared ${plan.paths.npmArchive} and ${plan.paths.prismaArchive}.`);
