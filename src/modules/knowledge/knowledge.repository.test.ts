import { describe, expect, it, vi } from "vitest";

import {
  getKnowledgeAssetFormSnapshot,
  getKnowledgeLibrarySnapshot,
  parseKnowledgeLibrarySearchParams,
  type KnowledgeRepositoryClient,
} from "./knowledge.repository";

function createMockKnowledgeRepositoryClient() {
  return {
    organization: {
      findUnique: vi.fn(),
    },
    knowledgeAsset: {
      findFirst: vi.fn(),
    },
  } as unknown as KnowledgeRepositoryClient & {
    organization: {
      findUnique: ReturnType<typeof vi.fn>;
    };
    knowledgeAsset: {
      findFirst: ReturnType<typeof vi.fn>;
    };
  };
}

describe("knowledge.repository", () => {
  it("parses URL search params into a stable query object", () => {
    expect(
      parseKnowledgeLibrarySearchParams({
        agency: "agency_army",
        capability: "cloud-platform-engineering",
        contractType: "Solicitation",
        q: "transition risk",
        type: "WIN_THEME",
        tag: "army",
        opportunity: "opp_army",
        vehicle: "OASIS-PLUS-UNR",
      }),
    ).toEqual({
      agencyId: "agency_army",
      assetType: "WIN_THEME",
      capabilityKey: "cloud-platform-engineering",
      contractType: "solicitation",
      opportunityId: "opp_army",
      query: "transition risk",
      tag: "army",
      vehicleCode: "OASIS-PLUS-UNR",
    });
  });

  it("builds a filtered library snapshot from organization-scoped records", async () => {
    const db = createMockKnowledgeRepositoryClient();

    db.organization.findUnique.mockResolvedValue({
      id: "org_123",
      name: "Default Organization",
      slug: "default-org",
      agencies: [
        {
          id: "agency_army",
          name: "Army PEO EIS",
          organizationCode: "W52P1J",
        },
        {
          id: "agency_va",
          name: "Technology Acquisition Center",
          organizationCode: "36C10B",
        },
      ],
      contractVehicles: [
        {
          code: "OASIS-PLUS-UNR",
          name: "OASIS+ Unrestricted",
          vehicleType: "IDIQ",
        },
      ],
      organizationProfile: {
        capabilities: [
          {
            capabilityKey: "cloud-platform-engineering",
            capabilityLabel: "Cloud platform engineering",
            description: "Cloud migration and sustainment support.",
          },
        ],
      },
      opportunities: [
        {
          id: "opp_army",
          title: "Army Cloud Operations Recompete",
          currentStageLabel: "Qualified",
          procurementBaseTypeLabel: "Solicitation",
          procurementTypeLabel: "Solicitation",
        },
        {
          id: "opp_va",
          title: "VA Claims Intake Automation BPA",
          currentStageLabel: "Proposal in Development",
          procurementBaseTypeLabel: "Solicitation",
          procurementTypeLabel: "Combined Synopsis/Solicitation",
        },
      ],
      knowledgeAssets: [
        {
          id: "asset_army",
          assetType: "WIN_THEME",
          title: "Army cloud transition win theme",
          summary: "Reusable transition-risk narrative.",
          body: "Focus on preserving continuity while modernizing cloud operations and observability.",
          updatedAt: new Date("2026-04-18T12:00:00.000Z"),
          createdByUser: {
            name: "Taylor Reed",
            email: "taylor.reed@onesource.local",
          },
          updatedByUser: {
            name: "Taylor Reed",
            email: "taylor.reed@onesource.local",
          },
          tags: [
            {
              label: "army",
              normalizedLabel: "army",
              tagKey: "army",
              tagType: "FREEFORM",
            },
            {
              label: "Army PEO EIS (W52P1J)",
              normalizedLabel: "army peo eis",
              tagKey: "agency_army",
              tagType: "AGENCY",
            },
            {
              label: "Cloud platform engineering",
              normalizedLabel: "cloud platform engineering",
              tagKey: "cloud-platform-engineering",
              tagType: "CAPABILITY",
            },
            {
              label: "Solicitation",
              normalizedLabel: "solicitation",
              tagKey: "solicitation",
              tagType: "CONTRACT_TYPE",
            },
            {
              label: "OASIS-PLUS-UNR · OASIS+ Unrestricted",
              normalizedLabel: "oasis-plus-unr",
              tagKey: "OASIS-PLUS-UNR",
              tagType: "VEHICLE",
            },
          ],
          linkedOpportunities: [
            {
              opportunity: {
                id: "opp_army",
                title: "Army Cloud Operations Recompete",
                currentStageLabel: "Qualified",
              },
            },
          ],
        },
        {
          id: "asset_va",
          assetType: "BOILERPLATE_CONTENT",
          title: "Claims intake modernization boilerplate",
          summary: "Reusable intake workflow language.",
          body: "Claims intake modernization narrative tailored to workflow automation and service delivery.",
          updatedAt: new Date("2026-04-18T11:30:00.000Z"),
          createdByUser: {
            name: "Morgan Patel",
            email: "morgan.patel@onesource.local",
          },
          updatedByUser: {
            name: "Morgan Patel",
            email: "morgan.patel@onesource.local",
          },
          tags: [
            {
              label: "claims intake",
              normalizedLabel: "claims intake",
              tagKey: "claims intake",
              tagType: "FREEFORM",
            },
            {
              label: "Technology Acquisition Center (36C10B)",
              normalizedLabel: "technology acquisition center",
              tagKey: "agency_va",
              tagType: "AGENCY",
            },
            {
              label: "Combined Synopsis/Solicitation",
              normalizedLabel: "combined synopsis/solicitation",
              tagKey: "combined synopsis/solicitation",
              tagType: "CONTRACT_TYPE",
            },
          ],
          linkedOpportunities: [
            {
              opportunity: {
                id: "opp_va",
                title: "VA Claims Intake Automation BPA",
                currentStageLabel: "Proposal in Development",
              },
            },
          ],
        },
      ],
    });

    const snapshot = await getKnowledgeLibrarySnapshot({
      db,
      organizationId: "org_123",
      searchParams: {
        agency: "agency_army",
        capability: "cloud-platform-engineering",
        contractType: "solicitation",
        vehicle: "OASIS-PLUS-UNR",
      },
    });

    expect(snapshot).not.toBeNull();
    expect(snapshot?.availableFilterCount).toBe(4);
    expect(snapshot?.totalCount).toBe(1);
    expect(snapshot?.filterOptions.contractTypes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Solicitation",
          value: "solicitation",
        }),
        expect.objectContaining({
          label: "Combined Synopsis/Solicitation",
          value: "combined synopsis/solicitation",
        }),
      ]),
    );
    expect(snapshot?.results[0]).toMatchObject({
      id: "asset_army",
      title: "Army cloud transition win theme",
      tags: ["army"],
      facets: {
        agencies: ["Army PEO EIS (W52P1J)"],
        capabilities: ["Cloud platform engineering"],
        contractTypes: ["Solicitation"],
        vehicles: ["OASIS-PLUS-UNR · OASIS+ Unrestricted"],
      },
    });
  });

  it("builds an edit-form snapshot with structured tag selections", async () => {
    const db = createMockKnowledgeRepositoryClient();

    db.organization.findUnique.mockResolvedValue({
      id: "org_123",
      name: "Default Organization",
      slug: "default-org",
      agencies: [
        {
          id: "agency_army",
          name: "Army PEO EIS",
          organizationCode: "W52P1J",
        },
      ],
      contractVehicles: [
        {
          code: "OASIS-PLUS-UNR",
          name: "OASIS+ Unrestricted",
          vehicleType: "IDIQ",
        },
      ],
      organizationProfile: {
        capabilities: [
          {
            capabilityKey: "cloud-platform-engineering",
            capabilityLabel: "Cloud platform engineering",
            description: "Cloud migration and sustainment support.",
          },
        ],
      },
      opportunities: [
        {
          id: "opp_army",
          title: "Army Cloud Operations Recompete",
          currentStageLabel: "Qualified",
          procurementBaseTypeLabel: "Solicitation",
          procurementTypeLabel: "Solicitation",
        },
      ],
    });
    db.knowledgeAsset.findFirst.mockResolvedValue({
      id: "asset_army",
      assetType: "WIN_THEME",
      title: "Army cloud transition win theme",
      summary: "Reusable transition-risk narrative.",
      body: "Full reusable narrative body.",
      updatedAt: new Date("2026-04-18T12:00:00.000Z"),
      tags: [
        {
          label: "army",
          normalizedLabel: "army",
          tagKey: "army",
          tagType: "FREEFORM",
        },
        {
          label: "Army PEO EIS (W52P1J)",
          normalizedLabel: "army peo eis",
          tagKey: "agency_army",
          tagType: "AGENCY",
        },
        {
          label: "Cloud platform engineering",
          normalizedLabel: "cloud platform engineering",
          tagKey: "cloud-platform-engineering",
          tagType: "CAPABILITY",
        },
        {
          label: "Solicitation",
          normalizedLabel: "solicitation",
          tagKey: "solicitation",
          tagType: "CONTRACT_TYPE",
        },
        {
          label: "OASIS-PLUS-UNR · OASIS+ Unrestricted",
          normalizedLabel: "oasis-plus-unr",
          tagKey: "OASIS-PLUS-UNR",
          tagType: "VEHICLE",
        },
      ],
      linkedOpportunities: [
        {
          opportunityId: "opp_army",
        },
      ],
    });

    const snapshot = await getKnowledgeAssetFormSnapshot({
      assetId: "asset_army",
      db,
      organizationId: "org_123",
    });

    expect(snapshot).not.toBeNull();
    expect(snapshot?.mode).toBe("edit");
    expect(snapshot?.initialValues).toMatchObject({
      agencyIds: ["agency_army"],
      assetType: "WIN_THEME",
      capabilityKeys: ["cloud-platform-engineering"],
      contractTypes: ["Solicitation"],
      tags: "army",
      opportunityIds: ["opp_army"],
      vehicleCodes: ["OASIS-PLUS-UNR"],
    });
  });
});
