import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const standaloneRoot = path.join(repoRoot, ".next", "standalone");
const standaloneServer = path.join(standaloneRoot, "server.js");

if (!fs.existsSync(standaloneServer)) {
  throw new Error(
    "Standalone build output is missing. Run `npm run build` first.",
  );
}

const publicSource = path.join(repoRoot, "public");
const publicTarget = path.join(standaloneRoot, "public");
const staticSource = path.join(repoRoot, ".next", "static");
const staticTarget = path.join(standaloneRoot, ".next", "static");

if (fs.existsSync(publicSource)) {
  fs.rmSync(publicTarget, { force: true, recursive: true });
  fs.cpSync(publicSource, publicTarget, { recursive: true });
}

if (fs.existsSync(staticSource)) {
  fs.rmSync(staticTarget, { force: true, recursive: true });
  fs.mkdirSync(path.dirname(staticTarget), { recursive: true });
  fs.cpSync(staticSource, staticTarget, { recursive: true });
}

const server = spawn(process.execPath, [standaloneServer], {
  env: process.env,
  stdio: "inherit",
});

let receivedShutdownSignal = false;

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    receivedShutdownSignal = true;
    server.kill(signal);
  });
}

server.on("exit", (code, signal) => {
  process.exit(code ?? (signal && !receivedShutdownSignal ? 1 : 0));
});
