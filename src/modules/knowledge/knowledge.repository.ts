import { z } from "zod";

import {
  KNOWLEDGE_ASSET_TYPES,
  KNOWLEDGE_ASSET_TYPE_LABELS,
  type KnowledgeAssetFormSnapshot,
  type KnowledgeAssetListQuery,
  type KnowledgeLibrarySnapshot,
} from "./knowledge.types";

const knowledgeLibrarySearchParamsSchema = z.object({
  q: z.string().trim().min(1).max(200).catch("").optional(),
  type: z.string().trim().max(80).catch("").optional(),
  tag: z.string().trim().min(1).max(80).catch("").optional(),
  opportunity: z.string().trim().min(1).max(120).catch("").optional(),
});

const knowledgeAssetSelect = {
  id: true,
  assetType: true,
  title: true,
  summary: true,
  body: true,
  updatedAt: true,
  createdByUser: {
    select: {
      name: true,
      email: true,
    },
  },
  updatedByUser: {
    select: {
      name: true,
      email: true,
    },
  },
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
          currentStageLabel: true,
        },
      },
    },
  },
} as const;

const organizationKnowledgeSnapshotSelect = {
  id: true,
  name: true,
  slug: true,
  opportunities: {
    orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
    select: {
      id: true,
      title: true,
      currentStageLabel: true,
    },
  },
  knowledgeAssets: {
    where: {
      isArchived: false,
    },
    orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
    select: knowledgeAssetSelect,
  },
} as const;

const organizationKnowledgeFormSelect = {
  id: true,
  name: true,
  slug: true,
  opportunities: {
    orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
    select: {
      id: true,
      title: true,
      currentStageLabel: true,
    },
  },
} as const;

const knowledgeAssetFormSelect = {
  id: true,
  assetType: true,
  title: true,
  summary: true,
  body: true,
  updatedAt: true,
  tags: {
    orderBy: {
      normalizedLabel: "asc",
    },
    select: {
      label: true,
    },
  },
  linkedOpportunities: {
    select: {
      opportunityId: true,
    },
  },
} as const;

export type OrganizationKnowledgeSnapshotRecord = {
  id: string;
  name: string;
  slug: string;
  opportunities: Array<{
    id: string;
    title: string;
    currentStageLabel: string | null;
  }>;
  knowledgeAssets: Array<{
    id: string;
    assetType: (typeof KNOWLEDGE_ASSET_TYPES)[number];
    title: string;
    summary: string | null;
    body: string;
    updatedAt: Date;
    createdByUser: {
      name: string | null;
      email: string | null;
    } | null;
    updatedByUser: {
      name: string | null;
      email: string | null;
    } | null;
    tags: Array<{
      label: string;
      normalizedLabel: string;
    }>;
    linkedOpportunities: Array<{
      opportunity: {
        id: string;
        title: string;
        currentStageLabel: string | null;
      };
    }>;
  }>;
};

type KnowledgeAssetFormRecord = {
  id: string;
  assetType: (typeof KNOWLEDGE_ASSET_TYPES)[number];
  title: string;
  summary: string | null;
  body: string;
  updatedAt: Date;
  tags: Array<{
    label: string;
  }>;
  linkedOpportunities: Array<{
    opportunityId: string;
  }>;
};

export type KnowledgeRepositoryClient = {
  organization: {
    findUnique(
      args:
        | {
            where: {
              id: string;
            };
            select: typeof organizationKnowledgeSnapshotSelect;
          }
        | {
            where: {
              id: string;
            };
            select: typeof organizationKnowledgeFormSelect;
          },
    ): Promise<
      | OrganizationKnowledgeSnapshotRecord
      | {
          id: string;
          name: string;
          slug: string;
          opportunities: Array<{
            id: string;
            title: string;
            currentStageLabel: string | null;
          }>;
        }
      | null
    >;
  };
  knowledgeAsset: {
    findFirst(args: {
      where: {
        id: string;
        organizationId: string;
        isArchived: boolean;
      };
      select: typeof knowledgeAssetFormSelect;
    }): Promise<KnowledgeAssetFormRecord | null>;
  };
};

export function parseKnowledgeLibrarySearchParams(
  searchParams: Record<string, string | string[] | undefined> | undefined,
): KnowledgeAssetListQuery {
  const parsed = knowledgeLibrarySearchParamsSchema.parse({
    q: getFirstSearchParamValue(searchParams?.q),
    type: getFirstSearchParamValue(searchParams?.type),
    tag: getFirstSearchParamValue(searchParams?.tag),
    opportunity: getFirstSearchParamValue(searchParams?.opportunity),
  });

  return {
    query: parsed.q || null,
    assetType: KNOWLEDGE_ASSET_TYPES.includes(
      parsed.type as (typeof KNOWLEDGE_ASSET_TYPES)[number],
    )
      ? (parsed.type as (typeof KNOWLEDGE_ASSET_TYPES)[number])
      : null,
    tag: parsed.tag || null,
    opportunityId: parsed.opportunity || null,
  };
}

