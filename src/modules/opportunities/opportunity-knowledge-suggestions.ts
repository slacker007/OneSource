import type { OpportunityWorkspaceKnowledgeSuggestion } from "./opportunity.types";

type KnowledgeTagType =
  | "FREEFORM"
  | "AGENCY"
  | "CAPABILITY"
  | "CONTRACT_TYPE"
  | "VEHICLE";

type WorkspaceKnowledgeTagRecord = {
  label: string;
  normalizedLabel: string;
  tagKey: string;
  tagType: KnowledgeTagType;
};

type WorkspaceKnowledgeAssetRecord = {
  id: string;
  assetType: OpportunityWorkspaceKnowledgeSuggestion["assetType"];
  title: string;
  summary: string | null;
  body: string;
  updatedAt: Date;
  updatedByUser: {
    name: string | null;
    email: string | null;
  } | null;
  tags: WorkspaceKnowledgeTagRecord[];
  linkedOpportunities: Array<{
    opportunity: {
      id: string;
      title: string;
      currentStageLabel: string | null;
    };
  }>;
};

type WorkspaceCapabilityRecord = {
  capabilityKey: string;
  capabilityLabel: string;
  capabilityKeywords: string[];
};

type WorkspaceOpportunityContext = {
  id: string;
  title: string;
  description: string | null;
  sourceSummaryText: string | null;
  leadAgency: {
    id: string;
    name: string;
  } | null;
  procurementTypeLabel: string | null;
  procurementBaseTypeLabel: string | null;
  vehicles: Array<{
    vehicle: {
      code: string;
    };
  }>;
};

export function rankOpportunityKnowledgeSuggestions({
  knowledgeAssets,
  capabilities,
  limit = 4,
  opportunity,
}: {
  knowledgeAssets: WorkspaceKnowledgeAssetRecord[];
  capabilities: WorkspaceCapabilityRecord[];
  limit?: number;
  opportunity: WorkspaceOpportunityContext;
}): OpportunityWorkspaceKnowledgeSuggestion[] {
  const normalizedOpportunityText = normalizeText([
    opportunity.title,
    opportunity.description,
    opportunity.sourceSummaryText,
    opportunity.leadAgency?.name ?? null,
    opportunity.procurementTypeLabel,
    opportunity.procurementBaseTypeLabel,
    ...opportunity.vehicles.map((vehicleLink) => vehicleLink.vehicle.code),
  ]);
  const matchedCapabilityKeys = inferCapabilityMatches({
    capabilities,
    normalizedOpportunityText,
  });
  const matchedContractTypes = new Set(
    [
      opportunity.procurementTypeLabel,
      opportunity.procurementBaseTypeLabel,
    ].flatMap((label) => {
      const normalized = normalizeLabel(label);

      return normalized ? [normalized] : [];
    }),
  );
  const vehicleCodes = new Set(
    opportunity.vehicles.flatMap((vehicleLink) => {
      const normalized = normalizeLabel(vehicleLink.vehicle.code);

      return normalized ? [normalized] : [];
    }),
  );

  return knowledgeAssets
    .map((asset) =>
      buildSuggestion({
        asset,
        matchedCapabilityKeys,
        matchedContractTypes,
        normalizedOpportunityText,
        opportunity,
        vehicleCodes,
      }),
    )
    .filter((suggestion): suggestion is RankedSuggestion => suggestion !== null)
    .sort(compareRankedSuggestions)
    .slice(0, limit)
    .map((suggestion) => {
      const { sortScore: ignoredSortScore, ...result } = suggestion;

      void ignoredSortScore;

      return result;
    });
}

type RankedSuggestion = OpportunityWorkspaceKnowledgeSuggestion & {
  sortScore: number;
};

