import { describe, expect, it, vi } from "vitest";

import {
  buildSamGovOutboundRequest,
  executeMockSamGovSearch,
  getSourceSearchSnapshot,
  parseSourceSearchParams,
} from "./source-search.service";

function createRepositoryClient() {
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
          },
        ],
      }),
    },
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
      endpoint: "https://api.sam.gov/opportunities/v2/search",
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

  it("filters mocked sam.gov results by structured search params", () => {
    const requestState = parseSourceSearchParams({
      keywords: "cloud operations",
      postedFrom: "2026-04-01",
      postedTo: "2026-04-30",
      ptype: ["r"],
      state: "VA",
      limit: "25",
      offset: "0",
    });

    const execution = executeMockSamGovSearch(requestState.query!);

    expect(execution.totalCount).toBe(1);
    expect(execution.results).toMatchObject([
      {
        noticeId: "W91QUZ-26-R-1042",
        title: "Army Cloud Operations Recompete",
        procurementTypeCode: "r",
        placeOfPerformanceState: "VA",
      },
    ]);
  });

  it("builds a page snapshot with mocked results for sam.gov", async () => {
    const db = createRepositoryClient();

    const snapshot = await getSourceSearchSnapshot({
      db: db as never,
      searchParams: {
        keywords: "claims intake",
        postedFrom: "2026-03-01",
        postedTo: "2026-04-30",
        typeOfSetAside: "SDVOSB",
      },
    });

    expect(snapshot).not.toBeNull();
    expect(snapshot).toMatchObject({
      executionMode: "mocked_sam_gov",
      totalCount: 1,
      resultCountLabel: "Showing 1-1 of 1 mocked external results",
      activeConnector: {
        sourceSystemKey: "sam_gov",
      },
      results: [
        {
          noticeId: "36C10B26Q0142",
          title: "VA Claims Intake Automation BPA",
        },
      ],
    });
  });

  it("returns an unsupported-connector snapshot for other configured sources", async () => {
    const db = createRepositoryClient();

    const snapshot = await getSourceSearchSnapshot({
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
      resultCountLabel: "Connector not yet implemented",
      activeConnector: {
        sourceSystemKey: "usaspending_api",
      },
    });
  });
});
