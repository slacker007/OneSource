import { PrismaClient } from "@prisma/client";

import { getServerEnv } from "@/lib/env";
import { createStructuredLogger } from "@/lib/observability/logger";

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
  return createStructuredLogger(service);
}
