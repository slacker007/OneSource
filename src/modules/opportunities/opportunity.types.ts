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

export type DeadlineReminderState = "NONE" | "UPCOMING" | "OVERDUE";

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
  deadlineReminderState: DeadlineReminderState;
  deadlineReminderUpdatedAt: string | null;
  assigneeName: string | null;
};

export type OpportunityMilestoneSummary = {
  id: string;
  title: string;
  status: OpportunityMilestoneStatus;
  targetDate: string;
  deadlineReminderState: DeadlineReminderState;
  deadlineReminderUpdatedAt: string | null;
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

export type OpportunityFormMode = "create" | "edit";

export type OpportunityFormValues = {
  title: string;
  description: string;
  leadAgencyId: string;
  responseDeadlineAt: string;
  solicitationNumber: string;
  naicsCode: string;
};

export type OpportunityFormFieldName = keyof OpportunityFormValues;

export type OpportunityFormFieldErrors = Partial<
  Record<OpportunityFormFieldName, string>
>;

export type OpportunityFormAgencyOption = {
  label: string;
  value: string;
};

export type OpportunityTaskAssigneeOption = {
  label: string;
  value: string;
};

export type OpportunityFormSnapshot = {
  agencyOptions: OpportunityFormAgencyOption[];
  currentStageKey: string;
  currentStageLabel: string;
  draftStorageKey: string;
  initialValues: OpportunityFormValues;
  mode: OpportunityFormMode;
  opportunityId: string | null;
  organization: OrganizationSummary;
  originSourceSystem: string | null;
  updatedAt: string | null;
};

export type OpportunityWorkspaceTask = OpportunityTaskSummary & {
  assigneeUserId: string | null;
  description: string | null;
  createdByName: string | null;
  startedAt: string | null;
  completedAt: string | null;
};

export type OpportunityWorkspaceMilestone = OpportunityMilestoneSummary & {
  description: string | null;
  milestoneTypeKey: string | null;
  completedAt: string | null;
};

export type OpportunityWorkspaceScoreFactor = {
  id: string;
  factorKey: string;
  factorLabel: string;
  weight: string | null;
  score: string | null;
  maximumScore: string | null;
  explanation: string | null;
};

export type OpportunityWorkspaceScorecard = OpportunityScoreSummary & {
  scoringModelKey: string | null;
  scoringModelVersion: string | null;
  scorePercent: string | null;
  recommendationSummary: string | null;
  summary: string | null;
  factors: OpportunityWorkspaceScoreFactor[];
};

export type OpportunityWorkspaceBidDecision =
  OpportunityBidDecisionSummary & {
    recommendationSummary: string | null;
    finalRationale: string | null;
    recommendedAt: string | null;
    recommendedByLabel: string | null;
    decidedByName: string | null;
  };

export type OpportunityWorkspaceDocument = {
  id: string;
  title: string;
  documentType: string | null;
  sourceType: string;
  sourceUrl: string | null;
  originalFileName: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  extractionStatus: string;
  extractedAt: string | null;
  extractedText: string | null;
  uploadedByName: string | null;
  createdAt: string;
};

export type OpportunityWorkspaceNote = {
  id: string;
  title: string | null;
  body: string;
  contentFormat: string;
  isPinned: boolean;
  authorName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OpportunityWorkspaceActivity = {
  id: string;
  eventType: string;
  title: string;
  description: string | null;
  actorLabel: string | null;
  relatedEntityType: string | null;
  occurredAt: string;
};

export type OpportunityWorkspaceStageTransition = {
  id: string;
  triggerType: string;
  fromStageLabel: string | null;
  toStageLabel: string;
  rationale: string | null;
  actorName: string | null;
  transitionedAt: string;
};

export type OpportunityWorkspaceOpportunitySummary = OpportunitySummary & {
  description: string | null;
  externalNoticeId: string | null;
  sourceSummaryUrl: string | null;
  postedAt: string | null;
  classificationCode: string | null;
  setAsideDescription: string | null;
  currentStageChangedAt: string | null;
  uiLink: string | null;
  officeLocation: string | null;
  placeOfPerformanceLocation: string | null;
};

export type OpportunityWorkspaceSnapshot = {
  organization: OrganizationSummary;
  opportunity: OpportunityWorkspaceOpportunitySummary;
  scorecard: OpportunityWorkspaceScorecard | null;
  bidDecision: OpportunityWorkspaceBidDecision | null;
  taskAssigneeOptions: OpportunityTaskAssigneeOption[];
  tasks: OpportunityWorkspaceTask[];
  milestones: OpportunityWorkspaceMilestone[];
  documents: OpportunityWorkspaceDocument[];
  notes: OpportunityWorkspaceNote[];
  activity: OpportunityWorkspaceActivity[];
  stageTransitions: OpportunityWorkspaceStageTransition[];
};

export type PersonalTaskBoardItem = OpportunityWorkspaceTask & {
  opportunityId: string;
  opportunityTitle: string;
  opportunityStageLabel: string;
};

export type PersonalTaskBoardSnapshot = {
  organization: OrganizationSummary;
  assignedTaskCount: number;
  completedTaskCount: number;
  overdueTaskCount: number;
  userDisplayName: string;
  tasks: PersonalTaskBoardItem[];
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
