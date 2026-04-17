import { NextResponse } from "next/server";

import { checkDatabaseConnection } from "@/lib/database-health";

export const dynamic = "force-dynamic";

export async function GET() {
  const database = await checkDatabaseConnection();

  if (!database.ok) {
    return NextResponse.json(
      {
        status: "degraded",
        database,
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    status: "ok",
    database,
  });
}
