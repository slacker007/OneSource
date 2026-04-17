import { Client } from "pg";

import { getServerEnv } from "@/lib/env";

export async function checkDatabaseConnection() {
  const env = getServerEnv();
  const client = new Client({
    connectionString: env.DATABASE_URL,
  });

  try {
    await client.connect();
    await client.query("select 1 as healthcheck");

    return {
      ok: true as const,
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      ok: false as const,
      checkedAt: new Date().toISOString(),
      message:
        error instanceof Error ? error.message : "Unknown database failure",
    };
  } finally {
    await client.end().catch(() => undefined);
  }
}
