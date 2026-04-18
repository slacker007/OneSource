import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SourceSearch } from "./source-search";
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
      id: "sam_result_2",
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
  executionMode: "mocked_sam_gov",
  executionMessage:
    "The page translated the canonical query into sam.gov search parameters and executed a deterministic mocked response set so UI work can land before the live connector.",
  outboundRequest: {
    endpoint: "https://api.sam.gov/opportunities/v2/search",
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
  resultCountLabel: "Showing 1-1 of 1 mocked external results",
};

describe("SourceSearch", () => {
  it("renders the real external-search surface with translated request details", () => {
    render(<SourceSearch snapshot={snapshot} />);

    expect(
      screen.getByRole("heading", { name: /external source search/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: /external source search results/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/army cloud operations recompete/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/title: cloud operations/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /preview in p4-01b/i }),
    ).toBeDisabled();
  });

  it("renders validation guidance when the query is invalid", () => {
    render(
      <SourceSearch
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
