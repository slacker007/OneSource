import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/runtime-health", () => ({
  getRuntimeHealthSnapshot: vi.fn(),
}));

import { GET } from "./route";
import { getRuntimeHealthSnapshot } from "@/lib/runtime-health";

const mockedGetRuntimeHealthSnapshot = vi.mocked(getRuntimeHealthSnapshot);

describe("GET /api/health", () => {
  it("returns 200 when all runtime checks pass", async () => {
    mockedGetRuntimeHealthSnapshot.mockResolvedValue({
      status: "ok",
      checkedAt: "2026-04-18T18:00:00.000Z",
      service: "web",
      uptimeSeconds: 120,
      environment: {
        nodeEnv: "test",
        samGovFixtureMode: true,
      },
      database: {
        ok: true,
        checkedAt: "2026-04-18T18:00:00.000Z",
      },
      documentStorage: {
        ok: true,
        checkedAt: "2026-04-18T18:00:00.000Z",
      },
    });

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: "ok",
      service: "web",
    });
  });

  it("returns 503 when any runtime check is degraded", async () => {
    mockedGetRuntimeHealthSnapshot.mockResolvedValue({
      status: "degraded",
      checkedAt: "2026-04-18T18:00:00.000Z",
      service: "web",
      uptimeSeconds: 120,
      environment: {
        nodeEnv: "test",
        samGovFixtureMode: false,
      },
      database: {
        ok: false,
        checkedAt: "2026-04-18T18:00:00.000Z",
        message: "Connection refused",
      },
      documentStorage: {
        ok: true,
        checkedAt: "2026-04-18T18:00:00.000Z",
      },
    });

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      status: "degraded",
      database: {
        ok: false,
      },
    });
  });
});
