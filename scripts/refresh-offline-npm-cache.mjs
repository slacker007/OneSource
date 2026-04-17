import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const sourceCacheRoot = path.join(os.homedir(), ".npm", "_cacache");
const outputArchive = path.join(repoRoot, "vendor", "npm-offline-cache.tar.gz");
const buildRoot = path.join(repoRoot, ".tmp-npm-offline-cache-build");
const buildCacheRoot = path.join(buildRoot, "_cacache");

if (!fs.existsSync(path.join(repoRoot, "package-lock.json"))) {
  throw new Error("Run this script from the repository root.");
}

if (!fs.existsSync(sourceCacheRoot)) {
  throw new Error(`Host npm cache not found at ${sourceCacheRoot}.`);
}

const lockfile = JSON.parse(
  fs.readFileSync(path.join(repoRoot, "package-lock.json"), "utf8"),
);

const tarballKeys = new Set();

for (const [packagePath, metadata] of Object.entries(lockfile.packages ?? {})) {
  if (packagePath && !fs.existsSync(path.join(repoRoot, packagePath))) {
    continue;
  }

  if (
    metadata?.resolved &&
    metadata.resolved.startsWith("https://registry.npmjs.org/")
  ) {
    tarballKeys.add(`make-fetch-happen:request-cache:${metadata.resolved}`);
  }
}

fs.rmSync(buildRoot, { force: true, recursive: true });
fs.mkdirSync(path.join(buildRoot, "_logs"), { recursive: true });
fs.writeFileSync(path.join(buildRoot, "_update-notifier-last-checked"), "");

const indexRoot = path.join(sourceCacheRoot, "index-v5");
const indexStack = [indexRoot];

function readJsonRecordLines(filePath) {
  return fs
    .readFileSync(filePath, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf("\t");

      if (separatorIndex === -1) {
        return null;
      }

      return JSON.parse(line.slice(separatorIndex + 1));
    })
    .filter(Boolean);
}

function integrityToSha512Hex(integrity) {
  const [algorithm, base64Digest] = integrity.split("-", 2);

  if (algorithm !== "sha512") {
    return null;
  }

  return Buffer.from(base64Digest, "base64").toString("hex");
}

function copyIntoBuildCache(sourcePath, relativePath) {
  const destinationPath = path.join(buildCacheRoot, relativePath);
  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  fs.writeFileSync(destinationPath, fs.readFileSync(sourcePath));
}

let matchedEntries = 0;

while (indexStack.length > 0) {
  const currentPath = indexStack.pop();

  for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
    const fullPath = path.join(currentPath, entry.name);

    if (entry.isDirectory()) {
      indexStack.push(fullPath);
      continue;
    }

    for (const record of readJsonRecordLines(fullPath)) {
      if (!tarballKeys.has(record.key)) {
        continue;
      }

      matchedEntries += 1;
      copyIntoBuildCache(fullPath, path.relative(sourceCacheRoot, fullPath));

      const sha512Hex = record.integrity
        ? integrityToSha512Hex(record.integrity)
        : null;

      if (!sha512Hex) {
        break;
      }

      const contentRelativePath = path.join(
        "content-v2",
        "sha512",
        sha512Hex.slice(0, 2),
        sha512Hex.slice(2, 4),
        sha512Hex.slice(4),
      );
      const contentPath = path.join(sourceCacheRoot, contentRelativePath);

      if (fs.existsSync(contentPath)) {
        copyIntoBuildCache(contentPath, contentRelativePath);
      }

      break;
    }
  }
}

if (matchedEntries === 0) {
  throw new Error(
    "No dependency tarballs were copied. Refresh the host npm cache with `npm install` before rerunning this script.",
  );
}

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
  throw new Error("Failed to build offline npm cache archive.");
}

fs.rmSync(buildRoot, { force: true, recursive: true });

const archiveSizeMb = (
  fs.statSync(outputArchive).size /
  (1024 * 1024)
).toFixed(1);

console.log(
  `Wrote ${outputArchive} from ${matchedEntries} cached tarball entries (${archiveSizeMb} MiB).`,
);