export async function getKnowledgeLibrarySnapshot({
  db,
  organizationId,
  searchParams,
}: {
  db: KnowledgeRepositoryClient;
  organizationId: string;
  searchParams: Record<string, string | string[] | undefined> | undefined;
}): Promise<KnowledgeLibrarySnapshot | null> {
  const organization = await db.organization.findUnique({
    where: {
      id: organizationId,
    },
    select: organizationKnowledgeSnapshotSelect,
  }) as OrganizationKnowledgeSnapshotRecord | null;

  if (!organization) {
    return null;
  }

  const query = parseKnowledgeLibrarySearchParams(searchParams);
  const normalizedTagFilter = query.tag ? normalizeKnowledgeTag(query.tag) : null;
  const normalizedQuery = query.query?.toLowerCase() ?? null;

  const filteredAssets = organization.knowledgeAssets.filter((asset) => {
    if (query.assetType && asset.assetType !== query.assetType) {
      return false;
    }

    if (
      normalizedTagFilter &&
      !asset.tags.some((tag) => tag.normalizedLabel === normalizedTagFilter)
    ) {
      return false;
    }

    if (
      query.opportunityId &&
      !asset.linkedOpportunities.some(
        (link) => link.opportunity.id === query.opportunityId,
      )
    ) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return [
      asset.title,
      asset.summary ?? "",
      asset.body,
      ...asset.tags.map((tag) => tag.label),
      ...asset.linkedOpportunities.map((link) => link.opportunity.title),
    ].some((value) => value.toLowerCase().includes(normalizedQuery));
  });

  const allTags = [...new Set(
    organization.knowledgeAssets.flatMap((asset) =>
      asset.tags.map((tag) => tag.label),
    ),
  )].sort((left, right) => left.localeCompare(right));

  return {
    availableFilterCount: countAppliedFilters(query),
    filterOptions: {
      assetTypes: KNOWLEDGE_ASSET_TYPES.map((assetType) => ({
        label: KNOWLEDGE_ASSET_TYPE_LABELS[assetType],
        value: assetType,
      })),
      opportunities: organization.opportunities.map((opportunity) => ({
        label: opportunity.title,
        value: opportunity.id,
        currentStageLabel: opportunity.currentStageLabel ?? "Unknown stage",
      })),
      tags: allTags.map((tag) => ({
        label: tag,
        value: tag,
      })),
    },
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
    },
    query,
    results: filteredAssets.map((asset) => ({
      id: asset.id,
      assetType: asset.assetType,
      title: asset.title,
      summary: asset.summary,
      bodyPreview: summarizeKnowledgeBody(asset.body, asset.summary),
      tags: asset.tags.map((tag) => tag.label),
      linkedOpportunities: asset.linkedOpportunities.map((link) => ({
        id: link.opportunity.id,
        title: link.opportunity.title,
        currentStageLabel: link.opportunity.currentStageLabel ?? "Unknown stage",
      })),
      createdByLabel:
        asset.createdByUser?.name ?? asset.createdByUser?.email ?? null,
      updatedByLabel:
        asset.updatedByUser?.name ?? asset.updatedByUser?.email ?? null,
      updatedAt: asset.updatedAt.toISOString(),
    })),
    totalCount: filteredAssets.length,
    totalLinkedOpportunityCount: countDistinctLinkedOpportunities(filteredAssets),
    totalTagCount: countDistinctTags(filteredAssets),
  };
}

export async function getKnowledgeAssetFormSnapshot({
  assetId,
  db,
  organizationId,
}: {
  assetId?: string | null;
  db: KnowledgeRepositoryClient;
  organizationId: string;
}): Promise<KnowledgeAssetFormSnapshot | null> {
  const organization = await db.organization.findUnique({
    where: {
      id: organizationId,
    },
    select: organizationKnowledgeFormSelect,
  }) as
    | {
        id: string;
        name: string;
        slug: string;
        opportunities: Array<{
          id: string;
          title: string;
          currentStageLabel: string | null;
        }>;
      }
    | null;

  if (!organization) {
    return null;
  }

  const asset = assetId
    ? await db.knowledgeAsset.findFirst({
        where: {
          id: assetId,
          organizationId,
          isArchived: false,
        },
        select: knowledgeAssetFormSelect,
      })
    : null;

  if (assetId && !asset) {
    return null;
  }

  return {
    assetId: asset?.id ?? null,
    initialValues: {
      assetType: asset?.assetType ?? "PAST_PERFORMANCE_SNIPPET",
      title: asset?.title ?? "",
      summary: asset?.summary ?? "",
      body: asset?.body ?? "",
      tags: asset ? asset.tags.map((tag) => tag.label).join(", ") : "",
      opportunityIds: asset?.linkedOpportunities.map((link) => link.opportunityId) ?? [],
    },
    mode: asset ? "edit" : "create",
    opportunityOptions: organization.opportunities.map((opportunity) => ({
      label: opportunity.title,
      value: opportunity.id,
      currentStageLabel: opportunity.currentStageLabel ?? "Unknown stage",
    })),
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
    },
    updatedAt: asset?.updatedAt.toISOString() ?? null,
  };
}

export function normalizeKnowledgeTag(tag: string) {
  return tag.trim().toLowerCase();
}

function summarizeKnowledgeBody(body: string, summary: string | null) {
  const source = summary && summary.trim().length > 0 ? summary : body;
  return source.length > 180 ? `${source.slice(0, 177).trimEnd()}...` : source;
}

function countAppliedFilters(query: KnowledgeAssetListQuery) {
  return [
    query.query,
    query.assetType,
    query.tag,
    query.opportunityId,
  ].filter(Boolean).length;
}

function countDistinctTags(
  assets: OrganizationKnowledgeSnapshotRecord["knowledgeAssets"],
) {
  return new Set(
    assets.flatMap((asset) => asset.tags.map((tag) => tag.label)),
  ).size;
}

function countDistinctLinkedOpportunities(
  assets: OrganizationKnowledgeSnapshotRecord["knowledgeAssets"],
) {
  return new Set(
    assets.flatMap((asset) =>
      asset.linkedOpportunities.map((link) => link.opportunity.id),
    ),
  ).size;
}

function getFirstSearchParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}
