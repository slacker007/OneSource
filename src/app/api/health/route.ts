import { NextResponse } from "next/server";

import { createStructuredLogger } from "@/lib/observability/logger";
import { getRuntimeHealthSnapshot } from "@/lib/runtime-health";

export const dynamic = "force-dynamic";

const log = createStructuredLogger("web");

export async function GET() {
  const health = await getRuntimeHealthSnapshot();

  if (health.status !== "ok") {
    log("warn", "Runtime health check reported a degraded dependency.", {
      databaseOk: health.database.ok,
      documentStorageOk: health.documentStorage.ok,
      status: health.status,
    });

    return NextResponse.json(
      health,
      { status: 503 },
    );
  }

  log("info", "Runtime health check completed.", {
    databaseOk: health.database.ok,
    documentStorageOk: health.documentStorage.ok,
    status: health.status,
  });

  return NextResponse.json(health);
}
