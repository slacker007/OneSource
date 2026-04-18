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
        q: "transition risk",
        type: "WIN_THEME",
        tag: "army",
        opportunity: "opp_army",
      }),
    ).toEqual({
      query: "transition risk",
      assetType: "WIN_THEME",
      tag: "army",
      opportunityId: "opp_army",
    });
  });

  it("builds a filtered library snapshot from organization-scoped records", async () => {
    const db = createMockKnowledgeRepositoryClient();

    db.organization.findUnique.mockResolvedValue({
      id: "org_123",
      name: "Default Organization",
      slug: "default-org",
      opportunities: [
        {
          id: "opp_army",
          title: "Army Cloud Operations Recompete",
          currentStageLabel: "Qualified",
        },
        {
          id: "opp_va",
          title: "VA Claims Intake Automation BPA",
          currentStageLabel: "Proposal in Development",
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
            },
            {
              label: "cloud operations",
              normalizedLabel: "cloud operations",
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
        type: "WIN_THEME",
        tag: "army",
      },
    });

    expect(snapshot).not.toBeNull();
    expect(snapshot?.totalCount).toBe(1);
    expect(snapshot?.totalTagCount).toBe(2);
    expect(snapshot?.results[0]).toMatchObject({
      id: "asset_army",
      title: "Army cloud transition win theme",
      tags: ["army", "cloud operations"],
    });
    expect(snapshot?.results[0]?.linkedOpportunities[0]?.title).toBe(
      "Army Cloud Operations Recompete",
    );
  });

  it("builds an edit-form snapshot with linked opportunity ids", async () => {
    const db = createMockKnowledgeRepositoryClient();

    db.organization.findUnique.mockResolvedValue({
      id: "org_123",
      name: "Default Organization",
      slug: "default-org",
      opportunities: [
        {
          id: "opp_army",
          title: "Army Cloud Operations Recompete",
          currentStageLabel: "Qualified",
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
      assetType: "WIN_THEME",
      title: "Army cloud transition win theme",
      tags: "army",
      opportunityIds: ["opp_army"],
    });
  });
});
