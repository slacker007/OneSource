import { PrismaClient } from "@prisma/client";

import { getServerEnv } from "@/lib/env";

export function createWorkerPrisma() {
  const env = getServerEnv();

  return new PrismaClient({
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
  });
}

export function createWorkerLogger(service = "worker") {
  return (
    level: "error" | "info" | "warn",
    message: string,
    detail?: Record<string, unknown>,
  ) => {
    const payload = {
      timestamp: new Date().toISOString(),
      service,
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
  };
}
