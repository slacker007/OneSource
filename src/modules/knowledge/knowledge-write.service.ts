import {
  AuditActorType,
  type KnowledgeAssetType,
  type Prisma,
} from "@prisma/client";

import {
  AUDIT_ACTIONS,
  recordAuditEvent,
  type AuditActorContext,
  type AuditLogWriter,
} from "@/modules/audit/audit.service";
import { normalizeKnowledgeTag } from "@/modules/knowledge/knowledge.repository";

type KnowledgeAssetAuditRecord = {
  id: string;
  organizationId: string;
  assetType: KnowledgeAssetType;
  title: string;
  summary: string | null;
  body: string;
  contentFormat: string;
  isArchived: boolean;
  tags: Array<{
    label: string;
    normalizedLabel: string;
    tagKey: string;
    tagType: KnowledgeTagType;
  }>;
  linkedOpportunities: Array<{
    opportunity: {
      id: string;
      title: string;
    };
  }>;
};

const KNOWLEDGE_TAG_TYPES = {
  AGENCY: "AGENCY",
  CAPABILITY: "CAPABILITY",
  CONTRACT_TYPE: "CONTRACT_TYPE",
  FREEFORM: "FREEFORM",
  VEHICLE: "VEHICLE",
} as const;

type KnowledgeTagType =
  (typeof KNOWLEDGE_TAG_TYPES)[keyof typeof KNOWLEDGE_TAG_TYPES];

