import { describe, expect, it, vi } from "vitest";

import {
  buildSamGovOutboundRequest,
  getSourceSearchSnapshot,
  parseSourceSearchParams,
} from "./source-search.service";

function createRepositoryClient() {
  const tx = {
    sourceRecord: {
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
      create: vi.fn(),
    },
    sourceSearchResult: {
      createMany: vi.fn(),
    },
  };

  vi.mocked(tx.sourceSearchExecution.create).mockResolvedValue({
    id: "search_exec_123",
    requestedAt: new Date("2026-04-18T09:00:00.000Z"),
  });
  vi.mocked(tx.sourceRecord.upsert)
    .mockResolvedValueOnce({ id: "source_enterprise" })
    .mockResolvedValueOnce({ id: "source_army" });
  vi.mocked(tx.sourceRecordAttachment.createMany).mockResolvedValue(undefined);
  vi.mocked(tx.sourceRecordAttachment.deleteMany).mockResolvedValue(undefined);
  vi.mocked(tx.sourceRecordAward.deleteMany).mockResolvedValue(undefined);
  vi.mocked(tx.sourceRecordAward.upsert).mockResolvedValue(undefined);
  vi.mocked(tx.sourceRecordContact.createMany).mockResolvedValue(undefined);
  vi.mocked(tx.sourceRecordContact.deleteMany).mockResolvedValue(undefined);
  vi.mocked(tx.sourceSearchResult.createMany).mockResolvedValue(undefined);

  return {
    organization: {
      findUnique: vi.fn().mockResolvedValue({
        id: "org_123",
        name: "Default Organization",
        slug: "default-org",
        sourceConnectorConfigs: [
          {
            id: "connector_sam",
            sourceSystemKey: "sam_gov",
            sourceDisplayName: "SAM.gov",
            authType: "API_KEY",
            isEnabled: true,
            supportsSearch: true,
            supportsScheduledSync: true,
            supportsResultPreview: true,
            connectorVersion: "sam-gov.v1",
            credentialReference: "secret://sam-gov/public-api-key",
          },
          {
            id: "connector_usaspending",
            sourceSystemKey: "usaspending_api",
            sourceDisplayName: "USAspending API",
            authType: "NONE",
            isEnabled: true,
            supportsSearch: true,
            supportsScheduledSync: true,
            supportsResultPreview: true,
            connectorVersion: "usaspending.v1",
            credentialReference: null,
          },
        ],
        sourceSavedSearches: [
          {
            id: "saved_search_cloud",
            name: "Daily Cloud Discovery",
            description: "Active cloud and platform pursuits.",
            sourceSystem: "sam_gov",
            canonicalFilters: {
              sourceSystem: "sam_gov",
              keywords: "cloud operations",
              postedDateFrom: "2026-04-01",
              postedDateTo: "2026-04-30",
              responseDeadlineFrom: null,
              responseDeadlineTo: null,
              procurementTypes: ["r"],
              noticeId: null,
              solicitationNumber: null,
              organizationName: null,
              organizationCode: null,
              naicsCode: "541512",
              classificationCode: null,
              setAsideCode: null,
              setAsideDescription: null,
              placeOfPerformanceState: "VA",
              placeOfPerformanceZip: null,
              status: "active",
              pageSize: 25,
              pageOffset: 0,
            },
            lastExecutedAt: new Date("2026-04-18T08:30:00.000Z"),
            lastSyncedAt: new Date("2026-04-18T08:45:00.000Z"),
          },
          {
            id: "saved_search_spending",
            name: "Incumbent Awards",
            description: "Future award-data queue.",
            sourceSystem: "usaspending_api",
            canonicalFilters: {
              sourceSystem: "usaspending_api",
              postedDateFrom: "2026-04-01",
              postedDateTo: "2026-04-30",
              pageSize: 25,
              pageOffset: 0,
            },
            lastExecutedAt: new Date("2026-04-17T08:30:00.000Z"),
            lastSyncedAt: null,
          },
        ],
      }),
    },
    $transaction: vi.fn(async (callback) => callback(tx)),
    __tx: tx,
  };
}

