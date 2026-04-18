import { describe, expect, it } from "vitest";

import { materializeSamGovSourceRecord } from "./sam-gov.connector";

describe("sam-gov.connector", () => {
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
});
