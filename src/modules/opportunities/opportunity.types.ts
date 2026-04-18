export type BidDecisionOutcome = "GO" | "NO_GO" | "DEFER";

export type OpportunityTaskStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "BLOCKED"
  | "COMPLETED"
  | "CANCELLED";

export type OpportunityTaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type OpportunityMilestoneStatus =
  | "PLANNED"
  | "AT_RISK"
  | "COMPLETED"
  | "MISSED"
  | "CANCELLED";

export type SourceConnectorAuthType =
  | "API_KEY"
  | "OAUTH"
  | "SESSION"
  | "NONE"
  | "FILE_IMPORT";

export type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
};

export type SourceConnectorSummary = {
  id: string;
  sourceSystemKey: string;
  sourceDisplayName: string;
  authType: SourceConnectorAuthType;
  isEnabled: boolean;
  supportsSearch: boolean;
  supportsScheduledSync: boolean;
  supportsResultPreview: boolean;
  connectorVersion: string | null;
};

export type AgencySummary = {
  id: string;
  name: string;
  organizationCode: string | null;
};

export type ContractVehicleSummary = {
  id: string;
  code: string;
  name: string;
  vehicleType: string | null;
  isPrimary: boolean;
};

export type CompetitorSummary = {
  id: string;
  name: string;
  role: string;
  websiteUrl: string | null;
};

export type OpportunityTaskSummary = {
  id: string;
  title: string;
  status: OpportunityTaskStatus;
  priority: OpportunityTaskPriority;
  dueAt: string | null;
  assigneeName: string | null;
};

export type OpportunityMilestoneSummary = {
  id: string;
  title: string;
  status: OpportunityMilestoneStatus;
  targetDate: string;
};

export type OpportunityScoreSummary = {
  totalScore: string | null;
  maximumScore: string | null;
  recommendationOutcome: BidDecisionOutcome | null;
  calculatedAt: string;
};

export type OpportunityBidDecisionSummary = {
  decisionTypeKey: string | null;
  recommendationOutcome: BidDecisionOutcome | null;
  finalOutcome: BidDecisionOutcome | null;
  decidedAt: string | null;
};

export type OpportunitySummary = {
  id: string;
  title: string;
  solicitationNumber: string | null;
  leadAgency: AgencySummary | null;
  currentStageKey: string | null;
  currentStageLabel: string;
  responseDeadlineAt: string | null;
  originSourceSystem: string | null;
  naicsCode: string | null;
  sourceSummaryText: string | null;
  updatedAt: string;
  score: OpportunityScoreSummary | null;
  bidDecision: OpportunityBidDecisionSummary | null;
  vehicles: ContractVehicleSummary[];
  competitors: CompetitorSummary[];
  tasks: OpportunityTaskSummary[];
  milestones: OpportunityMilestoneSummary[];
};

export type OpportunityListDueWindow =
  | "all"
  | "overdue"
  | "next_30_days"
  | "next_60_days"
  | "no_deadline";

export type OpportunityListSort =
  | "updated_desc"
  | "deadline_asc"
  | "deadline_desc"
  | "title_asc"
  | "stage_asc";

export type OpportunityListQuery = {
  query: string | null;
  agencyId: string | null;
  naicsCode: string | null;
  stageKey: string | null;
  sourceSystem: string | null;
  dueWindow: OpportunityListDueWindow;
  sort: OpportunityListSort;
  page: number;
  pageSize: number;
};

export type OpportunityListFilterOption = {
  count: number;
  label: string;
  value: string;
};

export type OpportunityListItemSummary = OpportunitySummary & {
  sourceDisplayLabel: string;
};

export type OpportunityListSnapshot = {
  availableFilterCount: number;
  filterOptions: {
    agencies: OpportunityListFilterOption[];
    dueWindows: Array<{
      label: string;
      value: OpportunityListDueWindow;
    }>;
    sortOptions: Array<{
      label: string;
      value: OpportunityListSort;
    }>;
    sources: OpportunityListFilterOption[];
    stages: OpportunityListFilterOption[];
  };
  organization: OrganizationSummary;
  pageCount: number;
  pageResultCount: number;
  query: OpportunityListQuery;
  results: OpportunityListItemSummary[];
  totalCount: number;
};

export type OpportunityStageSummary = {
  stageKey: string;
  stageLabel: string;
  opportunityCount: number;
};

export type DashboardDeadlineSummary = {
  id: string;
  title: string;
  deadlineAt: string;
  deadlineType: "RESPONSE_DEADLINE" | "MILESTONE";
  opportunityId: string;
  opportunityTitle: string;
  stageLabel: string;
};

export type HomeDashboardSnapshot = {
  organization: OrganizationSummary;
  connectors: SourceConnectorSummary[];
  trackedOpportunityCount: number;
  activeOpportunityCount: number;
  upcomingDeadlineCount: number;
  enabledConnectorCount: number;
  opportunitiesRequiringAttentionCount: number;
  stageSummaries: OpportunityStageSummary[];
  upcomingDeadlines: DashboardDeadlineSummary[];
  topOpportunities: OpportunitySummary[];
};
