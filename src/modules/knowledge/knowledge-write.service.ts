import { AuditActorType, type KnowledgeAssetType, type Prisma } from "@prisma/client";

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
  }>;
  linkedOpportunities: Array<{
    opportunity: {
      id: string;
      title: string;
    };
  }>;
};

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
    title: string;
    summary?: string | null;
    body: string;
    tags: string[];
    opportunityIds: string[];
    occurredAt?: Date;
  };
}) {
  return db.$transaction(async (tx) => {
    const tags = buildKnowledgeTags(input.tags);
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
          linkedOpportunityIds: knowledgeAsset.linkedOpportunities.map(
            (link) => link.opportunity.id,
          ),
          tags: knowledgeAsset.tags.map((tag) => tag.label),
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
    title: string;
    summary?: string | null;
    body: string;
    tags: string[];
    opportunityIds: string[];
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
    const tags = buildKnowledgeTags(input.tags);
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
          linkedOpportunityIds: existingAsset.linkedOpportunities.map(
            (link) => link.opportunity.id,
          ),
          tags: existingAsset.tags.map((tag) => tag.label),
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

  return opportunities.sort((left, right) => left.title.localeCompare(right.title));
}

function buildKnowledgeTags(tags: string[]) {
  return [...new Map(
    tags.map((tag) => {
      const trimmed = tag.trim();
      return [normalizeKnowledgeTag(trimmed), { label: trimmed, normalizedLabel: normalizeKnowledgeTag(trimmed) }];
    })
  ).values()].filter((tag) => tag.label.length > 0);
}

function buildTagsRelationData({
  organizationId,
  tags,
}: {
  organizationId: string;
  tags: Array<{
    label: string;
    normalizedLabel: string;
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
    tags: {
      from: before.tags.map((tag) => tag.label),
      to: after.tags.map((tag) => tag.label),
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
