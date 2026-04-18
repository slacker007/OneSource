import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";

import { z } from "zod";

import { PrismaClient } from "@prisma/client";

import {
  DEFAULT_DEADLINE_REMINDER_LOOKAHEAD_DAYS,
  runDeadlineReminderSweep,
} from "./deadline-reminder-job.mjs";

const workerEnvSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required.")
    .refine((value) => {
      try {
        const protocol = new URL(value).protocol;
        return protocol === "postgres:" || protocol === "postgresql:";
      } catch {
        return false;
      }
    }, "DATABASE_URL must be a valid postgres connection string."),
  WORKER_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(30000),
  DEADLINE_REMINDER_LOOKAHEAD_DAYS: z.coerce
    .number()
    .int()
    .positive()
    .default(DEFAULT_DEADLINE_REMINDER_LOOKAHEAD_DAYS),
});

const env = workerEnvSchema.parse(process.env);
let keepRunning = true;
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: env.DATABASE_URL,
    },
  },
});

function log(level, message, detail) {
  const payload = {
    timestamp: new Date().toISOString(),
    service: "worker",
    level,
    message,
    ...(detail ? { detail } : {}),
  };

  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
    return;
  }

  console.log(line);
}

async function runDeadlineSweep() {
  return runDeadlineReminderSweep({
    db: prisma,
    lookaheadDays: env.DEADLINE_REMINDER_LOOKAHEAD_DAYS,
    log: ({ level, message, detail }) => log(level ?? "info", message, detail),
  });
}

process.on("SIGINT", () => {
  keepRunning = false;
});

process.on("SIGTERM", () => {
  keepRunning = false;
});

log("info", "Starting deadline reminder worker.");

while (keepRunning) {
  try {
    await runDeadlineSweep();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown worker failure";
    log("error", "Deadline reminder worker iteration failed.", { message });
  }

  if (!keepRunning) {
    break;
  }

  await delay(env.WORKER_POLL_INTERVAL_MS);
}

await prisma.$disconnect().catch(() => undefined);

log("info", "Worker shutdown complete.");
