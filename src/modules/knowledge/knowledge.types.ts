import type { OrganizationSummary } from "@/modules/opportunities/opportunity.types";

export const KNOWLEDGE_ASSET_TYPES = [
  "PAST_PERFORMANCE_SNIPPET",
  "BOILERPLATE_CONTENT",
  "WIN_THEME",
] as const;

export type KnowledgeAssetType = (typeof KNOWLEDGE_ASSET_TYPES)[number];

export const KNOWLEDGE_ASSET_TYPE_LABELS: Record<KnowledgeAssetType, string> = {
  PAST_PERFORMANCE_SNIPPET: "Past-performance snippet",
  BOILERPLATE_CONTENT: "Boilerplate content",
  WIN_THEME: "Win theme",
};

export type KnowledgeAssetListQuery = {
  query: string | null;
  assetType: KnowledgeAssetType | null;
  tag: string | null;
  agencyId: string | null;
  capabilityKey: string | null;
  contractType: string | null;
  opportunityId: string | null;
  vehicleCode: string | null;
};

export type KnowledgeAssetOpportunitySummary = {
  id: string;
  title: string;
  currentStageLabel: string;
};

export type KnowledgeAssetFacetSummary = {
  agencies: string[];
  capabilities: string[];
  contractTypes: string[];
  vehicles: string[];
};

export type KnowledgeAssetSummary = {
  id: string;
  assetType: KnowledgeAssetType;
  title: string;
  summary: string | null;
  body: string;
  bodyPreview: string;
  facets: KnowledgeAssetFacetSummary;
  tags: string[];
  linkedOpportunities: KnowledgeAssetOpportunitySummary[];
  createdByLabel: string | null;
  updatedByLabel: string | null;
  updatedAt: string;
};

export type KnowledgeAssetListFilterOption = {
  label: string;
  value: string;
};

export type KnowledgeOpportunityOption = {
  label: string;
  value: string;
  currentStageLabel: string;
};

export type KnowledgeFacetOption = {
  description?: string | null;
  label: string;
  value: string;
};

export type KnowledgeLibrarySnapshot = {
  availableFilterCount: number;
  filterOptions: {
    agencies: KnowledgeFacetOption[];
    assetTypes: Array<{
      label: string;
      value: KnowledgeAssetType;
    }>;
    capabilities: KnowledgeFacetOption[];
    contractTypes: KnowledgeFacetOption[];
    opportunities: KnowledgeOpportunityOption[];
    tags: KnowledgeAssetListFilterOption[];
    vehicles: KnowledgeFacetOption[];
  };
  organization: OrganizationSummary;
  query: KnowledgeAssetListQuery;
  results: KnowledgeAssetSummary[];
  totalCount: number;
  totalLinkedOpportunityCount: number;
  totalTagCount: number;
};

export type KnowledgeFormMode = "create" | "edit";

export type KnowledgeAssetFormValues = {
  assetType: KnowledgeAssetType;
  agencyIds: string[];
  title: string;
  summary: string;
  body: string;
  capabilityKeys: string[];
  contractTypes: string[];
  tags: string;
  opportunityIds: string[];
  vehicleCodes: string[];
};

export type KnowledgeAssetFormFieldName = keyof KnowledgeAssetFormValues;

export type KnowledgeAssetFormFieldErrors = Partial<
  Record<KnowledgeAssetFormFieldName, string>
>;

export type KnowledgeAssetFormSnapshot = {
  agencyOptions: KnowledgeFacetOption[];
  assetId: string | null;
  capabilityOptions: KnowledgeFacetOption[];
  contractTypeOptions: KnowledgeFacetOption[];
  initialValues: KnowledgeAssetFormValues;
  mode: KnowledgeFormMode;
  opportunityOptions: KnowledgeOpportunityOption[];
  organization: OrganizationSummary;
  updatedAt: string | null;
  vehicleOptions: KnowledgeFacetOption[];
};
