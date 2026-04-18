import { z } from "zod";

import {
  KNOWLEDGE_ASSET_TYPES,
  KNOWLEDGE_ASSET_TYPE_LABELS,
  type KnowledgeAssetFormSnapshot,
  type KnowledgeAssetListQuery,
  type KnowledgeLibrarySnapshot,
} from "./knowledge.types";

type KnowledgeTagType =
  | "FREEFORM"
  | "AGENCY"
  | "CAPABILITY"
  | "CONTRACT_TYPE"
  | "VEHICLE";

const knowledgeLibrarySearchParamsSchema = z.object({
  agency: z.string().trim().min(1).max(120).catch("").optional(),
  capability: z.string().trim().min(1).max(160).catch("").optional(),
  contractType: z.string().trim().min(1).max(160).catch("").optional(),
  opportunity: z.string().trim().min(1).max(120).catch("").optional(),
  q: z.string().trim().min(1).max(200).catch("").optional(),
  tag: z.string().trim().min(1).max(80).catch("").optional(),
  type: z.string().trim().max(80).catch("").optional(),
  vehicle: z.string().trim().min(1).max(160).catch("").optional(),
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
    orderBy: [
      {
        tagType: "asc",
      },
      {
        label: "asc",
      },
    ],
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
  agencies: {
    orderBy: [{ name: "asc" }, { organizationCode: "asc" }],
    select: {
      id: true,
      name: true,
      organizationCode: true,
    },
  },
  contractVehicles: {
    orderBy: [{ code: "asc" }, { name: "asc" }],
    select: {
      code: true,
      name: true,
      vehicleType: true,
    },
  },
  organizationProfile: {
    select: {
      capabilities: {
        where: {
          isActive: true,
        },
        orderBy: [{ sortOrder: "asc" }, { capabilityLabel: "asc" }],
        select: {
          capabilityKey: true,
          capabilityLabel: true,
          description: true,
        },
      },
    },
  },
  opportunities: {
    orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
    select: {
      id: true,
      title: true,
      currentStageLabel: true,
      procurementBaseTypeLabel: true,
      procurementTypeLabel: true,
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
  agencies: {
    orderBy: [{ name: "asc" }, { organizationCode: "asc" }],
    select: {
      id: true,
      name: true,
      organizationCode: true,
    },
  },
  contractVehicles: {
    orderBy: [{ code: "asc" }, { name: "asc" }],
    select: {
      code: true,
      name: true,
      vehicleType: true,
    },
  },
  organizationProfile: {
    select: {
      capabilities: {
        where: {
          isActive: true,
        },
        orderBy: [{ sortOrder: "asc" }, { capabilityLabel: "asc" }],
        select: {
          capabilityKey: true,
          capabilityLabel: true,
          description: true,
        },
      },
    },
  },
  opportunities: {
    orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
    select: {
      id: true,
      title: true,
      currentStageLabel: true,
      procurementBaseTypeLabel: true,
      procurementTypeLabel: true,
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
    orderBy: [
      {
        tagType: "asc",
      },
      {
        label: "asc",
      },
    ],
    select: {
      label: true,
      normalizedLabel: true,
      tagKey: true,
      tagType: true,
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
  agencies: Array<{
    id: string;
    name: string;
    organizationCode: string | null;
  }>;
  contractVehicles: Array<{
    code: string;
    name: string;
    vehicleType: string | null;
  }>;
  organizationProfile: {
    capabilities: Array<{
      capabilityKey: string;
      capabilityLabel: string;
      description: string | null;
    }>;
  } | null;
  opportunities: Array<{
    id: string;
    title: string;
    currentStageLabel: string | null;
    procurementBaseTypeLabel: string | null;
    procurementTypeLabel: string | null;
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
      tagKey: string;
      tagType: KnowledgeTagType;
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

type KnowledgeFormOrganizationRecord = {
  id: string;
  name: string;
  slug: string;
  agencies: Array<{
    id: string;
    name: string;
    organizationCode: string | null;
  }>;
  contractVehicles: Array<{
    code: string;
    name: string;
    vehicleType: string | null;
  }>;
  organizationProfile: {
    capabilities: Array<{
      capabilityKey: string;
      capabilityLabel: string;
      description: string | null;
    }>;
  } | null;
  opportunities: Array<{
    id: string;
    title: string;
    currentStageLabel: string | null;
    procurementBaseTypeLabel: string | null;
    procurementTypeLabel: string | null;
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
    normalizedLabel: string;
    tagKey: string;
    tagType: KnowledgeTagType;
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
      | KnowledgeFormOrganizationRecord
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
    agency: getFirstSearchParamValue(searchParams?.agency),
    capability: getFirstSearchParamValue(searchParams?.capability),
    contractType: getFirstSearchParamValue(searchParams?.contractType),
    opportunity: getFirstSearchParamValue(searchParams?.opportunity),
    q: getFirstSearchParamValue(searchParams?.q),
    tag: getFirstSearchParamValue(searchParams?.tag),
    type: getFirstSearchParamValue(searchParams?.type),
    vehicle: getFirstSearchParamValue(searchParams?.vehicle),
  });

  return {
    agencyId: parsed.agency || null,
    assetType: KNOWLEDGE_ASSET_TYPES.includes(
      parsed.type as (typeof KNOWLEDGE_ASSET_TYPES)[number],
    )
      ? (parsed.type as (typeof KNOWLEDGE_ASSET_TYPES)[number])
      : null,
    capabilityKey: parsed.capability || null,
    contractType: parsed.contractType
      ? normalizeKnowledgeTag(parsed.contractType)
      : null,
    opportunityId: parsed.opportunity || null,
    query: parsed.q || null,
    tag: parsed.tag || null,
    vehicleCode: parsed.vehicle || null,
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
  const organization = (await db.organization.findUnique({
    where: {
      id: organizationId,
    },
    select: organizationKnowledgeSnapshotSelect,
  })) as OrganizationKnowledgeSnapshotRecord | null;

  if (!organization) {
    return null;
  }

  const query = parseKnowledgeLibrarySearchParams(searchParams);
  const normalizedTagFilter = query.tag
    ? normalizeKnowledgeTag(query.tag)
    : null;
  const normalizedQuery = query.query?.toLowerCase() ?? null;

  const filteredAssets = organization.knowledgeAssets
    .map((asset) => ({
      asset,
      tagSummary: splitKnowledgeTags(asset.tags),
    }))
    .filter(({ asset, tagSummary }) => {
      if (query.assetType && asset.assetType !== query.assetType) {
        return false;
      }

      if (
        normalizedTagFilter &&
        !tagSummary.freeformTags.some(
          (tag) => tag.normalizedLabel === normalizedTagFilter,
        )
      ) {
        return false;
      }

      if (
        query.agencyId &&
        !tagSummary.agencies.some((agency) => agency.value === query.agencyId)
      ) {
        return false;
      }

      if (
        query.capabilityKey &&
        !tagSummary.capabilities.some(
          (capability) => capability.value === query.capabilityKey,
        )
      ) {
        return false;
      }

      if (
        query.contractType &&
        !tagSummary.contractTypes.some(
          (contractType) =>
            normalizeKnowledgeTag(contractType.value) === query.contractType,
        )
      ) {
        return false;
      }

      if (
        query.vehicleCode &&
        !tagSummary.vehicles.some(
          (vehicle) => vehicle.value === query.vehicleCode,
        )
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
        ...tagSummary.freeformTags.map((tag) => tag.label),
        ...tagSummary.agencies.map((tag) => tag.label),
        ...tagSummary.capabilities.map((tag) => tag.label),
        ...tagSummary.contractTypes.map((tag) => tag.label),
        ...tagSummary.vehicles.map((tag) => tag.label),
        ...asset.linkedOpportunities.map((link) => link.opportunity.title),
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
    });

  const contractTypeOptions = buildContractTypeOptions({
    assets: organization.knowledgeAssets,
    opportunities: organization.opportunities,
  });

  return {
    availableFilterCount: countAppliedFilters(query),
    filterOptions: {
      agencies: organization.agencies.map((agency) => ({
        description:
          agency.organizationCode != null
            ? `Organization code ${agency.organizationCode}`
            : null,
        label: formatAgencyLabel(agency.name, agency.organizationCode),
        value: agency.id,
      })),
      assetTypes: KNOWLEDGE_ASSET_TYPES.map((assetType) => ({
        label: KNOWLEDGE_ASSET_TYPE_LABELS[assetType],
        value: assetType,
      })),
      capabilities: (organization.organizationProfile?.capabilities ?? []).map(
        (capability) => ({
          description: capability.description,
          label: capability.capabilityLabel,
          value: capability.capabilityKey,
        }),
      ),
      contractTypes: contractTypeOptions.map((option) => ({
        description: "Observed on current pursuits or seeded knowledge assets",
        label: option.label,
        value: option.value,
      })),
      opportunities: organization.opportunities.map((opportunity) => ({
        label: opportunity.title,
        value: opportunity.id,
        currentStageLabel: opportunity.currentStageLabel ?? "Unknown stage",
      })),
      tags: buildFreeformTagOptions(organization.knowledgeAssets),
      vehicles: organization.contractVehicles.map((vehicle) => ({
        description: vehicle.vehicleType ? `Type ${vehicle.vehicleType}` : null,
        label: `${vehicle.code} · ${vehicle.name}`,
        value: vehicle.code,
      })),
    },
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
    },
    query,
    results: filteredAssets.map(({ asset, tagSummary }) => ({
      id: asset.id,
      assetType: asset.assetType,
      title: asset.title,
      summary: asset.summary,
      bodyPreview: summarizeKnowledgeBody(asset.body, asset.summary),
      facets: {
        agencies: tagSummary.agencies.map((tag) => tag.label),
        capabilities: tagSummary.capabilities.map((tag) => tag.label),
        contractTypes: tagSummary.contractTypes.map((tag) => tag.label),
        vehicles: tagSummary.vehicles.map((tag) => tag.label),
      },
      tags: tagSummary.freeformTags.map((tag) => tag.label),
      linkedOpportunities: asset.linkedOpportunities.map((link) => ({
        id: link.opportunity.id,
        title: link.opportunity.title,
        currentStageLabel:
          link.opportunity.currentStageLabel ?? "Unknown stage",
      })),
      createdByLabel:
        asset.createdByUser?.name ?? asset.createdByUser?.email ?? null,
      updatedByLabel:
        asset.updatedByUser?.name ?? asset.updatedByUser?.email ?? null,
      updatedAt: asset.updatedAt.toISOString(),
    })),
    totalCount: filteredAssets.length,
    totalLinkedOpportunityCount: countDistinctLinkedOpportunities(
      filteredAssets.map(({ asset }) => asset),
    ),
    totalTagCount: countDistinctTagLabels(filteredAssets),
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
  const organization = (await db.organization.findUnique({
    where: {
      id: organizationId,
    },
    select: organizationKnowledgeFormSelect,
  })) as KnowledgeFormOrganizationRecord | null;

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

  const tagSummary = splitKnowledgeTags(asset?.tags ?? []);
  const contractTypeOptions = buildContractTypeOptions({
    assets: asset
      ? [asset]
      : [],
    opportunities: organization.opportunities,
  });

  return {
    agencyOptions: organization.agencies.map((agency) => ({
      description:
        agency.organizationCode != null
          ? `Organization code ${agency.organizationCode}`
          : null,
      label: formatAgencyLabel(agency.name, agency.organizationCode),
      value: agency.id,
    })),
    assetId: asset?.id ?? null,
    capabilityOptions: (
      organization.organizationProfile?.capabilities ?? []
    ).map((capability) => ({
      description: capability.description,
      label: capability.capabilityLabel,
      value: capability.capabilityKey,
    })),
    contractTypeOptions: contractTypeOptions.map((option) => ({
      description: "Observed contract-type coverage for this workspace",
      label: option.label,
      value: option.label,
    })),
    initialValues: {
      agencyIds: tagSummary.agencies.map((tag) => tag.value),
      assetType: asset?.assetType ?? "PAST_PERFORMANCE_SNIPPET",
      body: asset?.body ?? "",
      capabilityKeys: tagSummary.capabilities.map((tag) => tag.value),
      contractTypes: tagSummary.contractTypes.map((tag) => tag.label),
      summary: asset?.summary ?? "",
      tags: asset
        ? tagSummary.freeformTags.map((tag) => tag.label).join(", ")
        : "",
      title: asset?.title ?? "",
      opportunityIds:
        asset?.linkedOpportunities.map((link) => link.opportunityId) ?? [],
      vehicleCodes: tagSummary.vehicles.map((tag) => tag.value),
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
    vehicleOptions: organization.contractVehicles.map((vehicle) => ({
      description: vehicle.vehicleType ? `Type ${vehicle.vehicleType}` : null,
      label: `${vehicle.code} · ${vehicle.name}`,
      value: vehicle.code,
    })),
  };
}

export function normalizeKnowledgeTag(tag: string) {
  return tag.trim().toLowerCase();
}

function splitKnowledgeTags(
  tags: Array<{
    label: string;
    normalizedLabel: string;
    tagKey: string;
    tagType: KnowledgeTagType;
  }>,
) {
  const mapTags = (tagType: KnowledgeTagType) =>
    tags
      .filter((tag) => tag.tagType === tagType)
      .map((tag) => ({
        label: tag.label,
        normalizedLabel: tag.normalizedLabel,
        value: tag.tagKey,
      }));

  return {
    agencies: mapTags("AGENCY"),
    capabilities: mapTags("CAPABILITY"),
    contractTypes: mapTags("CONTRACT_TYPE"),
    freeformTags: mapTags("FREEFORM"),
    vehicles: mapTags("VEHICLE"),
  };
}

function buildContractTypeOptions({
  assets,
  opportunities,
}: {
  assets: Array<{
    tags: Array<{
      label: string;
      normalizedLabel: string;
      tagKey: string;
      tagType: KnowledgeTagType;
    }>;
  }>;
  opportunities: Array<{
    procurementBaseTypeLabel: string | null;
    procurementTypeLabel: string | null;
  }>;
}) {
  const options = new Map<string, string>();

  for (const opportunity of opportunities) {
    for (const label of [
      opportunity.procurementTypeLabel,
      opportunity.procurementBaseTypeLabel,
    ]) {
      if (!label) {
        continue;
      }

      options.set(normalizeKnowledgeTag(label), label);
    }
  }

  for (const asset of assets) {
    for (const tag of asset.tags) {
      if (tag.tagType !== "CONTRACT_TYPE") {
        continue;
      }

      options.set(tag.tagKey, tag.label);
    }
  }

  return [...options.entries()]
    .map(([value, label]) => ({
      label,
      value,
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

function buildFreeformTagOptions(
  assets: OrganizationKnowledgeSnapshotRecord["knowledgeAssets"],
) {
  return [
    ...new Map(
      assets.flatMap((asset) =>
        asset.tags
          .filter((tag) => tag.tagType === "FREEFORM")
          .map((tag) => [tag.normalizedLabel, tag.label] as const),
      ),
    ).entries(),
  ]
    .map(([value, label]) => ({
      label,
      value,
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

function formatAgencyLabel(name: string, organizationCode: string | null) {
  return organizationCode != null ? `${name} (${organizationCode})` : name;
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
    query.agencyId,
    query.capabilityKey,
    query.contractType,
    query.opportunityId,
    query.vehicleCode,
  ].filter(Boolean).length;
}

function countDistinctTagLabels(
  assets: Array<{
    asset: OrganizationKnowledgeSnapshotRecord["knowledgeAssets"][number];
    tagSummary: ReturnType<typeof splitKnowledgeTags>;
  }>,
) {
  return new Set(
    assets.flatMap(({ tagSummary }) => [
      ...tagSummary.freeformTags.map((tag) => tag.label),
      ...tagSummary.agencies.map((tag) => tag.label),
      ...tagSummary.capabilities.map((tag) => tag.label),
      ...tagSummary.contractTypes.map((tag) => tag.label),
      ...tagSummary.vehicles.map((tag) => tag.label),
    ]),
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
