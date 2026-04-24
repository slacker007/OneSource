import type {
  AuditActorType,
  ConnectorRunStatus,
  SourceConnectorValidationStatus,
  SourceImportDecisionMode,
  SourceImportDecisionStatus,
  SourceSyncTriggerType,
  UserStatus,
} from "@prisma/client";

export type AdminUserRoleSummary = {
  key: string;
  label: string;
  assignedAt: string;
};

export type AdminUserSummary = {
  id: string;
  name: string | null;
  email: string;
  status: UserStatus;
  latestRoleAssignedAt: string | null;
  roleKeys: string[];
  roleLabels: string[];
  roles: AdminUserRoleSummary[];
};

export type AdminRoleOption = {
  key: string;
  label: string;
  description: string | null;
};

export type AdminAuditEventSummary = {
  id: string;
  occurredAt: string;
  action: string;
  actionLabel: string;
  actorType: AuditActorType;
  actorLabel: string;
  targetLabel: string;
  targetType: string;
  summary: string | null;
  metadataPreview: string | null;
};

export type AdminScoringProfileAgencySummary = {
  id: string;
  label: string;
};

export type AdminScoringCapabilitySummary = {
  id: string;
  key: string;
  label: string;
  category: string | null;
  keywords: string[];
  description: string | null;
};

export type AdminScoringCertificationSummary = {
  id: string;
  key: string;
  label: string;
  code: string | null;
  issuingBody: string | null;
  description: string | null;
};

export type AdminScoringVehicleSummary = {
  id: string;
  code: string;
  name: string;
  vehicleType: string | null;
  awardingAgency: string | null;
  isPreferred: boolean;
  usageNotes: string | null;
};

export type AdminScoringCriterionSummary = {
  id: string;
  key: string;
  label: string;
  description: string | null;
  weight: string;
  isActive: boolean;
};

export type AdminScoringRecalibrationOutcomeSummary = {
  key: "awarded" | "lost" | "no_bid";
  label: string;
  opportunityCount: number;
  averageScorePercent: string | null;
};

export type AdminScoringRecalibrationFactorInsight = {
  key: string;
  label: string;
  description: string | null;
  currentWeight: string;
  suggestedWeight: string;
  awardedAveragePercent: string | null;
  nonAwardAveragePercent: string | null;
  outcomeLiftPercent: string | null;
  evidenceCount: number;
  recommendation: "increase" | "decrease" | "hold";
  rationale: string;
};

export type AdminScoringRecalibrationSummary = {
  closedOpportunityCount: number;
  sampledOpportunityCount: number;
  recommendationAlignmentPercent: string | null;
  outcomeSummaries: AdminScoringRecalibrationOutcomeSummary[];
  factorInsights: AdminScoringRecalibrationFactorInsight[];
  suggestionSummary: string;
};

export type AdminScoringProfileSummary = {
  overview: string | null;
  strategicFocus: string | null;
  targetNaicsCodes: string[];
  activeScoringModelKey: string;
  activeScoringModelVersion: string;
  goRecommendationThreshold: string;
  deferRecommendationThreshold: string;
  minimumRiskScorePercent: string;
  priorityAgencies: AdminScoringProfileAgencySummary[];
  relationshipAgencies: AdminScoringProfileAgencySummary[];
  capabilities: AdminScoringCapabilitySummary[];
  certifications: AdminScoringCertificationSummary[];
  selectedVehicles: AdminScoringVehicleSummary[];
  scoringCriteria: AdminScoringCriterionSummary[];
  recalibration: AdminScoringRecalibrationSummary;
};

export type AdminSourceConnectorHealthStatus =
  | "healthy"
  | "degraded"
  | "rate_limited"
  | "inactive"
  | "unknown";

export type AdminSourceConnectorHealthSummary = {
  id: string;
  sourceSystemKey: string;
  sourceDisplayName: string;
  isEnabled: boolean;
  validationStatus: SourceConnectorValidationStatus;
  connectorVersion: string | null;
  savedSearchCount: number;
  latestRetryableSavedSearchId: string | null;
  lastValidatedAt: string | null;
  lastValidationMessage: string | null;
  lastSyncAttemptAt: string | null;
  lastSuccessfulSyncAt: string | null;
  lastSyncStatus: ConnectorRunStatus | null;
  healthStatus: AdminSourceConnectorHealthStatus;
  rateLimitStrategy: string | null;
  rateLimitNotes: string | null;
  latestRateLimitAt: string | null;
  latestRateLimitMessage: string | null;
};

