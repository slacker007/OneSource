import { getServerEnv } from "@/lib/env";
import { runOpportunityScorecardSweep } from "@/modules/opportunities/opportunity-scorecard-job";

import { createWorkerLogger, createWorkerPrisma } from "./job-runtime";

const env = getServerEnv();
const log = createWorkerLogger("opportunity-scorecard-job");
const prisma = createWorkerPrisma();

async function main() {
  try {
    const result = await runOpportunityScorecardSweep({
      batchSize: env.OPPORTUNITY_SCORECARD_BATCH_SIZE,
      db: prisma,
      log: ({ detail, level, message }) => log(level, message, detail),
    });

    log("info", "Opportunity scorecard job completed.", result);
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}

void main().catch((error) => {
  const message =
    error instanceof Error ? error.message : "Unknown scorecard job failure";
  log("error", "Opportunity scorecard job failed.", {
    message,
  });
  process.exitCode = 1;
});
