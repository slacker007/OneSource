import { ProxyAgent } from "undici";
import { afterEach, describe, expect, it } from "vitest";

import {
  executeSamGovSearch,
  materializeSamGovSourceRecord,
  SamGovConnectorError,
} from "./sam-gov.connector";

const liveQuery = {
  classificationCode: null,
  keywords: "cloud operations",
  naicsCode: null,
  noticeId: null,
  organizationCode: null,
  organizationName: null,
  pageOffset: 0,
  pageSize: 5,
  placeOfPerformanceState: null,
  placeOfPerformanceZip: null,
  postedDateFrom: "2026-04-01",
  postedDateTo: "2026-04-19",
  procurementTypes: [],
  responseDeadlineFrom: null,
  responseDeadlineTo: null,
  setAsideCode: null,
  setAsideDescription: null,
  solicitationNumber: null,
  sourceSystem: "sam_gov",
  status: "active",
} as const;

describe("sam-gov.connector", () => {
  afterEach(() => {
    delete process.env.HTTPS_PROXY;
    delete process.env.HTTP_PROXY;
    delete process.env.NO_PROXY;
    delete process.env.https_proxy;
    delete process.env.http_proxy;
    delete process.env.no_proxy;
  });

  it("materializes attachments, contacts, and award data for lineage persistence", () => {
    const materialized = materializeSamGovSourceRecord({
      active: "Yes",
      award: {
        amount: "1250000.50",
        awardee: {
          location: {
            city: {
              code: "51000",
              name: "Arlington",
            },
            country: {
              code: "USA",
              name: "United States",
            },
            state: {
              code: "VA",
              name: "Virginia",
            },
            streetAddress: "123 Main Street",
            streetAddress2: "Suite 500",
            zip: "22201",
          },
          name: "Example Awardee LLC",
          ueiSAM: "ABC123XYZ789",
        },
        date: "04/15/2026",
        number: "47QTCA-26-F-0001",
      },
      description:
        "Data engineering and analytics services for a modernization effort.",
      links: {
        self: {
          href: "https://api.sam.gov/prod/opportunities/v2/TEST-0001",
        },
      },
      noticeId: "TEST-0001",
      organizationName: "Example Contracting Office",
      pointOfContact: [
        {
          additionalInfo: {
            content: "Use the portal for amendment notices.",
          },
          email: "contracting@example.gov",
          fullName: "Jordan Avery",
          phone: "555-010-1111",
          title: "Contracting Officer",
          type: "primary",
        },
      ],
      postedDate: "04/12/2026",
      procurementTypeCode: "o",
      resourceLinks: [
        "https://sam.gov/opp/TEST-0001/documents/performance-work-statement.pdf",
      ],
      responseDeadLine: "05/04/2026",
      title: "Example Data Engineering Support",
      type: "Solicitation",
      uiLink: "https://sam.gov/opp/TEST-0001/view",
    });

    expect(materialized.attachments).toEqual([
      expect.objectContaining({
        displayLabel: "Performance Work Statement",
        linkType: "resource_link",
        sortOrder: 0,
        url: "https://sam.gov/opp/TEST-0001/documents/performance-work-statement.pdf",
      }),
    ]);
    expect(materialized.contacts).toEqual([
      expect.objectContaining({
        contactType: "primary",
        fullName: "Jordan Avery",
        sortOrder: 0,
      }),
    ]);
    expect(materialized.award).toEqual(
      expect.objectContaining({
        awardAmount: "1250000.50",
        awardDate: "2026-04-15T00:00:00.000Z",
        awardNumber: "47QTCA-26-F-0001",
        awardeeName: "Example Awardee LLC",
        awardeeUEI: "ABC123XYZ789",
      }),
    );
  });

  it("uses a proxy dispatcher for live requests when HTTPS_PROXY is configured", async () => {
    process.env.HTTPS_PROXY = "http://proxy.internal:3128";

    let receivedDispatcher: unknown;

    await executeSamGovSearch({
      apiKey: "live-key",
      config: {
        connectorVersion: "sam-gov.v1",
        credentialReference: "secret://sam-gov/public-api-key",
        searchEndpoint: "https://api.sam.gov/prod/opportunities/v2/search",
      },
      httpClient: async (_url, init) => {
        receivedDispatcher = init?.dispatcher;

        return new Response(
          JSON.stringify({
            opportunitiesData: [],
            totalRecords: 0,
          }),
          {
            status: 200,
          },
        );
      },
      query: liveQuery,
      useFixtures: false,
    });

    expect(receivedDispatcher).toBeInstanceOf(ProxyAgent);
  });

  it("converts transport failures into connector errors with a stable code", async () => {
    await expect(
      executeSamGovSearch({
        apiKey: "live-key",
        config: {
          connectorVersion: "sam-gov.v1",
          credentialReference: "secret://sam-gov/public-api-key",
          searchEndpoint: "https://api.sam.gov/prod/opportunities/v2/search",
        },
        httpClient: async () => {
          throw new TypeError("fetch failed");
        },
        query: liveQuery,
        useFixtures: false,
      }),
    ).rejects.toMatchObject<Partial<SamGovConnectorError>>({
      code: "sam_gov_transport_error",
      httpStatus: null,
      message:
        "The SAM.gov search request could not reach the upstream endpoint. Check proxy or network connectivity and retry the live search.",
    });
  });
});
