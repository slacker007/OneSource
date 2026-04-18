import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";

import { getServerEnv } from "@/lib/env";
import { runOpportunityDocumentParsingSweep } from "@/modules/opportunities/opportunity-document-parsing-job";
import { runOpportunityScorecardSweep } from "@/modules/opportunities/opportunity-scorecard-job";
import { runScheduledSourceSyncSweep } from "@/modules/source-integrations/source-sync-job";

import { createWorkerLogger, createWorkerPrisma } from "./job-runtime";
import { runDeadlineReminderSweep } from "./deadline-reminder-job.mjs";

const env = getServerEnv();
const log = createWorkerLogger();
const prisma = createWorkerPrisma();

let keepRunning = true;

process.on("SIGINT", () => {
  keepRunning = false;
});

process.on("SIGTERM", () => {
  keepRunning = false;
});

function toWorkerLogLevel(value: unknown): "error" | "info" | "warn" {
  return value === "error" || value === "warn" || value === "info"
    ? value
    : "info";
}

function toWorkerLogMessage(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : "Worker log event";
}

function toWorkerLogDetail(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  return value as Record<string, unknown>;
}

async function runWorkerIteration() {
  const reminderResult = await runDeadlineReminderSweep({
    db: prisma,
    log: ({ detail, level = "info", message }) =>
      log(
        toWorkerLogLevel(level),
        toWorkerLogMessage(message),
        toWorkerLogDetail(detail),
      ),
    lookaheadDays: env.DEADLINE_REMINDER_LOOKAHEAD_DAYS,
  });

  const sourceSyncResult = await runScheduledSourceSyncSweep({
    db: prisma,
    log: ({ detail, level, message }) => log(level, message, detail),
    maxRuns: env.SOURCE_SYNC_BATCH_SIZE,
    minIntervalMinutes: env.SOURCE_SYNC_INTERVAL_MINUTES,
  });

  const documentParsingResult = await runOpportunityDocumentParsingSweep({
    batchSize: env.DOCUMENT_PARSER_BATCH_SIZE,
    db: prisma,
    log: ({ detail, level, message }) => log(level, message, detail),
    maxAttempts: env.DOCUMENT_PARSER_MAX_ATTEMPTS,
  });

  const scorecardResult = await runOpportunityScorecardSweep({
    batchSize: env.OPPORTUNITY_SCORECARD_BATCH_SIZE,
    db: prisma,
    log: ({ detail, level, message }) => log(level, message, detail),
  });

  log("info", "Worker iteration complete.", {
    deadlineReminders: reminderResult,
    documentParsing: documentParsingResult,
    scorecards: scorecardResult,
    sourceSync: sourceSyncResult,
  });
}

async function main() {
  log("info", "Starting background worker.");

  while (keepRunning) {
    try {
      await runWorkerIteration();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown worker failure";
      log("error", "Background worker iteration failed.", {
        message,
      });
    }

    if (!keepRunning) {
      break;
    }

    await delay(env.WORKER_POLL_INTERVAL_MS);
  }

  await prisma.$disconnect().catch(() => undefined);

  log("info", "Worker shutdown complete.");
}

void main().catch((error) => {
  const message =
    error instanceof Error ? error.message : "Unknown worker startup failure";
  log("error", "Background worker failed to start.", {
    message,
  });
  process.exitCode = 1;
});
