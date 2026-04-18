import { access, mkdir } from "node:fs/promises";
import path from "node:path";

import { checkDatabaseConnection } from "@/lib/database-health";
import { getServerEnv } from "@/lib/env";

export type RuntimeHealthCheck = {
  ok: boolean;
  checkedAt: string;
  message?: string;
  metadata?: Record<string, unknown>;
};

export type RuntimeHealthSnapshot = {
  status: "ok" | "degraded";
  checkedAt: string;
  service: "web";
  uptimeSeconds: number;
  environment: {
    nodeEnv: string;
    samGovFixtureMode: boolean;
  };
  database: RuntimeHealthCheck;
  documentStorage: RuntimeHealthCheck;
};

export async function checkDocumentStorageHealth(storageRoot?: string) {
  const env = getServerEnv();
  const resolvedStorageRoot = path.resolve(
    storageRoot ?? env.DOCUMENT_UPLOAD_DIR,
  );
  const checkedAt = new Date().toISOString();

  try {
    await mkdir(resolvedStorageRoot, { recursive: true });
    await access(resolvedStorageRoot);

    return {
      ok: true,
      checkedAt,
      metadata: {
        storageRoot: resolvedStorageRoot,
      },
    } satisfies RuntimeHealthCheck;
  } catch (error) {
    return {
      ok: false,
      checkedAt,
      message:
        error instanceof Error
          ? error.message
          : "Unknown document storage failure",
      metadata: {
        storageRoot: resolvedStorageRoot,
      },
    } satisfies RuntimeHealthCheck;
  }
}

export async function getRuntimeHealthSnapshot() {
  const env = getServerEnv();
  const checkedAt = new Date().toISOString();
  const [database, documentStorage] = await Promise.all([
    checkDatabaseConnection(),
    checkDocumentStorageHealth(),
  ]);

  return {
    status: database.ok && documentStorage.ok ? "ok" : "degraded",
    checkedAt,
    service: "web",
    uptimeSeconds: Math.round(process.uptime()),
    environment: {
      nodeEnv: env.NODE_ENV,
      samGovFixtureMode: env.SAM_GOV_USE_FIXTURES,
    },
    database,
    documentStorage,
  } satisfies RuntimeHealthSnapshot;
}
