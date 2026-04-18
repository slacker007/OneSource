import type { Prisma } from "@prisma/client";

import type {
  AdminFailedImportReviewSummary,
  AdminSourceConnectorHealthStatus,
  AdminSourceOperationsSnapshot,
} from "./admin.types";

export type AdminSourceConnectorHealthRecord = {
  id: string;
  sourceSystemKey: string;
  sourceDisplayName: string;
  isEnabled: boolean;
  validationStatus: "UNKNOWN" | "VALID" | "INVALID";
  connectorVersion: string | null;
  lastValidatedAt: Date | null;
  lastValidationMessage: string | null;
  rateLimitProfile: Prisma.JsonValue | null;
  _count: {
    savedSearches: number;
  };
  syncRuns: Array<{
    id: string;
    status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "PARTIAL" | "FAILED" | "CANCELLED";
    requestedAt: Date;
    completedAt: Date | null;
    errorCode: string | null;
    errorMessage: string | null;
    savedSearch: {
      id: string;
      name: string;
    } | null;
    searchExecution: {
      httpStatus: number | null;
      errorCode: string | null;
      errorMessage: string | null;
    } | null;
  }>;
};

export type AdminRecentSourceSyncRunRecord = {
  id: string;
  sourceSystem: string;
  status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "PARTIAL" | "FAILED" | "CANCELLED";
  triggerType: "MANUAL" | "SCHEDULED" | "BACKFILL";
  recordsFetched: number;
  recordsImported: number;
  recordsFailed: number;
  requestedAt: Date;
  completedAt: Date | null;
  errorCode: string | null;
  errorMessage: string | null;
  connectorConfig: {
    sourceDisplayName: string;
    sourceSystemKey: string;
  } | null;
  savedSearch: {
    id: string;
    name: string;
  } | null;
  searchExecution: {
    httpStatus: number | null;
    errorCode: string | null;
    errorMessage: string | null;
  } | null;
};

export type AdminFailedImportDecisionRecord = {
  id: string;
  mode: "CREATE_OPPORTUNITY" | "LINK_TO_EXISTING" | "SKIP_IMPORT";
  status: "PENDING" | "APPLIED" | "REJECTED";
  rationale: string | null;
  requestedAt: Date;
  decidedAt: Date | null;
  connectorConfig: {
    sourceDisplayName: string;
  } | null;
  sourceRecord: {
    sourceSystem: string;
    sourceRecordId: string;
    sourceImportPreviewPayload: Prisma.JsonValue | null;
    sourceNormalizedPayload: Prisma.JsonValue;
    sourceRawPayload: Prisma.JsonValue;
  };
  targetOpportunity: {
    title: string;
  } | null;
};

export function buildAdminSourceOperationsSnapshot({
  connectorHealthRecords,
  failedImportDecisionRecords,
  recentSyncRunRecords,
}: {
  connectorHealthRecords: AdminSourceConnectorHealthRecord[];
  failedImportDecisionRecords: AdminFailedImportDecisionRecord[];
  recentSyncRunRecords: AdminRecentSourceSyncRunRecord[];
}): AdminSourceOperationsSnapshot {
  const connectorHealth = connectorHealthRecords.map((connector) => {
    const lastSyncAttempt = connector.syncRuns[0] ?? null;
    const lastSuccessfulSync =
      connector.syncRuns.find((run) => isSuccessfulRunStatus(run.status)) ?? null;
    const latestRateLimitRun =
      connector.syncRuns.find((run) => isRateLimitedRun(run)) ?? null;
    const latestRetryableRun =
      connector.syncRuns.find(
        (run) => run.status === "FAILED" && run.savedSearch?.id !== undefined,
      ) ?? null;
    const rateLimitProfile = readRateLimitProfile(connector.rateLimitProfile);
    const healthStatus = deriveConnectorHealthStatus({
      isEnabled: connector.isEnabled,
      lastSyncStatus: lastSyncAttempt?.status ?? null,
      latestRateLimitAt: latestRateLimitRun?.requestedAt ?? null,
      lastSuccessfulSyncAt: lastSuccessfulSync?.requestedAt ?? null,
      validationStatus: connector.validationStatus,
    });

    return {
      connectorVersion: connector.connectorVersion,
      healthStatus,
      id: connector.id,
      isEnabled: connector.isEnabled,
      lastSuccessfulSyncAt: lastSuccessfulSync?.requestedAt.toISOString() ?? null,
      lastSyncAttemptAt: lastSyncAttempt?.requestedAt.toISOString() ?? null,
      lastSyncStatus: lastSyncAttempt?.status ?? null,
      latestRetryableSavedSearchId: latestRetryableRun?.savedSearch?.id ?? null,
      lastValidatedAt: connector.lastValidatedAt?.toISOString() ?? null,
      lastValidationMessage: connector.lastValidationMessage,
      latestRateLimitAt: latestRateLimitRun?.requestedAt.toISOString() ?? null,
      latestRateLimitMessage:
        latestRateLimitRun?.errorMessage ??
        latestRateLimitRun?.searchExecution?.errorMessage ??
        null,
      rateLimitNotes: rateLimitProfile.notes,
      rateLimitStrategy: rateLimitProfile.strategy,
      savedSearchCount: connector._count.savedSearches,
      sourceDisplayName: connector.sourceDisplayName,
      sourceSystemKey: connector.sourceSystemKey,
      validationStatus: connector.validationStatus,
    };
  });

  const lastSuccessfulConnector = [...connectorHealth]
    .filter((connector) => connector.lastSuccessfulSyncAt !== null)
    .sort((left, right) =>
      compareIsoTimestampsDesc(left.lastSuccessfulSyncAt, right.lastSuccessfulSyncAt),
    )[0];

  return {
    activeConnectorCount: connectorHealth.filter((connector) => connector.isEnabled).length,
    connectorHealth,
    failedImportReviewCount: failedImportDecisionRecords.length,
    failedImportReviews: failedImportDecisionRecords.map(buildFailedImportReviewSummary),
    healthyConnectorCount: connectorHealth.filter(
      (connector) => connector.healthStatus === "healthy",
    ).length,
    lastSuccessfulSyncAt: lastSuccessfulConnector?.lastSuccessfulSyncAt ?? null,
    lastSuccessfulSyncSourceDisplayName:
      lastSuccessfulConnector?.sourceDisplayName ?? null,
    rateLimitedConnectorCount: connectorHealth.filter(
      (connector) => connector.healthStatus === "rate_limited",
    ).length,
    recentSyncRuns: recentSyncRunRecords.map((run) => ({
      completedAt: run.completedAt?.toISOString() ?? null,
      canRetry: run.status === "FAILED" && run.savedSearch?.id !== undefined,
      errorCode: run.errorCode ?? run.searchExecution?.errorCode ?? null,
      errorMessage: run.errorMessage ?? run.searchExecution?.errorMessage ?? null,
      httpStatus: run.searchExecution?.httpStatus ?? null,
      id: run.id,
      isRateLimited: isRateLimitedRun(run),
      recordsFailed: run.recordsFailed,
      recordsFetched: run.recordsFetched,
      recordsImported: run.recordsImported,
      requestedAt: run.requestedAt.toISOString(),
      savedSearchId: run.savedSearch?.id ?? null,
      savedSearchName: run.savedSearch?.name ?? null,
      sourceDisplayName: run.connectorConfig?.sourceDisplayName ?? run.sourceSystem,
      sourceSystem: run.sourceSystem,
      sourceSystemKey: run.connectorConfig?.sourceSystemKey ?? run.sourceSystem,
      status: run.status,
      triggerType: run.triggerType,
    })),
    totalConnectorCount: connectorHealth.length,
  };
}

