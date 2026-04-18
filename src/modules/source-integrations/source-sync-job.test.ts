import { describe, expect, it, vi } from "vitest";

import { runScheduledSourceSyncSweep } from "./source-sync-job";

describe("source-sync-job", () => {
  it("executes due saved searches and persists sync plus search envelopes", async () => {
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
});
