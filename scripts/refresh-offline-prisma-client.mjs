import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const sourceClientRoot = path.join(repoRoot, "node_modules", ".prisma", "client");
const buildRoot = path.join(repoRoot, ".tmp-prisma-client-build");
const outputClientRoot = path.join(repoRoot, "vendor", "prisma-client");
const legacyArchive = path.join(repoRoot, "vendor", "prisma-client.tar.gz");

if (!fs.existsSync(sourceClientRoot)) {
  throw new Error(
    "Generated Prisma client not found. Run `npm run prisma:generate` before refreshing the offline Prisma archive.",
  );
}

fs.rmSync(buildRoot, { force: true, recursive: true });
fs.mkdirSync(path.join(buildRoot, "client"), { recursive: true });

fs.cpSync(sourceClientRoot, path.join(buildRoot, "client"), {
  dereference: true,
  recursive: true,
});

fs.mkdirSync(path.dirname(outputClientRoot), { recursive: true });
fs.rmSync(outputClientRoot, { force: true, recursive: true });
fs.cpSync(buildRoot, outputClientRoot, {
  dereference: true,
  recursive: true,
});
fs.rmSync(legacyArchive, { force: true });

fs.rmSync(buildRoot, { force: true, recursive: true });

const clientSizeMb = (getDirectorySize(outputClientRoot) / (1024 * 1024)).toFixed(1);

console.log(`Wrote ${outputClientRoot} (${clientSizeMb} MiB).`);

function getDirectorySize(rootPath) {
  let totalSize = 0;
  const stack = [rootPath];

  while (stack.length > 0) {
    const currentPath = stack.pop();
    const stat = fs.statSync(currentPath);

    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(currentPath)) {
        stack.push(path.join(currentPath, entry));
      }
      continue;
    }

    totalSize += stat.size;
  }

  return totalSize;
}
