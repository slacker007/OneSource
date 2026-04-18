import { getServerEnv } from "@/lib/env";
import { runScheduledSourceSyncSweep } from "@/modules/source-integrations/source-sync-job";

import { createWorkerLogger, createWorkerPrisma } from "./job-runtime";

const env = getServerEnv();
const log = createWorkerLogger("source-sync-job");
const prisma = createWorkerPrisma();

async function main() {
  try {
    const result = await runScheduledSourceSyncSweep({
      db: prisma,
      log: ({ detail, level, message }) => log(level, message, detail),
      maxRuns: env.SOURCE_SYNC_BATCH_SIZE,
      minIntervalMinutes: env.SOURCE_SYNC_INTERVAL_MINUTES,
    });

    log("info", "Scheduled source sync job completed.", result);
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}

void main().catch((error) => {
  const message =
    error instanceof Error ? error.message : "Unknown scheduled source sync failure";
  log("error", "Scheduled source sync job failed.", {
    message,
  });
  process.exitCode = 1;
});
