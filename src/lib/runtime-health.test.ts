import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  checkDocumentStorageHealth,
  getRuntimeHealthSnapshot,
} from "./runtime-health";

vi.mock("@/lib/database-health", () => ({
  checkDatabaseConnection: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  getServerEnv: vi.fn(),
}));

import { checkDatabaseConnection } from "@/lib/database-health";
import { getServerEnv } from "@/lib/env";

const mockedCheckDatabaseConnection = vi.mocked(checkDatabaseConnection);
const mockedGetServerEnv = vi.mocked(getServerEnv);

let tempDirectory: string | null = null;

afterEach(async () => {
  vi.clearAllMocks();

  if (tempDirectory) {
    await rm(tempDirectory, { recursive: true, force: true });
    tempDirectory = null;
  }
});

describe("checkDocumentStorageHealth", () => {
  it("creates or validates the configured storage root", async () => {
    tempDirectory = await mkdtemp(path.join(os.tmpdir(), "onesource-health-"));
    const nestedStorageRoot = path.join(tempDirectory, "documents", "uploads");

    mockedGetServerEnv.mockReturnValue({
      AUTH_SECRET: "x".repeat(32),
      DATABASE_URL: "postgres://postgres:postgres@127.0.0.1:5432/onesource",
      NEXTAUTH_URL: "http://127.0.0.1:3000",
      NODE_ENV: "test",
      DOCUMENT_UPLOAD_DIR: nestedStorageRoot,
      SAM_GOV_API_KEY: undefined,
      SAM_GOV_SEARCH_ENDPOINT: "https://api.sam.gov/prod/opportunities/v2/search",
      SAM_GOV_TIMEOUT_MS: 15000,
      SAM_GOV_USE_FIXTURES: true,
      WORKER_POLL_INTERVAL_MS: 30000,
      DEADLINE_REMINDER_LOOKAHEAD_DAYS: 7,
      SOURCE_SYNC_INTERVAL_MINUTES: 1440,
      SOURCE_SYNC_BATCH_SIZE: 3,
      DOCUMENT_PARSER_BATCH_SIZE: 10,
      DOCUMENT_PARSER_MAX_ATTEMPTS: 3,
      OPPORTUNITY_SCORECARD_BATCH_SIZE: 10,
    });

    const result = await checkDocumentStorageHealth();

    expect(result).toEqual({
      ok: true,
      checkedAt: expect.any(String),
      metadata: {
        storageRoot: nestedStorageRoot,
      },
    });
  });
});

describe("getRuntimeHealthSnapshot", () => {
  it("marks the runtime degraded when any required dependency is unhealthy", async () => {
    mockedGetServerEnv.mockReturnValue({
      AUTH_SECRET: "x".repeat(32),
      DATABASE_URL: "postgres://postgres:postgres@127.0.0.1:5432/onesource",
      NEXTAUTH_URL: "http://127.0.0.1:3000",
      NODE_ENV: "test",
      DOCUMENT_UPLOAD_DIR: ".data/opportunity-documents",
      SAM_GOV_API_KEY: undefined,
      SAM_GOV_SEARCH_ENDPOINT: "https://api.sam.gov/prod/opportunities/v2/search",
      SAM_GOV_TIMEOUT_MS: 15000,
      SAM_GOV_USE_FIXTURES: true,
      WORKER_POLL_INTERVAL_MS: 30000,
      DEADLINE_REMINDER_LOOKAHEAD_DAYS: 7,
      SOURCE_SYNC_INTERVAL_MINUTES: 1440,
      SOURCE_SYNC_BATCH_SIZE: 3,
      DOCUMENT_PARSER_BATCH_SIZE: 10,
      DOCUMENT_PARSER_MAX_ATTEMPTS: 3,
      OPPORTUNITY_SCORECARD_BATCH_SIZE: 10,
    });
    mockedCheckDatabaseConnection.mockResolvedValue({
      ok: false,
      checkedAt: "2026-04-18T18:10:00.000Z",
      message: "Connection refused",
    });

    const snapshot = await getRuntimeHealthSnapshot();

    expect(snapshot.status).toBe("degraded");
    expect(snapshot.database).toEqual({
      ok: false,
      checkedAt: "2026-04-18T18:10:00.000Z",
      message: "Connection refused",
    });
    expect(snapshot.documentStorage.ok).toBe(true);
    expect(snapshot.environment).toEqual({
      nodeEnv: "test",
      samGovFixtureMode: true,
    });
  });
});
