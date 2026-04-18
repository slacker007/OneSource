import { describe, expect, it, vi } from "vitest";

import {
  executeSamGovSearch,
  SamGovConnectorError,
} from "./sam-gov.connector";
import {
  queueSourceSyncRetry,
  runScheduledSourceSyncSweep,
} from "./source-sync-job";

vi.mock("./sam-gov.connector", async () => {
  const actual = await vi.importActual<typeof import("./sam-gov.connector")>(
    "./sam-gov.connector",
  );

  return {
    ...actual,
    executeSamGovSearch: vi.fn(actual.executeSamGovSearch),
  };
});

describe("source-sync-job", () => {
  it("executes due saved searches and persists sync plus search envelopes", async () => {
    vi.mocked(executeSamGovSearch).mockClear();
    process.env.SAM_GOV_USE_FIXTURES = "true";

    const tx = {
      sourceRecord: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ id: "source_army" }),
        upsert: vi
          .fn()
          .mockResolvedValueOnce({ id: "source_enterprise" })
          .mockResolvedValueOnce({ id: "source_army" }),
      },
      sourceRecordAttachment: {
        createMany: vi.fn().mockResolvedValue(undefined),
        deleteMany: vi.fn().mockResolvedValue(undefined),
      },
      sourceRecordAward: {
        deleteMany: vi.fn().mockResolvedValue(undefined),
        upsert: vi.fn().mockResolvedValue(undefined),
      },
      sourceRecordContact: {
        createMany: vi.fn().mockResolvedValue(undefined),
        deleteMany: vi.fn().mockResolvedValue(undefined),
      },
      sourceSearchExecution: {
        create: vi.fn().mockResolvedValue({
          id: "search_exec_123",
          requestedAt: new Date("2026-04-18T12:00:00.000Z"),
        }),
      },
      sourceSearchResult: {
        createMany: vi.fn().mockResolvedValue(undefined),
      },
      sourceSyncRunRecord: {
        createMany: vi.fn().mockResolvedValue(undefined),
      },
      sourceSavedSearch: {
        update: vi.fn().mockResolvedValue(undefined),
      },
    };

    const db = {
      sourceSavedSearch: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "saved_search_123",
            organizationId: "org_123",
            sourceSystem: "sam_gov",
            name: "Daily Cloud Discovery",
            canonicalFilters: {
              sourceSystem: "sam_gov",
              postedDateFrom: "2026-03-01",
              postedDateTo: "2026-04-30",
              pageSize: 25,
              pageOffset: 0,
              keywords: "operations",
              procurementTypes: [],
            },
            lastSyncedAt: null,
            connectorConfig: {
              id: "connector_sam",
              sourceSystemKey: "sam_gov",
              sourceDisplayName: "SAM.gov",
              isEnabled: true,
              supportsScheduledSync: true,
              credentialReference: "secret://sam-gov/public-api-key",
              connectorVersion: "sam-gov.v1",
            },
          },
        ]),
      },
      sourceSyncRun: {
        create: vi.fn().mockResolvedValue({
          id: "sync_run_123",
        }),
        update: vi.fn().mockResolvedValue(undefined),
      },
      $transaction: vi.fn(async (callback) => callback(tx)),
    };

    const result = await runScheduledSourceSyncSweep({
      db: db as never,
      maxRuns: 1,
      minIntervalMinutes: 60,
      now: new Date("2026-04-18T12:00:00.000Z"),
    });

    expect(result).toEqual({
      failedRuns: 0,
      processedRuns: 1,
      queuedSavedSearches: 1,
      succeededRuns: 1,
    });
    expect(db.sourceSyncRun.create).toHaveBeenCalledTimes(1);
    expect(tx.sourceSearchExecution.create).toHaveBeenCalledTimes(1);
    expect(tx.sourceRecord.upsert).toHaveBeenCalledTimes(2);
    expect(tx.sourceSyncRunRecord.createMany).toHaveBeenCalledWith({
      data: [
        {
          sourceRecordId: "source_enterprise",
          syncAction: "DISCOVERED",
          syncRunId: "sync_run_123",
        },
        {
          sourceRecordId: "source_army",
          syncAction: "UPDATED",
          syncRunId: "sync_run_123",
        },
      ],
    });
    expect(db.sourceSyncRun.update).toHaveBeenLastCalledWith({
      where: {
        id: "sync_run_123",
      },
      data: expect.objectContaining({
        recordsFetched: 2,
        recordsImported: 0,
        status: "SUCCEEDED",
      }),
    });
  });

  it("downgrades rate-limited sync failures to warning logs while persisting the failed run", async () => {
    vi.mocked(executeSamGovSearch).mockRejectedValueOnce(
      new SamGovConnectorError({
        code: "sam_gov_http_429",
        httpStatus: 429,
        message: "SAM.gov returned HTTP 429: Too many requests.",
        outboundRequest: {
          endpoint: "https://api.sam.gov/prod/opportunities/v2/search",
          queryParams: {
            postedFrom: "03/01/2026",
            postedTo: "04/30/2026",
            limit: 25,
            offset: 0,
          },
        },
        responseLatencyMs: 812,
      }),
    );

    const tx = {
      sourceRecord: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
      sourceRecordAttachment: {
        createMany: vi.fn(),
        deleteMany: vi.fn(),
      },
      sourceRecordAward: {
        deleteMany: vi.fn(),
        upsert: vi.fn(),
      },
      sourceRecordContact: {
        createMany: vi.fn(),
        deleteMany: vi.fn(),
      },
      sourceSearchExecution: {
        create: vi.fn().mockResolvedValue({
          id: "search_exec_failed",
          requestedAt: new Date("2026-04-18T12:00:00.000Z"),
        }),
      },
      sourceSearchResult: {
        createMany: vi.fn(),
      },
      sourceSyncRunRecord: {
        createMany: vi.fn(),
      },
      sourceSavedSearch: {
        update: vi.fn().mockResolvedValue(undefined),
      },
    };

    const db = {
      sourceSavedSearch: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "saved_search_123",
            organizationId: "org_123",
            sourceSystem: "sam_gov",
            name: "Daily Cloud Discovery",
            canonicalFilters: {
              sourceSystem: "sam_gov",
              postedDateFrom: "2026-03-01",
              postedDateTo: "2026-04-30",
              pageSize: 25,
              pageOffset: 0,
              keywords: "operations",
              procurementTypes: [],
            },
            lastSyncedAt: null,
            connectorConfig: {
              id: "connector_sam",
              sourceSystemKey: "sam_gov",
              sourceDisplayName: "SAM.gov",
              isEnabled: true,
              supportsScheduledSync: true,
              credentialReference: "secret://sam-gov/public-api-key",
              connectorVersion: "sam-gov.v1",
            },
          },
        ]),
      },
      sourceSyncRun: {
        create: vi.fn().mockResolvedValue({
          id: "sync_run_123",
        }),
        update: vi.fn().mockResolvedValue(undefined),
      },
      $transaction: vi.fn(async (callback) => callback(tx)),
    };
    const log = vi.fn();

    const result = await runScheduledSourceSyncSweep({
      db: db as never,
      log,
      maxRuns: 1,
      minIntervalMinutes: 60,
      now: new Date("2026-04-18T12:00:00.000Z"),
    });

    expect(result.failedRuns).toBe(1);
    expect(tx.sourceSearchExecution.create).toHaveBeenCalledTimes(1);
    expect(db.sourceSyncRun.update).toHaveBeenLastCalledWith({
      where: {
        id: "sync_run_123",
      },
      data: expect.objectContaining({
        errorCode: "sam_gov_http_429",
        recordsFailed: 1,
        status: "FAILED",
      }),
    });
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "warn",
        message: "Scheduled sync rate limited for Daily Cloud Discovery.",
      }),
    );
  });

  it("queues a specific saved search for retry without forcing an immediate sync execution", async () => {
    const db = {
      sourceSavedSearch: {
        findMany: vi.fn(),
        findFirst: vi.fn().mockResolvedValue({
          id: "saved_search_123",
          organizationId: "org_123",
          sourceSystem: "sam_gov",
          name: "Daily Cloud Discovery",
          canonicalFilters: {
            sourceSystem: "sam_gov",
            postedDateFrom: "2026-03-01",
            postedDateTo: "2026-04-30",
            pageSize: 25,
            pageOffset: 0,
            keywords: "operations",
            procurementTypes: [],
          },
          lastSyncedAt: new Date("2026-04-17T12:00:00.000Z"),
          connectorConfig: {
            id: "connector_sam",
            sourceSystemKey: "sam_gov",
            sourceDisplayName: "SAM.gov",
            isEnabled: true,
            supportsScheduledSync: true,
            credentialReference: "secret://sam-gov/public-api-key",
            connectorVersion: "sam-gov.v1",
          },
        }),
        update: vi.fn().mockResolvedValue(undefined),
      },
      sourceSyncRun: {
        create: vi.fn(),
        update: vi.fn(),
      },
      $transaction: vi.fn(),
    };

    const result = await queueSourceSyncRetry({
      db: db as never,
      organizationId: "org_123",
      savedSearchId: "saved_search_123",
    });

    expect(result).toEqual({
      savedSearchId: "saved_search_123",
      savedSearchName: "Daily Cloud Discovery",
      status: "QUEUED",
    });
    expect(db.sourceSavedSearch.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "saved_search_123",
          organizationId: "org_123",
        }),
      }),
    );
    expect(db.sourceSavedSearch.update).toHaveBeenCalledWith({
      where: {
        id: "saved_search_123",
      },
      data: {
        lastSyncedAt: null,
      },
    });
    expect(db.sourceSyncRun.create).not.toHaveBeenCalled();
  });
});