export type AdminSourceSyncRunSummary = {
  id: string;
  sourceDisplayName: string;
  sourceSystemKey: string;
  sourceSystem: string;
  savedSearchId: string | null;
  savedSearchName: string | null;
  requestedAt: string;
  completedAt: string | null;
  status: ConnectorRunStatus;
  triggerType: SourceSyncTriggerType;
  recordsFetched: number;
  recordsImported: number;
  recordsFailed: number;
  httpStatus: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  isRateLimited: boolean;
  canRetry: boolean;
};

export type AdminFailedImportReviewSummary = {
  id: string;
  sourceDisplayName: string;
  sourceSystem: string;
  sourceRecordId: string;
  sourceTitle: string;
  mode: SourceImportDecisionMode;
  status: SourceImportDecisionStatus;
  requestedAt: string;
  decidedAt: string | null;
  rationale: string | null;
  targetOpportunityTitle: string | null;
};

export type AdminSourceOperationsSnapshot = {
  totalConnectorCount: number;
  activeConnectorCount: number;
  healthyConnectorCount: number;
  rateLimitedConnectorCount: number;
  failedImportReviewCount: number;
  lastSuccessfulSyncAt: string | null;
  lastSuccessfulSyncSourceDisplayName: string | null;
  connectorHealth: AdminSourceConnectorHealthSummary[];
  recentSyncRuns: AdminSourceSyncRunSummary[];
  failedImportReviews: AdminFailedImportReviewSummary[];
};

export type AdminSavedSearchSummary = {
  id: string;
  name: string;
  description: string | null;
  sourceSystem: string;
  sourceDisplayName: string;
  connectorVersion: string | null;
  createdByLabel: string;
  createdAt: string;
  updatedAt: string;
  lastExecutedAt: string | null;
  lastSyncedAt: string | null;
  filterSummary: string[];
};

export type AdminSettingsOverviewSnapshot = {
  organizationId: string;
  organizationName: string;
  totalUserCount: number;
  adminUserCount: number;
  totalAuditLogCount: number;
  scoringProfileSummary: {
    activeScoringModelKey: string;
    activeScoringModelVersion: string;
    capabilityCount: number;
    scoringCriteriaCount: number;
  } | null;
  sourceOperationsSummary: Pick<
    AdminSourceOperationsSnapshot,
    | "totalConnectorCount"
    | "activeConnectorCount"
    | "healthyConnectorCount"
    | "rateLimitedConnectorCount"
    | "failedImportReviewCount"
    | "lastSuccessfulSyncAt"
    | "lastSuccessfulSyncSourceDisplayName"
  >;
  savedSearchCount: number;
};

export type AdminConnectorSettingsSnapshot = {
  organizationId: string;
  organizationName: string;
  sourceOperations: AdminSourceOperationsSnapshot;
};

export type AdminSavedSearchSettingsSnapshot = {
  organizationId: string;
  organizationName: string;
  savedSearches: AdminSavedSearchSummary[];
};

export type AdminScoringSettingsSnapshot = {
  organizationId: string;
  organizationName: string;
  scoringProfile: AdminScoringProfileSummary | null;
};

export type AdminAuditSettingsSnapshot = {
  organizationId: string;
  organizationName: string;
  totalAuditLogCount: number;
  recentAuditEvents: AdminAuditEventSummary[];
};

export type AdminSettingsSnapshot = AdminSettingsOverviewSnapshot &
  AdminConnectorSettingsSnapshot &
  AdminSavedSearchSettingsSnapshot &
  AdminScoringSettingsSnapshot &
  AdminAuditSettingsSnapshot;

export type AdminUserManagementSnapshot = {
  organizationId: string;
  organizationName: string;
  totalUserCount: number;
  activeUserCount: number;
  invitedUserCount: number;
  disabledUserCount: number;
  adminUserCount: number;
  roleOptions: AdminRoleOption[];
  users: AdminUserSummary[];
};
