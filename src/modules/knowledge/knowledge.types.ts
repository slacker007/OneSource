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
  opportunityId: string | null;
};

export type KnowledgeAssetOpportunitySummary = {
  id: string;
  title: string;
  currentStageLabel: string;
};

export type KnowledgeAssetSummary = {
  id: string;
  assetType: KnowledgeAssetType;
  title: string;
  summary: string | null;
  bodyPreview: string;
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

export type KnowledgeLibrarySnapshot = {
  availableFilterCount: number;
  filterOptions: {
    assetTypes: Array<{
      label: string;
      value: KnowledgeAssetType;
    }>;
    opportunities: KnowledgeOpportunityOption[];
    tags: KnowledgeAssetListFilterOption[];
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
  title: string;
  summary: string;
  body: string;
  tags: string;
  opportunityIds: string[];
};

export type KnowledgeAssetFormFieldName = keyof KnowledgeAssetFormValues;

export type KnowledgeAssetFormFieldErrors = Partial<
  Record<KnowledgeAssetFormFieldName, string>
>;

export type KnowledgeAssetFormSnapshot = {
  assetId: string | null;
  initialValues: KnowledgeAssetFormValues;
  mode: KnowledgeFormMode;
  opportunityOptions: KnowledgeOpportunityOption[];
  organization: OrganizationSummary;
  updatedAt: string | null;
};