const knowledgeAssetAuditSelect = {
  id: true,
  organizationId: true,
  assetType: true,
  title: true,
  summary: true,
  body: true,
  contentFormat: true,
  isArchived: true,
  tags: {
    orderBy: {
      normalizedLabel: "asc",
    },
    select: {
      label: true,
      normalizedLabel: true,
      tagKey: true,
      tagType: true,
    },
  },
  linkedOpportunities: {
    orderBy: {
      opportunity: {
        title: "asc",
      },
    },
    select: {
      opportunity: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  },
} as const;

type LinkedOpportunityRecord = {
  id: string;
  title: string;
};

type AgencyFacetRecord = {
  id: string;
  name: string;
  organizationCode: string | null;
};

type CapabilityFacetRecord = {
  capabilityKey: string;
  capabilityLabel: string;
};

type VehicleFacetRecord = {
  code: string;
  name: string;
};

export type KnowledgeAssetActor = AuditActorContext & {
  organizationId: string;
};

export type KnowledgeAssetWriteTransactionClient = AuditLogWriter & {
  knowledgeAsset: {
    create(args: {
      data: Prisma.KnowledgeAssetUncheckedCreateInput;
      select: typeof knowledgeAssetAuditSelect;
    }): Promise<KnowledgeAssetAuditRecord>;
    findFirstOrThrow(args: {
      where: {
        id: string;
        organizationId: string;
        isArchived: boolean;
      };
      select: typeof knowledgeAssetAuditSelect;
    }): Promise<KnowledgeAssetAuditRecord>;
    update(args: {
      where: {
        id: string;
      };
      data: Prisma.KnowledgeAssetUncheckedUpdateInput;
      select: typeof knowledgeAssetAuditSelect;
    }): Promise<KnowledgeAssetAuditRecord>;
    delete(args: {
      where: {
        id: string;
      };
    }): Promise<unknown>;
  };
  opportunity: {
    findMany(args: {
      where: {
        organizationId: string;
        id: {
          in: string[];
        };
      };
      select: {
        id: true;
        title: true;
      };
    }): Promise<LinkedOpportunityRecord[]>;
  };
  agency: {
    findMany(args: {
      where: {
        organizationId: string;
        id: {
          in: string[];
        };
      };
      select: {
        id: true;
        name: true;
        organizationCode: true;
      };
    }): Promise<AgencyFacetRecord[]>;
  };
  organizationCapability: {
    findMany(args: {
      where: {
        organizationId: string;
        capabilityKey: {
          in: string[];
        };
        isActive: boolean;
      };
      select: {
        capabilityKey: true;
        capabilityLabel: true;
      };
    }): Promise<CapabilityFacetRecord[]>;
  };
  contractVehicle: {
    findMany(args: {
      where: {
        organizationId: string;
        code: {
          in: string[];
        };
      };
      select: {
        code: true;
        name: true;
      };
    }): Promise<VehicleFacetRecord[]>;
  };
};

export type KnowledgeAssetWriteClient = KnowledgeAssetWriteTransactionClient & {
  $transaction<T>(
    callback: (tx: KnowledgeAssetWriteTransactionClient) => Promise<T>,
  ): Promise<T>;
};

export async function createKnowledgeAsset({
  db,
  input,
}: {
  db: KnowledgeAssetWriteClient;
  input: {
    actor: KnowledgeAssetActor;
    assetType: KnowledgeAssetType;
    agencyIds: string[];
    title: string;
    summary?: string | null;
    body: string;
    capabilityKeys: string[];
    contractTypes: string[];
    tags: string[];
    opportunityIds: string[];
    vehicleCodes: string[];
    occurredAt?: Date;
  };
}) {
  return db.$transaction(async (tx) => {
    const tags = await buildKnowledgeTags({
      agencyIds: input.agencyIds,
      capabilityKeys: input.capabilityKeys,
      contractTypes: input.contractTypes,
      freeformTags: input.tags,
      organizationId: input.actor.organizationId,
      tx,
      vehicleCodes: input.vehicleCodes,
    });
    const linkedOpportunities = await loadLinkedOpportunities({
      opportunityIds: input.opportunityIds,
      organizationId: input.actor.organizationId,
      tx,
    });

    const knowledgeAsset = await tx.knowledgeAsset.create({
      data: {
        organizationId: input.actor.organizationId,
        createdByUserId: input.actor.userId ?? null,
        updatedByUserId: input.actor.userId ?? null,
        assetType: input.assetType,
        title: input.title.trim(),
        summary: cleanOptionalString(input.summary),
        body: input.body.trim(),
        contentFormat: "markdown",
        tags: buildTagsRelationData({
          organizationId: input.actor.organizationId,
          tags,
        }),
        linkedOpportunities: buildLinkedOpportunitiesRelationData({
          linkedOpportunities,
          organizationId: input.actor.organizationId,
        }),
      },
      select: knowledgeAssetAuditSelect,
    });
    const tagSummary = buildKnowledgeTagSummary(knowledgeAsset.tags);

    await recordAuditEvent({
      db: tx,
      event: {
        organizationId: knowledgeAsset.organizationId,
        actor: input.actor,
        action: AUDIT_ACTIONS.knowledgeAssetCreate,
        target: {
          type: "knowledge_asset",
          id: knowledgeAsset.id,
          display: knowledgeAsset.title,
        },
        summary: `Created knowledge asset ${knowledgeAsset.title}.`,
        metadata: {
          assetType: knowledgeAsset.assetType,
          agencies: tagSummary.agencies,
          capabilities: tagSummary.capabilities,
          contractTypes: tagSummary.contractTypes,
          freeformTags: tagSummary.freeformTags,
          linkedOpportunityIds: knowledgeAsset.linkedOpportunities.map(
            (link) => link.opportunity.id,
          ),
          vehicles: tagSummary.vehicles,
        },
        occurredAt: input.occurredAt,
      },
    });

    return knowledgeAsset;
  });
}

export async function updateKnowledgeAsset({
  db,
  input,
}: {
  db: KnowledgeAssetWriteClient;
  input: {
    actor: KnowledgeAssetActor;
    knowledgeAssetId: string;
    assetType: KnowledgeAssetType;
    agencyIds: string[];
    title: string;
    summary?: string | null;
    body: string;
    capabilityKeys: string[];
    contractTypes: string[];
    tags: string[];
    opportunityIds: string[];
    vehicleCodes: string[];
    occurredAt?: Date;
  };
}) {
  return db.$transaction(async (tx) => {
    const existingAsset = await tx.knowledgeAsset.findFirstOrThrow({
      where: {
        id: input.knowledgeAssetId,
        organizationId: input.actor.organizationId,
        isArchived: false,
      },
      select: knowledgeAssetAuditSelect,
    });
    const tags = await buildKnowledgeTags({
      agencyIds: input.agencyIds,
      capabilityKeys: input.capabilityKeys,
      contractTypes: input.contractTypes,
      freeformTags: input.tags,
      organizationId: input.actor.organizationId,
      tx,
      vehicleCodes: input.vehicleCodes,
    });
    const linkedOpportunities = await loadLinkedOpportunities({
      opportunityIds: input.opportunityIds,
      organizationId: input.actor.organizationId,
      tx,
    });

    const knowledgeAsset = await tx.knowledgeAsset.update({
      where: {
        id: existingAsset.id,
      },
      data: {
        assetType: input.assetType,
        title: input.title.trim(),
        summary: cleanOptionalString(input.summary),
        body: input.body.trim(),
        updatedByUserId: input.actor.userId ?? null,
        tags: buildTagsReplaceData({
          organizationId: input.actor.organizationId,
          tags,
        }),
        linkedOpportunities: buildLinkedOpportunitiesReplaceData({
          linkedOpportunities,
          organizationId: input.actor.organizationId,
        }),
      },
      select: knowledgeAssetAuditSelect,
    });

    await recordAuditEvent({
      db: tx,
      event: {
        organizationId: knowledgeAsset.organizationId,
        actor: input.actor,
        action: AUDIT_ACTIONS.knowledgeAssetUpdate,
        target: {
          type: "knowledge_asset",
          id: knowledgeAsset.id,
          display: knowledgeAsset.title,
        },
        summary: `Updated knowledge asset ${knowledgeAsset.title}.`,
        metadata: {
          changedFields: buildKnowledgeAssetChangedFields(
            existingAsset,
            knowledgeAsset,
          ),
        } as Prisma.InputJsonValue,
        occurredAt: input.occurredAt,
      },
    });

    return knowledgeAsset;
  });
}

export async function deleteKnowledgeAsset({
  db,
  input,
}: {
  db: KnowledgeAssetWriteClient;
  input: {
    actor: KnowledgeAssetActor;
    knowledgeAssetId: string;
    occurredAt?: Date;
  };
}) {
  return db.$transaction(async (tx) => {
    const existingAsset = await tx.knowledgeAsset.findFirstOrThrow({
      where: {
        id: input.knowledgeAssetId,
        organizationId: input.actor.organizationId,
        isArchived: false,
      },
      select: knowledgeAssetAuditSelect,
    });

    await tx.knowledgeAsset.delete({
      where: {
        id: existingAsset.id,
      },
    });

    const tagSummary = buildKnowledgeTagSummary(existingAsset.tags);

    await recordAuditEvent({
      db: tx,
      event: {
        organizationId: existingAsset.organizationId,
        actor: input.actor,
        action: AUDIT_ACTIONS.knowledgeAssetDelete,
        target: {
          type: "knowledge_asset",
          id: existingAsset.id,
          display: existingAsset.title,
        },
        summary: `Deleted knowledge asset ${existingAsset.title}.`,
        metadata: {
          assetType: existingAsset.assetType,
          agencies: tagSummary.agencies,
          capabilities: tagSummary.capabilities,
          contractTypes: tagSummary.contractTypes,
          freeformTags: tagSummary.freeformTags,
          linkedOpportunityIds: existingAsset.linkedOpportunities.map(
            (link) => link.opportunity.id,
          ),
          vehicles: tagSummary.vehicles,
        },
        occurredAt: input.occurredAt,
      },
    });

    return existingAsset;
  });
}

async function loadLinkedOpportunities({
  opportunityIds,
  organizationId,
  tx,
}: {
  opportunityIds: string[];
  organizationId: string;
  tx: KnowledgeAssetWriteTransactionClient;
}) {
  const uniqueOpportunityIds = [...new Set(opportunityIds)];

  if (uniqueOpportunityIds.length === 0) {
    return [];
  }

  const opportunities = await tx.opportunity.findMany({
    where: {
      organizationId,
      id: {
        in: uniqueOpportunityIds,
      },
    },
    select: {
      id: true,
      title: true,
    },
  });

  if (opportunities.length !== uniqueOpportunityIds.length) {
    throw new Error(
      "One or more linked opportunities are unavailable in this workspace.",
    );
  }

  return opportunities.sort((left, right) =>
    left.title.localeCompare(right.title),
  );
}

async function loadAgencyTags({
  agencyIds,
  organizationId,
  tx,
}: {
  agencyIds: string[];
  organizationId: string;
  tx: KnowledgeAssetWriteTransactionClient;
}) {
  const uniqueAgencyIds = [...new Set(agencyIds)];

  if (uniqueAgencyIds.length === 0) {
    return [];
  }

  const agencies = await tx.agency.findMany({
    where: {
      organizationId,
      id: {
        in: uniqueAgencyIds,
      },
    },
    select: {
      id: true,
      name: true,
      organizationCode: true,
    },
  });

  if (agencies.length !== uniqueAgencyIds.length) {
    throw new Error("One or more knowledge-tagged agencies are unavailable.");
  }

  return agencies
    .map((agency) => ({
      label:
        agency.organizationCode != null
          ? `${agency.name} (${agency.organizationCode})`
          : agency.name,
      normalizedLabel: normalizeKnowledgeTag(agency.name),
      tagKey: agency.id,
      tagType: KNOWLEDGE_TAG_TYPES.AGENCY,
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

async function loadCapabilityTags({
  capabilityKeys,
  organizationId,
  tx,
}: {
  capabilityKeys: string[];
  organizationId: string;
  tx: KnowledgeAssetWriteTransactionClient;
}) {
  const uniqueCapabilityKeys = [...new Set(capabilityKeys)];

  if (uniqueCapabilityKeys.length === 0) {
    return [];
  }

  const capabilities = await tx.organizationCapability.findMany({
    where: {
      organizationId,
      capabilityKey: {
        in: uniqueCapabilityKeys,
      },
      isActive: true,
    },
    select: {
      capabilityKey: true,
      capabilityLabel: true,
    },
  });

  if (capabilities.length !== uniqueCapabilityKeys.length) {
    throw new Error(
      "One or more knowledge-tagged capabilities are unavailable.",
    );
  }

  return capabilities
    .map((capability) => ({
      label: capability.capabilityLabel,
      normalizedLabel: normalizeKnowledgeTag(capability.capabilityLabel),
      tagKey: capability.capabilityKey,
      tagType: KNOWLEDGE_TAG_TYPES.CAPABILITY,
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

async function loadVehicleTags({
  organizationId,
  tx,
  vehicleCodes,
}: {
  organizationId: string;
  tx: KnowledgeAssetWriteTransactionClient;
  vehicleCodes: string[];
}) {
  const uniqueVehicleCodes = [...new Set(vehicleCodes)];

  if (uniqueVehicleCodes.length === 0) {
    return [];
  }

  const vehicles = await tx.contractVehicle.findMany({
    where: {
      organizationId,
      code: {
        in: uniqueVehicleCodes,
      },
    },
    select: {
      code: true,
      name: true,
    },
  });

  if (vehicles.length !== uniqueVehicleCodes.length) {
    throw new Error("One or more knowledge-tagged vehicles are unavailable.");
  }

  return vehicles
    .map((vehicle) => ({
      label: `${vehicle.code} · ${vehicle.name}`,
      normalizedLabel: normalizeKnowledgeTag(vehicle.code),
      tagKey: vehicle.code,
      tagType: KNOWLEDGE_TAG_TYPES.VEHICLE,
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

async function buildKnowledgeTags({
  agencyIds,
  capabilityKeys,
  contractTypes,
  freeformTags,
  organizationId,
  tx,
  vehicleCodes,
}: {
  agencyIds: string[];
  capabilityKeys: string[];
  contractTypes: string[];
  freeformTags: string[];
  organizationId: string;
  tx: KnowledgeAssetWriteTransactionClient;
  vehicleCodes: string[];
}) {
  const [agencyTags, capabilityTags, vehicleTags] = await Promise.all([
    loadAgencyTags({
      agencyIds,
      organizationId,
      tx,
    }),
    loadCapabilityTags({
      capabilityKeys,
      organizationId,
      tx,
    }),
    loadVehicleTags({
      organizationId,
      tx,
      vehicleCodes,
    }),
  ]);

  const freeformKnowledgeTags = [
    ...new Map(
      freeformTags.map((tag) => {
        const trimmed = tag.trim();
        const normalizedTag = normalizeKnowledgeTag(trimmed);

        return [
          `${KNOWLEDGE_TAG_TYPES.FREEFORM}:${normalizedTag}`,
          {
            label: trimmed,
            normalizedLabel: normalizedTag,
            tagKey: normalizedTag,
            tagType: KNOWLEDGE_TAG_TYPES.FREEFORM,
          },
        ];
      }),
    ).values(),
  ].filter((tag) => tag.label.length > 0);

  const contractTypeTags = [
    ...new Map(
      contractTypes.map((contractType) => {
        const trimmed = contractType.trim();
        const normalizedTag = normalizeKnowledgeTag(trimmed);

        return [
          `${KNOWLEDGE_TAG_TYPES.CONTRACT_TYPE}:${normalizedTag}`,
          {
            label: trimmed,
            normalizedLabel: normalizedTag,
            tagKey: normalizedTag,
            tagType: KNOWLEDGE_TAG_TYPES.CONTRACT_TYPE,
          },
        ];
      }),
    ).values(),
  ].filter((tag) => tag.label.length > 0);

  return [
    ...freeformKnowledgeTags,
    ...agencyTags,
    ...capabilityTags,
    ...contractTypeTags,
    ...vehicleTags,
  ];
}

function buildTagsRelationData({
  organizationId,
  tags,
}: {
  organizationId: string;
  tags: Array<{
    label: string;
    normalizedLabel: string;
    tagKey: string;
    tagType: KnowledgeTagType;
  }>;
}) {
  if (tags.length === 0) {
    return undefined;
  }

  return {
    create: tags.map((tag) => ({
      organizationId,
      label: tag.label,
      normalizedLabel: tag.normalizedLabel,
      tagKey: tag.tagKey,
      tagType: tag.tagType,
    })),
  };
}

function buildLinkedOpportunitiesRelationData({
  linkedOpportunities,
  organizationId,
}: {
  linkedOpportunities: LinkedOpportunityRecord[];
  organizationId: string;
}) {
  if (linkedOpportunities.length === 0) {
    return undefined;
  }

  return {
    create: linkedOpportunities.map((opportunity) => ({
      organizationId,
      opportunityId: opportunity.id,
    })),
  };
}

function buildTagsReplaceData({
  organizationId,
  tags,
}: {
  organizationId: string;
  tags: Array<{
    label: string;
    normalizedLabel: string;
    tagKey: string;
    tagType: KnowledgeTagType;
  }>;
}) {
  return {
    deleteMany: {},
    ...(buildTagsRelationData({
      organizationId,
      tags,
    })
      ? {
          create: tags.map((tag) => ({
            organizationId,
            label: tag.label,
            normalizedLabel: tag.normalizedLabel,
            tagKey: tag.tagKey,
            tagType: tag.tagType,
          })),
        }
      : {}),
  };
}

function buildLinkedOpportunitiesReplaceData({
  linkedOpportunities,
  organizationId,
}: {
  linkedOpportunities: LinkedOpportunityRecord[];
  organizationId: string;
}) {
  return {
    deleteMany: {},
    ...(linkedOpportunities.length > 0
      ? {
          create: linkedOpportunities.map((opportunity) => ({
            organizationId,
            opportunityId: opportunity.id,
          })),
        }
      : {}),
  };
}

function buildKnowledgeAssetChangedFields(
  before: KnowledgeAssetAuditRecord,
  after: KnowledgeAssetAuditRecord,
) {
  const changedFields: Record<string, unknown> = {};
  const beforeTagSummary = buildKnowledgeTagSummary(before.tags);
  const afterTagSummary = buildKnowledgeTagSummary(after.tags);

  for (const [field, values] of Object.entries({
    assetType: {
      from: before.assetType,
      to: after.assetType,
    },
    title: {
      from: before.title,
      to: after.title,
    },
    summary: {
      from: before.summary,
      to: after.summary,
    },
    body: {
      from: before.body,
      to: after.body,
    },
    freeformTags: {
      from: beforeTagSummary.freeformTags,
      to: afterTagSummary.freeformTags,
    },
    agencies: {
      from: beforeTagSummary.agencies,
      to: afterTagSummary.agencies,
    },
    capabilities: {
      from: beforeTagSummary.capabilities,
      to: afterTagSummary.capabilities,
    },
    contractTypes: {
      from: beforeTagSummary.contractTypes,
      to: afterTagSummary.contractTypes,
    },
    vehicles: {
      from: beforeTagSummary.vehicles,
      to: afterTagSummary.vehicles,
    },
    linkedOpportunityIds: {
      from: before.linkedOpportunities.map((link) => link.opportunity.id),
      to: after.linkedOpportunities.map((link) => link.opportunity.id),
    },
  })) {
    if (JSON.stringify(values.from) !== JSON.stringify(values.to)) {
      changedFields[field] = values;
    }
  }

  return changedFields;
}

function buildKnowledgeTagSummary(tags: KnowledgeAssetAuditRecord["tags"]) {
  return {
    agencies: tags
      .filter((tag) => tag.tagType === KNOWLEDGE_TAG_TYPES.AGENCY)
      .map((tag) => tag.label),
    capabilities: tags
      .filter((tag) => tag.tagType === KNOWLEDGE_TAG_TYPES.CAPABILITY)
      .map((tag) => tag.label),
    contractTypes: tags
      .filter((tag) => tag.tagType === KNOWLEDGE_TAG_TYPES.CONTRACT_TYPE)
      .map((tag) => tag.label),
    freeformTags: tags
      .filter((tag) => tag.tagType === KNOWLEDGE_TAG_TYPES.FREEFORM)
      .map((tag) => tag.label),
    vehicles: tags
      .filter((tag) => tag.tagType === KNOWLEDGE_TAG_TYPES.VEHICLE)
      .map((tag) => tag.label),
  };
}

function cleanOptionalString(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

export function buildKnowledgeActor(user: {
  email?: string | null;
  id: string;
  organizationId: string;
}) {
  return {
    type: AuditActorType.USER,
    userId: user.id,
    identifier: user.email ?? null,
    organizationId: user.organizationId,
  } satisfies KnowledgeAssetActor;
}