describe("source-search.service", () => {
  it("parses canonical source search params with bounded defaults", () => {
    const requestState = parseSourceSearchParams({
      keywords: "cloud operations",
      postedFrom: "2026-04-01",
      postedTo: "2026-04-30",
      ptype: ["r", "o"],
      state: "va",
      status: "active",
      limit: "50",
      offset: "10",
      ncode: "541512",
    });

    expect(requestState.validationErrors).toEqual([]);
    expect(requestState.query).toMatchObject({
      sourceSystem: "sam_gov",
      keywords: "cloud operations",
      postedDateFrom: "2026-04-01",
      postedDateTo: "2026-04-30",
      procurementTypes: ["r", "o"],
      placeOfPerformanceState: "VA",
      status: "active",
      pageSize: 50,
      pageOffset: 10,
      naicsCode: "541512",
    });
  });

  it("translates canonical filters into sam.gov outbound request params", () => {
    const requestState = parseSourceSearchParams({
      keywords: "knowledge management",
      postedFrom: "2026-04-01",
      postedTo: "2026-04-18",
      ptype: ["o"],
      organizationName: "99th Contracting Squadron",
      state: "NV",
      status: "active",
      limit: "25",
      offset: "0",
    });

    const outboundRequest = buildSamGovOutboundRequest(requestState.query!);

    expect(outboundRequest).toEqual({
      endpoint: "https://api.sam.gov/prod/opportunities/v2/search",
      queryParams: {
        postedFrom: "04/01/2026",
        postedTo: "04/18/2026",
        limit: 25,
        offset: 0,
        "ptype[]": ["o"],
        title: "knowledge management",
        organizationName: "99th Contracting Squadron",
        state: "NV",
        status: "active",
      },
    });
  });

  it("rejects invalid date ranges and oversized page sizes", () => {
    const requestState = parseSourceSearchParams({
      postedFrom: "2024-01-01",
      postedTo: "2026-04-18",
      rdlfrom: "2026-01-01",
      rdlto: "2027-04-02",
      limit: "1001",
    });

    expect(requestState.query).toBeNull();
    expect(requestState.validationErrors).toEqual([
      "Posted date range cannot exceed one year.",
      "Response deadline range cannot exceed one year.",
      "Page size cannot exceed 1000 for sam.gov searches.",
    ]);
  });

  it("builds a persisted fixture-backed search snapshot for sam.gov", async () => {
    process.env.SAM_GOV_USE_FIXTURES = "true";
    const db = createRepositoryClient();

    const snapshot = await getSourceSearchSnapshot({
      actor: {
        email: "alex.morgan@onesource.local",
        organizationId: "org_123",
        userId: "user_123",
      },
      db: db as never,
      searchParams: {
        keywords: "operations",
        postedFrom: "2026-03-01",
        postedTo: "2026-04-30",
      },
    });

    expect(snapshot).not.toBeNull();
    expect(snapshot).toMatchObject({
      executionMode: "fixture_connector",
      totalCount: 2,
      resultCountLabel: "Showing 1-2 of 2 external results",
      searchExecutionId: "search_exec_123",
      activeConnector: {
        sourceSystemKey: "sam_gov",
      },
      savedSearches: [
        {
          id: "saved_search_cloud",
          name: "Daily Cloud Discovery",
          sourceSystem: "sam_gov",
          query: {
            keywords: "cloud operations",
            naicsCode: "541512",
          },
        },
      ],
      results: [
        {
          id: "source_enterprise",
          noticeId: "FA4861-26-R-0001",
          title: "Enterprise Knowledge Management Support Services",
          naicsCode: "541511",
        },
        {
          id: "source_army",
          noticeId: "W91QUZ-26-R-1042",
          title: "Army Cloud Operations Recompete",
          naicsCode: "541512",
        },
      ],
    });
    expect(db.__tx.sourceSearchExecution.create).toHaveBeenCalledTimes(1);
    expect(db.__tx.sourceRecord.upsert).toHaveBeenCalledTimes(2);
    expect(db.__tx.sourceRecordAttachment.deleteMany).toHaveBeenCalledTimes(2);
    expect(db.__tx.sourceRecordAttachment.createMany).toHaveBeenCalledTimes(2);
    expect(db.__tx.sourceRecordContact.deleteMany).toHaveBeenCalledTimes(2);
    expect(db.__tx.sourceRecordContact.createMany).toHaveBeenCalledTimes(2);
    expect(db.__tx.sourceRecordAward.deleteMany).toHaveBeenCalledTimes(2);
    expect(db.__tx.sourceRecordAward.upsert).not.toHaveBeenCalled();
    expect(db.__tx.sourceRecordAttachment.createMany).toHaveBeenNthCalledWith(1, {
      data: [
        expect.objectContaining({
          displayLabel: "Performance Work Statement",
          linkType: "resource_link",
          sortOrder: 0,
          sourceRecordId: "source_enterprise",
        }),
        expect.objectContaining({
          displayLabel: "Questions And Answers",
          linkType: "resource_link",
          sortOrder: 1,
          sourceRecordId: "source_enterprise",
        }),
      ],
    });
    expect(db.__tx.sourceRecordContact.createMany).toHaveBeenNthCalledWith(2, {
      data: [
        expect.objectContaining({
          contactType: "primary",
          fullName: "PEO Contracting Lead",
          sortOrder: 0,
          sourceRecordId: "source_army",
        }),
      ],
    });
    expect(db.__tx.sourceSearchResult.createMany).toHaveBeenCalledWith({
      data: [
        {
          resultRank: 1,
          searchExecutionId: "search_exec_123",
          sourceRecordId: "source_enterprise",
        },
        {
          resultRank: 2,
          searchExecutionId: "search_exec_123",
          sourceRecordId: "source_army",
        },
      ],
    });
  });

  it("returns an unsupported-connector snapshot for other configured sources", async () => {
    const db = createRepositoryClient();

    const snapshot = await getSourceSearchSnapshot({
      actor: {
        email: "alex.morgan@onesource.local",
        organizationId: "org_123",
        userId: "user_123",
      },
      db: db as never,
      searchParams: {
        source: "usaspending_api",
        postedFrom: "2026-03-01",
        postedTo: "2026-04-30",
      },
    });

    expect(snapshot).not.toBeNull();
    expect(snapshot).toMatchObject({
      executionMode: "unsupported_connector",
      totalCount: 0,
      resultCountLabel: "No external results returned",
      activeConnector: {
        sourceSystemKey: "usaspending_api",
      },
    });
  });
});