function buildFailedImportReviewSummary(
  record: AdminFailedImportDecisionRecord,
): AdminFailedImportReviewSummary {
  return {
    decidedAt: record.decidedAt?.toISOString() ?? null,
    id: record.id,
    mode: record.mode,
    rationale: record.rationale,
    requestedAt: record.requestedAt.toISOString(),
    sourceDisplayName: record.connectorConfig?.sourceDisplayName ?? record.sourceRecord.sourceSystem,
    sourceRecordId: record.sourceRecord.sourceRecordId,
    sourceSystem: record.sourceRecord.sourceSystem,
    sourceTitle: readSourceTitle(record.sourceRecord),
    status: record.status,
    targetOpportunityTitle: record.targetOpportunity?.title ?? null,
  };
}

function deriveConnectorHealthStatus({
  isEnabled,
  lastSuccessfulSyncAt,
  lastSyncStatus,
  latestRateLimitAt,
  validationStatus,
}: {
  isEnabled: boolean;
  lastSuccessfulSyncAt: Date | null;
  lastSyncStatus: AdminSourceConnectorHealthRecord["syncRuns"][number]["status"] | null;
  latestRateLimitAt: Date | null;
  validationStatus: AdminSourceConnectorHealthRecord["validationStatus"];
}): AdminSourceConnectorHealthStatus {
  if (!isEnabled) {
    return "inactive";
  }

  if (validationStatus === "INVALID") {
    return "degraded";
  }

  if (
    latestRateLimitAt &&
    (!lastSuccessfulSyncAt || latestRateLimitAt >= lastSuccessfulSyncAt)
  ) {
    return "rate_limited";
  }

  if (lastSyncStatus === "FAILED" || lastSyncStatus === "CANCELLED") {
    return "degraded";
  }

  if (validationStatus === "VALID") {
    return "healthy";
  }

  return "unknown";
}

function isSuccessfulRunStatus(
  status: AdminSourceConnectorHealthRecord["syncRuns"][number]["status"],
) {
  return status === "SUCCEEDED" || status === "PARTIAL";
}

function isRateLimitedRun(
  run:
    | AdminSourceConnectorHealthRecord["syncRuns"][number]
    | AdminRecentSourceSyncRunRecord,
) {
  return (
    run.errorCode?.includes("429") === true ||
    run.searchExecution?.httpStatus === 429 ||
    run.searchExecution?.errorCode?.includes("429") === true
  );
}

function readRateLimitProfile(value: Prisma.JsonValue | null) {
  const profile = readRecord(value);

  return {
    notes: readString(profile?.notes),
    strategy: readString(profile?.strategy),
  };
}

function readSourceTitle(record: AdminFailedImportDecisionRecord["sourceRecord"]) {
  const previewPayload = readRecord(record.sourceImportPreviewPayload);
  const previewSource = readRecord(previewPayload?.source);
  const normalizedWrapper = readRecord(record.sourceNormalizedPayload);
  const normalizedPayload = readRecord(normalizedWrapper?.normalizedPayload);
  const rawPayload = readRecord(record.sourceRawPayload);

  return (
    readString(previewSource?.title) ??
    readString(normalizedPayload?.title) ??
    readString(rawPayload?.title) ??
    readString(normalizedPayload?.externalNoticeId) ??
    record.sourceRecordId
  );
}

function compareIsoTimestampsDesc(left: string | null, right: string | null) {
  const leftValue = left ? Date.parse(left) : 0;
  const rightValue = right ? Date.parse(right) : 0;
  return rightValue - leftValue;
}

function readRecord(value: Prisma.JsonValue | null | undefined) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, Prisma.JsonValue>;
}

function readString(value: Prisma.JsonValue | null | undefined) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}
