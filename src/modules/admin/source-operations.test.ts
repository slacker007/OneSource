import { describe, expect, it } from "vitest";

import { buildAdminSourceOperationsSnapshot } from "./source-operations";

describe("buildAdminSourceOperationsSnapshot", () => {
  it("derives connector health, rate-limit posture, and failed import review rows", () => {
    const snapshot = buildAdminSourceOperationsSnapshot({
      connectorHealthRecords: [
        {
          id: "connector_sam",
          sourceSystemKey: "sam_gov",
          sourceDisplayName: "SAM.gov",
          isEnabled: true,
          validationStatus: "VALID",
          connectorVersion: "sam-gov.v1",
          lastValidatedAt: new Date("2026-04-18T08:00:00.000Z"),
          lastValidationMessage: "Validated successfully.",
          rateLimitProfile: {
            strategy: "bounded_api_key",
            notes: "Keep sync cadence below the public-api window.",
          },
          _count: {
            savedSearches: 1,
          },
          syncRuns: [
            {
              id: "sync_rate_limited",
              status: "FAILED",
              requestedAt: new Date("2026-04-18T08:15:00.000Z"),
              completedAt: new Date("2026-04-18T08:15:20.000Z"),
              errorCode: "sam_gov_http_429",
              errorMessage: "SAM.gov returned HTTP 429: Too many requests.",
              savedSearch: {
                id: "saved_search_123",
                name: "Daily Air Force Search",
              },
              searchExecution: {
                httpStatus: 429,
                errorCode: "sam_gov_http_429",
                errorMessage: "SAM.gov returned HTTP 429: Too many requests.",
              },
            },
            {
              id: "sync_success",
              status: "SUCCEEDED",
              requestedAt: new Date("2026-04-18T08:05:00.000Z"),
              completedAt: new Date("2026-04-18T08:05:10.000Z"),
              errorCode: null,
              errorMessage: null,
              savedSearch: {
                id: "saved_search_123",
                name: "Daily Air Force Search",
              },
              searchExecution: {
                httpStatus: 200,
                errorCode: null,
                errorMessage: null,
              },
            },
          ],
        },
        {
          id: "connector_usaspending",
          sourceSystemKey: "usaspending_api",
          sourceDisplayName: "USAspending API",
          isEnabled: true,
          validationStatus: "VALID",
          connectorVersion: "usaspending.v1",
          lastValidatedAt: new Date("2026-04-18T08:10:00.000Z"),
          lastValidationMessage: "Validated successfully.",
          rateLimitProfile: {
            strategy: "public_post_api",
            notes: "Public award search boundary.",
          },
          _count: {
            savedSearches: 1,
          },
          syncRuns: [
            {
              id: "sync_usaspending_success",
              status: "SUCCEEDED",
              requestedAt: new Date("2026-04-18T08:20:00.000Z"),
              completedAt: new Date("2026-04-18T08:20:10.000Z"),
              errorCode: null,
              errorMessage: null,
              savedSearch: {
                id: "saved_search_456",
                name: "Incumbent Award Context For KM Support",
              },
              searchExecution: {
                httpStatus: 200,
                errorCode: null,
                errorMessage: null,
              },
            },
          ],
        },
      ],
      recentSyncRunRecords: [
        {
          id: "sync_rate_limited",
          sourceSystem: "sam_gov",
          status: "FAILED",
          triggerType: "SCHEDULED",
          recordsFetched: 0,
          recordsImported: 0,
          recordsFailed: 1,
          requestedAt: new Date("2026-04-18T08:15:00.000Z"),
          completedAt: new Date("2026-04-18T08:15:20.000Z"),
          errorCode: "sam_gov_http_429",
          errorMessage: "SAM.gov returned HTTP 429: Too many requests.",
          connectorConfig: {
            sourceDisplayName: "SAM.gov",
            sourceSystemKey: "sam_gov",
          },
          savedSearch: {
            id: "saved_search_123",
            name: "Daily Air Force Search",
          },
          searchExecution: {
            httpStatus: 429,
            errorCode: "sam_gov_http_429",
            errorMessage: "SAM.gov returned HTTP 429: Too many requests.",
          },
        },
      ],
      failedImportDecisionRecords: [
        {
          id: "import_rejected",
          mode: "CREATE_OPPORTUNITY",
          status: "REJECTED",
          rationale:
            "Rejected because the notice was already canonicalized into the tracked pipeline.",
          requestedAt: new Date("2026-04-18T08:17:00.000Z"),
          decidedAt: new Date("2026-04-18T08:18:00.000Z"),
          connectorConfig: {
            sourceDisplayName: "SAM.gov",
          },
          sourceRecord: {
            sourceSystem: "sam_gov",
            sourceRecordId: "FA4861-26-R-0001",
            sourceImportPreviewPayload: {
              source: {
                title: "Enterprise Knowledge Management Support Services",
              },
            },
            sourceNormalizedPayload: {
              normalizedPayload: {
                title: "Enterprise Knowledge Management Support Services",
              },
            },
            sourceRawPayload: {
              title: "Enterprise Knowledge Management Support Services",
            },
          },
          targetOpportunity: {
            title: "Enterprise Knowledge Management Support Services",
          },
        },
      ],
    });

    expect(snapshot.totalConnectorCount).toBe(2);
    expect(snapshot.activeConnectorCount).toBe(2);
    expect(snapshot.healthyConnectorCount).toBe(1);
    expect(snapshot.rateLimitedConnectorCount).toBe(1);
    expect(snapshot.failedImportReviewCount).toBe(1);
    expect(snapshot.lastSuccessfulSyncSourceDisplayName).toBe("USAspending API");

    expect(snapshot.connectorHealth).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceDisplayName: "SAM.gov",
          healthStatus: "rate_limited",
          latestRateLimitAt: "2026-04-18T08:15:00.000Z",
          lastSuccessfulSyncAt: "2026-04-18T08:05:00.000Z",
          latestRetryableSavedSearchId: "saved_search_123",
        }),
        expect.objectContaining({
          sourceDisplayName: "USAspending API",
          healthStatus: "healthy",
          lastSuccessfulSyncAt: "2026-04-18T08:20:00.000Z",
        }),
      ]),
    );

    expect(snapshot.recentSyncRuns).toEqual([
      expect.objectContaining({
        id: "sync_rate_limited",
        canRetry: true,
        isRateLimited: true,
        httpStatus: 429,
        errorCode: "sam_gov_http_429",
        savedSearchId: "saved_search_123",
      }),
    ]);

    expect(snapshot.failedImportReviews).toEqual([
      expect.objectContaining({
        id: "import_rejected",
        sourceTitle: "Enterprise Knowledge Management Support Services",
        status: "REJECTED",
      }),
    ]);
  });
});
