import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const sourceClientRoot = path.join(repoRoot, "node_modules", ".prisma", "client");
const buildRoot = path.join(repoRoot, ".tmp-prisma-client-build");
const outputArchive = path.join(repoRoot, "vendor", "prisma-client.tar.gz");

if (!fs.existsSync(sourceClientRoot)) {
  throw new Error(
    "Generated Prisma client not found. Run `npm run prisma:generate` before refreshing the offline Prisma archive.",
  );
}

fs.rmSync(buildRoot, { force: true, recursive: true });
fs.mkdirSync(path.join(buildRoot, "client"), { recursive: true });

fs.cpSync(sourceClientRoot, path.join(buildRoot, "client"), {
  recursive: true,
});

fs.mkdirSync(path.dirname(outputArchive), { recursive: true });
fs.rmSync(outputArchive, { force: true });

const tarResult = spawnSync(
  "tar",
  [
    "--sort=name",
    "--mtime=@0",
    "--owner=0",
    "--group=0",
    "--numeric-owner",
    "-C",
    buildRoot,
    "-czf",
    outputArchive,
    ".",
  ],
  {
    cwd: repoRoot,
    stdio: "inherit",
  },
);

if (tarResult.status !== 0) {
  throw new Error("Failed to build offline Prisma client archive.");
}

fs.rmSync(buildRoot, { force: true, recursive: true });

const archiveSizeMb = (
  fs.statSync(outputArchive).size /
  (1024 * 1024)
).toFixed(1);

console.log(`Wrote ${outputArchive} (${archiveSizeMb} MiB).`);
