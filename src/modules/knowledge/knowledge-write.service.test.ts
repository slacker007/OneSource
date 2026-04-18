import { AuditActorType } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { AUDIT_ACTIONS } from "@/modules/audit/audit.service";

import {
  buildKnowledgeActor,
  createKnowledgeAsset,
  deleteKnowledgeAsset,
  updateKnowledgeAsset,
  type KnowledgeAssetWriteClient,
  type KnowledgeAssetWriteTransactionClient,
} from "./knowledge-write.service";

function createMockKnowledgeWriteClient() {
  const tx = {
    auditLog: {
      create: vi.fn(),
    },
    knowledgeAsset: {
      create: vi.fn(),
      findFirstOrThrow: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    opportunity: {
      findMany: vi.fn(),
    },
    agency: {
      findMany: vi.fn(),
    },
    organizationCapability: {
      findMany: vi.fn(),
    },
    contractVehicle: {
      findMany: vi.fn(),
    },
  } as unknown as KnowledgeAssetWriteTransactionClient;

  const db = {
    ...tx,
    $transaction: vi.fn(async (callback) => callback(tx)),
  } as unknown as KnowledgeAssetWriteClient;

  return {
    db,
    tx,
  };
}

const actor = buildKnowledgeActor({
  email: "alex.morgan@onesource.local",
  id: "user_123",
  organizationId: "org_123",
});

describe("knowledge-write.service", () => {
  it("creates a knowledge asset and emits an audit row", async () => {
    const { db, tx } = createMockKnowledgeWriteClient();

    vi.mocked(tx.opportunity.findMany).mockResolvedValue([
      {
        id: "opp_123",
        title: "Army Cloud Operations Recompete",
      },
    ]);
    vi.mocked(tx.agency.findMany).mockResolvedValue([
      {
        id: "agency_army",
        name: "Army PEO EIS",
        organizationCode: "W52P1J",
      },
    ]);
    vi.mocked(tx.organizationCapability.findMany).mockResolvedValue([
      {
        capabilityKey: "cloud-platform-engineering",
        capabilityLabel: "Cloud platform engineering",
      },
    ]);
    vi.mocked(tx.contractVehicle.findMany).mockResolvedValue([
      {
        code: "OASIS-PLUS-UNR",
        name: "OASIS+ Unrestricted",
      },
    ]);
    vi.mocked(tx.knowledgeAsset.create).mockResolvedValue({
      id: "asset_123",
      organizationId: "org_123",
      assetType: "WIN_THEME",
      title: "Army cloud transition win theme",
      summary: "Reusable transition-risk narrative.",
      body: "Full reusable narrative body for cloud transition work.",
      contentFormat: "markdown",
      isArchived: false,
      tags: [
        {
          tagKey: "army",
          tagType: "FREEFORM",
          label: "army",
          normalizedLabel: "army",
        },
        {
          tagKey: "agency_army",
          tagType: "AGENCY",
          label: "Army PEO EIS (W52P1J)",
          normalizedLabel: "army peo eis",
        },
      ],
      linkedOpportunities: [
        {
          opportunity: {
            id: "opp_123",
            title: "Army Cloud Operations Recompete",
          },
        },
      ],
    });

    await createKnowledgeAsset({
      db,
      input: {
        actor,
        assetType: "WIN_THEME",
        agencyIds: ["agency_army"],
        title: " Army cloud transition win theme ",
        summary: "Reusable transition-risk narrative.",
        body: "Full reusable narrative body for cloud transition work.",
        capabilityKeys: ["cloud-platform-engineering"],
        contractTypes: ["Solicitation"],
        tags: ["army"],
        opportunityIds: ["opp_123"],
        vehicleCodes: ["OASIS-PLUS-UNR"],
      },
    });

    expect(tx.knowledgeAsset.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "Army cloud transition win theme",
          tags: expect.objectContaining({
            create: expect.arrayContaining([
              expect.objectContaining({
                label: "army",
                normalizedLabel: "army",
                tagKey: "army",
                tagType: "FREEFORM",
              }),
              expect.objectContaining({
                label: "Army PEO EIS (W52P1J)",
                tagKey: "agency_army",
                tagType: "AGENCY",
              }),
              expect.objectContaining({
                label: "Cloud platform engineering",
                tagKey: "cloud-platform-engineering",
                tagType: "CAPABILITY",
              }),
              expect.objectContaining({
                label: "Solicitation",
                tagKey: "solicitation",
                tagType: "CONTRACT_TYPE",
              }),
              expect.objectContaining({
                label: "OASIS-PLUS-UNR · OASIS+ Unrestricted",
                tagKey: "OASIS-PLUS-UNR",
                tagType: "VEHICLE",
              }),
            ]),
          }),
          linkedOpportunities: expect.objectContaining({
            create: [
              expect.objectContaining({
                opportunityId: "opp_123",
              }),
            ],
          }),
        }),
      }),
    );
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: "org_123",
        action: AUDIT_ACTIONS.knowledgeAssetCreate,
        targetType: "knowledge_asset",
        targetId: "asset_123",
      }),
    });
  });

  it("updates a knowledge asset and records changed fields", async () => {
    const { db, tx } = createMockKnowledgeWriteClient();

    vi.mocked(tx.opportunity.findMany).mockResolvedValue([
      {
        id: "opp_999",
        title: "DHS Zero Trust Assessment Support",
      },
    ]);
    vi.mocked(tx.agency.findMany).mockResolvedValue([
      {
        id: "agency_dhs",
        name: "DHS CISA OCPO",
        organizationCode: "70RCSA",
      },
    ]);
    vi.mocked(tx.organizationCapability.findMany).mockResolvedValue([
      {
        capabilityKey: "zero-trust-cyber-operations",
        capabilityLabel: "Zero-trust cyber operations",
      },
    ]);
    vi.mocked(tx.contractVehicle.findMany).mockResolvedValue([
      {
        code: "STARS-III",
        name: "8(a) STARS III",
      },
    ]);
    vi.mocked(tx.knowledgeAsset.findFirstOrThrow).mockResolvedValue({
      id: "asset_123",
      organizationId: "org_123",
      assetType: "WIN_THEME",
      title: "Army cloud transition win theme",
      summary: "Reusable transition-risk narrative.",
      body: "Legacy body copy.",
      contentFormat: "markdown",
      isArchived: false,
      tags: [
        {
          tagKey: "army",
          tagType: "FREEFORM",
          label: "army",
          normalizedLabel: "army",
        },
        {
          tagKey: "agency_army",
          tagType: "AGENCY",
          label: "Army PEO EIS (W52P1J)",
          normalizedLabel: "army peo eis",
        },
      ],
      linkedOpportunities: [
        {
          opportunity: {
            id: "opp_123",
            title: "Army Cloud Operations Recompete",
          },
        },
      ],
    });
    vi.mocked(tx.knowledgeAsset.update).mockResolvedValue({
      id: "asset_123",
      organizationId: "org_123",
      assetType: "BOILERPLATE_CONTENT",
      title: "Zero trust transition boilerplate",
      summary: "Updated reusable narrative.",
      body: "Updated body copy with stronger transition framing.",
      contentFormat: "markdown",
      isArchived: false,
      tags: [
        {
          tagKey: "zero trust",
          tagType: "FREEFORM",
          label: "zero trust",
          normalizedLabel: "zero trust",
        },
        {
          tagKey: "agency_dhs",
          tagType: "AGENCY",
          label: "DHS CISA OCPO (70RCSA)",
          normalizedLabel: "dhs cisa ocpo",
        },
      ],
      linkedOpportunities: [
        {
          opportunity: {
            id: "opp_999",
            title: "DHS Zero Trust Assessment Support",
          },
        },
      ],
    });

    await updateKnowledgeAsset({
      db,
      input: {
        actor,
        knowledgeAssetId: "asset_123",
        assetType: "BOILERPLATE_CONTENT",
        agencyIds: ["agency_dhs"],
        title: "Zero trust transition boilerplate",
        summary: "Updated reusable narrative.",
        body: "Updated body copy with stronger transition framing.",
        capabilityKeys: ["zero-trust-cyber-operations"],
        contractTypes: ["Solicitation"],
        tags: ["zero trust"],
        opportunityIds: ["opp_999"],
        vehicleCodes: ["STARS-III"],
      },
    });

    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: AUDIT_ACTIONS.knowledgeAssetUpdate,
        targetId: "asset_123",
        metadata: expect.objectContaining({
          changedFields: expect.objectContaining({
            assetType: {
              from: "WIN_THEME",
              to: "BOILERPLATE_CONTENT",
            },
            agencies: {
              from: ["Army PEO EIS (W52P1J)"],
              to: ["DHS CISA OCPO (70RCSA)"],
            },
            linkedOpportunityIds: {
              from: ["opp_123"],
              to: ["opp_999"],
            },
          }),
        }),
      }),
    });
  });

  it("deletes a knowledge asset and records the deletion", async () => {
    const { db, tx } = createMockKnowledgeWriteClient();

    vi.mocked(tx.knowledgeAsset.findFirstOrThrow).mockResolvedValue({
      id: "asset_123",
      organizationId: "org_123",
      assetType: "PAST_PERFORMANCE_SNIPPET",
      title: "Air Force operational planning past performance",
      summary: "Reusable past performance proof point.",
      body: "Full past performance snippet body.",
      contentFormat: "markdown",
      isArchived: false,
      tags: [
        {
          tagKey: "air force",
          tagType: "FREEFORM",
          label: "air force",
          normalizedLabel: "air force",
        },
        {
          tagKey: "agency_air_force",
          tagType: "AGENCY",
          label: "99th Contracting Squadron (FA4861)",
          normalizedLabel: "99th contracting squadron",
        },
      ],
      linkedOpportunities: [
        {
          opportunity: {
            id: "opp_123",
            title: "Enterprise Knowledge Management Support Services",
          },
        },
      ],
    });

    await deleteKnowledgeAsset({
      db,
      input: {
        actor,
        knowledgeAssetId: "asset_123",
      },
    });

    expect(tx.knowledgeAsset.delete).toHaveBeenCalledWith({
      where: {
        id: "asset_123",
      },
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: AUDIT_ACTIONS.knowledgeAssetDelete,
        targetId: "asset_123",
      }),
    });
  });

  it("builds a consistent knowledge actor from the authenticated session user", () => {
    expect(actor).toEqual({
      type: AuditActorType.USER,
      userId: "user_123",
      identifier: "alex.morgan@onesource.local",
      organizationId: "org_123",
    });
  });
});