function buildSuggestion({
  asset,
  matchedCapabilityKeys,
  matchedContractTypes,
  normalizedOpportunityText,
  opportunity,
  vehicleCodes,
}: {
  asset: WorkspaceKnowledgeAssetRecord;
  matchedCapabilityKeys: Set<string>;
  matchedContractTypes: Set<string>;
  normalizedOpportunityText: string;
  opportunity: WorkspaceOpportunityContext;
  vehicleCodes: Set<string>;
}): RankedSuggestion | null {
  const groupedTags = splitKnowledgeTags(asset.tags);
  const directlyLinked = asset.linkedOpportunities.some(
    (link) => link.opportunity.id === opportunity.id,
  );
  const matchedAgencies =
    opportunity.leadAgency == null
      ? []
      : groupedTags.agencies.filter(
          (tag) => tag.tagKey === opportunity.leadAgency?.id,
        );
  const matchedCapabilities = groupedTags.capabilities.filter((tag) =>
    matchedCapabilityKeys.has(tag.tagKey),
  );
  const matchedContractTypeTags = groupedTags.contractTypes.filter((tag) =>
    matchedContractTypes.has(tag.tagKey),
  );
  const matchedVehicles = groupedTags.vehicles.filter((tag) =>
    vehicleCodes.has(normalizeLabel(tag.tagKey)),
  );
  const matchedFreeformTags = groupedTags.freeformTags.filter((tag) =>
    normalizedOpportunityText.includes(tag.normalizedLabel),
  );

  const sortScore =
    (directlyLinked ? 120 : 0) +
    matchedAgencies.length * 40 +
    matchedCapabilities.length * 24 +
    matchedVehicles.length * 20 +
    matchedContractTypeTags.length * 16 +
    Math.min(matchedFreeformTags.length, 2) * 8;

  if (sortScore === 0) {
    return null;
  }

  const matchReasons = [
    directlyLinked ? "Linked to this opportunity" : null,
    matchedAgencies.length > 0
      ? `Lead agency: ${matchedAgencies.map((tag) => tag.label).join(", ")}`
      : null,
    matchedCapabilities.length > 0
      ? `Capability fit: ${matchedCapabilities.map((tag) => tag.label).join(", ")}`
      : null,
    matchedVehicles.length > 0
      ? `Vehicle coverage: ${matchedVehicles.map((tag) => shortVehicleLabel(tag.label)).join(", ")}`
      : null,
    matchedContractTypeTags.length > 0
      ? `Contract type: ${matchedContractTypeTags.map((tag) => tag.label).join(", ")}`
      : null,
    matchedFreeformTags.length > 0
      ? `Keyword overlap: ${matchedFreeformTags
          .slice(0, 2)
          .map((tag) => tag.label)
          .join(", ")}`
      : null,
  ].filter((reason): reason is string => reason !== null);

  return {
    id: asset.id,
    assetType: asset.assetType,
    title: asset.title,
    summary: asset.summary,
    bodyPreview: summarizeKnowledgeBody(asset.body, asset.summary),
    matchReasons,
    matchedFacets: {
      agencies: matchedAgencies.map((tag) => tag.label),
      capabilities: matchedCapabilities.map((tag) => tag.label),
      contractTypes: matchedContractTypeTags.map((tag) => tag.label),
      freeformTags: matchedFreeformTags.slice(0, 2).map((tag) => tag.label),
      vehicles: matchedVehicles.map((tag) => shortVehicleLabel(tag.label)),
    },
    linkedOpportunities: asset.linkedOpportunities.map((link) => ({
      id: link.opportunity.id,
      title: link.opportunity.title,
      currentStageLabel: link.opportunity.currentStageLabel ?? "Unknown stage",
    })),
    updatedAt: asset.updatedAt.toISOString(),
    updatedByLabel:
      asset.updatedByUser?.name ?? asset.updatedByUser?.email ?? null,
    sortScore,
  };
}

function inferCapabilityMatches({
  capabilities,
  normalizedOpportunityText,
}: {
  capabilities: WorkspaceCapabilityRecord[];
  normalizedOpportunityText: string;
}) {
  return new Set(
    capabilities.flatMap((capability) => {
      const candidateValues = [
        capability.capabilityLabel,
        ...capability.capabilityKeywords,
      ];
      const matched = candidateValues.some((value) => {
        const normalized = normalizeLabel(value);

        return normalized.length > 0
          ? normalizedOpportunityText.includes(normalized)
          : false;
      });

      return matched ? [capability.capabilityKey] : [];
    }),
  );
}

function splitKnowledgeTags(tags: WorkspaceKnowledgeTagRecord[]) {
  const byType = (tagType: KnowledgeTagType) =>
    tags.filter((tag) => tag.tagType === tagType);

  return {
    agencies: byType("AGENCY"),
    capabilities: byType("CAPABILITY"),
    contractTypes: byType("CONTRACT_TYPE"),
    freeformTags: byType("FREEFORM"),
    vehicles: byType("VEHICLE"),
  };
}

function normalizeText(values: Array<string | null | undefined>) {
  return values
    .map((value) => normalizeLabel(value))
    .filter((value) => value.length > 0)
    .join(" ");
}

function normalizeLabel(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function summarizeKnowledgeBody(body: string, summary: string | null) {
  const source = summary && summary.trim().length > 0 ? summary : body;

  return source.length > 180 ? `${source.slice(0, 177).trimEnd()}...` : source;
}

function shortVehicleLabel(label: string) {
  return label.split("·")[0]?.trim() || label;
}

function compareRankedSuggestions(
  left: RankedSuggestion,
  right: RankedSuggestion,
) {
  if (left.sortScore !== right.sortScore) {
    return right.sortScore - left.sortScore;
  }

  if (left.updatedAt !== right.updatedAt) {
    return right.updatedAt.localeCompare(left.updatedAt);
  }

  return left.title.localeCompare(right.title);
}
