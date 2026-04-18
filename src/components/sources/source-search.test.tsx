import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SourceSearch } from "./source-search";
import type { CsvImportWorkspaceSnapshot } from "@/modules/source-integrations/csv-import.service";
import type { SourceImportPreviewSnapshot } from "@/modules/source-integrations/source-import.service";
import type { SourceSearchSnapshot } from "@/modules/source-integrations/source-search.service";

const snapshot: SourceSearchSnapshot = {
  organization: {
    id: "org_123",
    name: "Default Organization",
    slug: "default-org",
  },
  connectors: [
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
  ],
  activeConnector: {
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
  activeCapability: {
    pageSizeOptions: [10, 25, 50, 100],
    procurementTypes: [
      {
        value: "r",
        label: "Sources Sought",
        description: "Early market research and capability requests.",
      },
    ],
    statusOptions: [
      { value: "", label: "All statuses" },
      { value: "active", label: "Active" },
    ],
    supportedFilterLabels: ["posted date range", "procurement type"],
  },
  formValues: {
    source: "sam_gov",
    keywords: "cloud operations",
    postedFrom: "2026-04-01",
    postedTo: "2026-04-30",
    rdlfrom: "",
    rdlto: "",
    ptype: ["r"],
    noticeid: "",
    solnum: "",
    organizationName: "",
    organizationCode: "",
    ncode: "541512",
    ccode: "",
    typeOfSetAside: "",
    typeOfSetAsideDescription: "",
    state: "VA",
    zip: "",
    status: "active",
    limit: "25",
    offset: "0",
  },
  query: {
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
  validationErrors: [],
  results: [
    {
      id: "source_army",
      naicsCode: "541512",
      sourceSystem: "sam_gov",
      noticeId: "W91QUZ-26-R-1042",
      title: "Army Cloud Operations Recompete",
      solicitationNumber: "W91QUZ-26-R-1042",
      organizationName: "PEO Enterprise Information Systems",
      organizationCode: "W91QUZ",
      postedDate: "2026-04-08",
      responseDeadline: "2026-05-20",
      procurementTypeCode: "r",
      procurementTypeLabel: "Sources Sought",
      status: "active",
      setAsideDescription: null,
      placeOfPerformanceState: "VA",
      placeOfPerformanceZip: "22350",
      summary:
        "Cloud operations, sustainment, and platform engineering support for Army enterprise systems.",
      uiLink: "https://sam.gov/opp/W91QUZ-26-R-1042/view",
    },
  ],
  totalCount: 1,
  pageResultCount: 1,
  executedAt: "2026-04-18T03:00:00.000Z",
  executionMode: "fixture_connector",
  executionMessage:
    "The page translated the canonical query into sam.gov search parameters and executed deterministic fixture responses through the reusable connector interface.",
  outboundRequest: {
    endpoint: "https://api.sam.gov/prod/opportunities/v2/search",
    queryParams: {
      postedFrom: "04/01/2026",
      postedTo: "04/30/2026",
      limit: 25,
      offset: 0,
      "ptype[]": ["r"],
      title: "cloud operations",
      state: "VA",
      status: "active",
      ncode: "541512",
    },
  },
  searchExecutionId: "search_exec_123",
  resultCountLabel: "Showing 1-1 of 1 external results",
};

const previewSnapshot: SourceImportPreviewSnapshot = {
  connector: {
    id: "connector_sam",
    sourceDisplayName: "SAM.gov",
  },
  alreadyTrackedOpportunity: null,
  duplicateCandidates: [
    {
      opportunityId: "opp_army",
      title: "Army Cloud Operations Recompete",
      currentStageLabel: "Qualified",
      originSourceSystem: "manual_entry",
      matchKind: "strong_candidate",
      matchReasons: [
        "Opportunity title matches exactly.",
        "Agency organization code matches.",
        "NAICS code matches.",
      ],
      matchScore: 87,
    },
  ],
  importPreview: {
    rawPayload: {
      noticeId: "W91QUZ-26-R-1042",
      title: "Army Cloud Operations Recompete",
    },
    normalizedPayload: {
      externalNoticeId: "W91QUZ-26-R-1042",
      title: "Army Cloud Operations Recompete",
    },
    normalizationVersion: "mock-sam-gov.v1",
    importPreviewPayload: {
      canonicalOpportunity: {
        title: "Army Cloud Operations Recompete",
      },
    },
    sourceDescriptionUrl: "https://sam.gov/opp/W91QUZ-26-R-1042/view",
    sourceDetailUrl: "https://api.sam.gov/prod/opportunities/v2/W91QUZ-26-R-1042",
    sourceHashFingerprint:
      "sam_gov:W91QUZ-26-R-1042:2026-04-08:541512:peo-enterprise-information-systems",
    sourceUiUrl: "https://sam.gov/opp/W91QUZ-26-R-1042/view",
    warnings: [
      "Mock preview uses deterministic detail payloads until the live sam.gov detail adapter lands.",
    ],
  },
  recommendedMode: "LINK_TO_EXISTING",
  result: snapshot.results[0],
  shouldAutoCanonicalize: true,
  suggestedTargetOpportunityId: "opp_army",
};

const csvImportSnapshot: CsvImportWorkspaceSnapshot = {
  agencies: [
    {
      id: "agency_1",
      label: "99th Contracting Squadron (FA4861)",
      name: "99th Contracting Squadron",
      organizationCode: "FA4861",
    },
  ],
  connector: {
    id: "connector_csv",
    isEnabled: true,
    sourceDisplayName: "CSV Upload",
    sourceSystemKey: "csv_upload",
  },
  opportunities: [
    {
      currentStageLabel: "Capture Active",
      externalNoticeId: "FA4861-26-R-0001",
      id: "opp_imported",
      leadAgencyName: "99th Contracting Squadron",
      leadAgencyOrganizationCode: "FA4861",
      naicsCode: "541511",
      responseDeadlineAt: "2026-05-04T12:00:00.000Z",
      solicitationNumber: "FA4861-26-R-0001",
      title: "Enterprise Knowledge Management Support Services",
    },
  ],
  organization: {
    id: "org_123",
    name: "Default Organization",
    slug: "default-org",
  },
};

describe("SourceSearch", () => {
  it("renders the preview panel with duplicate detection and import actions", () => {
    render(
      <SourceSearch
        csvImportAction={vi.fn(async () => undefined)}
        csvImportFeedback={{
          error: null,
          importedCount: null,
          skippedCount: null,
          status: null,
        }}
        csvImportSnapshot={csvImportSnapshot}
        importAction={vi.fn(async () => undefined)}
        importFeedback={{
          error: null,
          opportunityId: null,
          status: null,
        }}
        previewSnapshot={previewSnapshot}
        returnPath="/sources?keywords=cloud+operations&preview=source_army"
        snapshot={snapshot}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /external source search/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: /external source search results/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /source-result preview/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/fixture connector/i).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("heading", { name: /spreadsheet import workspace/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/^duplicate candidates$/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/canonical merge recommended/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /create tracked opportunity/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /merge into selected opportunity/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /spreadsheet import workspace/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/87 \/ 100/i)).toHaveLength(2);
  });

  it("renders validation guidance when the query is invalid", () => {
    render(
      <SourceSearch
        csvImportAction={vi.fn(async () => undefined)}
        csvImportFeedback={{
          error: null,
          importedCount: null,
          skippedCount: null,
          status: null,
        }}
        csvImportSnapshot={csvImportSnapshot}
        importAction={vi.fn(async () => undefined)}
        importFeedback={{
          error: null,
          opportunityId: null,
          status: null,
        }}
        previewSnapshot={null}
        returnPath="/sources"
        snapshot={{
          ...snapshot,
          executionMode: "invalid_query",
          executionMessage:
            "Search execution is blocked until the current filter values satisfy the typed sam.gov contract.",
          results: [],
          totalCount: 0,
          pageResultCount: 0,
          resultCountLabel: "Search not executed",
          outboundRequest: null,
          query: null,
          validationErrors: ["Posted date range cannot exceed one year."],
        }}
      />,
    );

    expect(
      screen.getByText(/search query needs correction/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/posted date range cannot exceed one year/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/search did not execute/i)).toBeInTheDocument();
  });
});
