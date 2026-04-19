import fs from "node:fs";
import path from "node:path";

import { buildDevArtifactCleanupPlan } from "./clean-dev-artifacts-lib.mjs";

const repoRoot = process.cwd();

if (!fs.existsSync(path.join(repoRoot, "package.json"))) {
  throw new Error("Run this script from the repository root.");
}

const plan = buildDevArtifactCleanupPlan({ repoRoot });

if (plan.removals.length === 0) {
  console.log("No local development artifacts found.");
  process.exit(0);
}

for (const removal of plan.removals) {
  console.log(`==> Remove ${removal.relativePath}: ${removal.label}`);
  fs.rmSync(removal.path, {
    force: true,
    recursive: true,
    maxRetries: 3,
  });
}

console.log(
  `Removed ${plan.removals.length} local development artifact path(s).`,
);
