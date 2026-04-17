import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";

import { Client } from "pg";
import { z } from "zod";

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
});

const env = workerEnvSchema.parse(process.env);
let keepRunning = true;

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

async function runHeartbeat() {
  const client = new Client({
    connectionString: env.DATABASE_URL,
  });

  try {
    await client.connect();
    await client.query("select 1 as heartbeat");
    log(
      "info",
      "Background worker heartbeat completed. Placeholder worker is ready for future job runners.",
    );
  } finally {
    await client.end().catch(() => undefined);
  }
}

process.on("SIGINT", () => {
  keepRunning = false;
});

process.on("SIGTERM", () => {
  keepRunning = false;
});

log("info", "Starting placeholder background worker for Phase 0.");

while (keepRunning) {
  try {
    await runHeartbeat();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown worker failure";
    log("error", "Background worker heartbeat failed.", { message });
  }

  if (!keepRunning) {
    break;
  }

  await delay(env.WORKER_POLL_INTERVAL_MS);
}

log("info", "Worker shutdown complete.");
