import { getServerEnv } from "@/lib/env";
import { runOpportunityDocumentParsingSweep } from "@/modules/opportunities/opportunity-document-parsing-job";

import { createWorkerLogger, createWorkerPrisma } from "./job-runtime";

const env = getServerEnv();
const log = createWorkerLogger("document-parsing-job");
const prisma = createWorkerPrisma();

async function main() {
  try {
    const result = await runOpportunityDocumentParsingSweep({
      batchSize: env.DOCUMENT_PARSER_BATCH_SIZE,
      db: prisma,
      log: ({ detail, level, message }) => log(level, message, detail),
      maxAttempts: env.DOCUMENT_PARSER_MAX_ATTEMPTS,
    });

    log("info", "Document parsing job completed.", result);
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}

void main().catch((error) => {
  const message =
    error instanceof Error ? error.message : "Unknown document parsing failure";
  log("error", "Document parsing job failed.", {
    message,
  });
  process.exitCode = 1;
});
