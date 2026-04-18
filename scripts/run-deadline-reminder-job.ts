import { getServerEnv } from "@/lib/env";

import { createWorkerLogger, createWorkerPrisma } from "./job-runtime";
import { runDeadlineReminderSweep } from "./deadline-reminder-job.mjs";

const env = getServerEnv();
const log = createWorkerLogger("deadline-reminder-job");
const prisma = createWorkerPrisma();

function toWorkerLogLevel(value: unknown): "error" | "info" | "warn" {
  return value === "error" || value === "warn" || value === "info"
    ? value
    : "info";
}

function toWorkerLogMessage(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : "Deadline reminder log event";
}

function toWorkerLogDetail(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  return value as Record<string, unknown>;
}

async function main() {
  try {
    const result = await runDeadlineReminderSweep({
      db: prisma,
      log: ({ detail, level = "info", message }) =>
        log(
          toWorkerLogLevel(level),
          toWorkerLogMessage(message),
          toWorkerLogDetail(detail),
        ),
      lookaheadDays: env.DEADLINE_REMINDER_LOOKAHEAD_DAYS,
    });

    log("info", "Deadline reminder job completed.", result);
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}

void main().catch((error) => {
  const message =
    error instanceof Error ? error.message : "Unknown deadline reminder failure";
  log("error", "Deadline reminder job failed.", {
    message,
  });
  process.exitCode = 1;
});
