import { Prisma, type PrismaClient } from "@prisma/client";

import type {
  AdminAuditSettingsSnapshot,
  AdminConnectorSettingsSnapshot,
  AdminSavedSearchSettingsSnapshot,
  AdminScoringSettingsSnapshot,
  AdminSettingsSnapshot,
  AdminSettingsOverviewSnapshot,
  AdminUserManagementSnapshot,
} from "./admin.types";
import {
  buildScoringRecalibrationSnapshot,
  type ScoringRecalibrationObservation,
  type ScoringRecalibrationOutcomeKey,
} from "./scoring-recalibration";
import type { OpportunityScoringFactorKey } from "@/modules/opportunities/opportunity-scoring";
import {
  buildAdminSourceOperationsSnapshot,
  type AdminFailedImportDecisionRecord,
  type AdminRecentSourceSyncRunRecord,
  type AdminSourceConnectorHealthRecord,
} from "./source-operations";

const auditLogSummaryArgs = Prisma.validator<Prisma.AuditLogDefaultArgs>()({
  select: {
    id: true,
    occurredAt: true,
    action: true,
    actorType: true,
    actorIdentifier: true,
    targetType: true,
    targetId: true,
    targetDisplay: true,
    summary: true,
    metadata: true,
    actorUser: {
      select: {
        name: true,
        email: true,
      },
    },
  },
});

const organizationSettingsSnapshotArgs =
  Prisma.validator<Prisma.OrganizationDefaultArgs>()({
    select: {
      id: true,
      name: true,
      agencies: {
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          name: true,
          organizationCode: true,
        },
      },
      organizationProfile: {
        select: {
          overview: true,
          strategicFocus: true,
          targetNaicsCodes: true,
          priorityAgencyIds: true,
          relationshipAgencyIds: true,
          activeScoringModelKey: true,
          activeScoringModelVersion: true,
          goRecommendationThreshold: true,
          deferRecommendationThreshold: true,
          minimumRiskScorePercent: true,
          capabilities: {
            where: {
              isActive: true,
            },
            orderBy: [{ sortOrder: "asc" }, { capabilityLabel: "asc" }],
            select: {
              id: true,
              capabilityKey: true,
              capabilityLabel: true,
              capabilityCategory: true,
              capabilityKeywords: true,
              description: true,
            },
          },
          certifications: {
            where: {
              isActive: true,
            },
            orderBy: [{ sortOrder: "asc" }, { certificationLabel: "asc" }],
            select: {
              id: true,
              certificationKey: true,
              certificationLabel: true,
              certificationCode: true,
              issuingBody: true,
              description: true,
            },
          },
          selectedVehicles: {
            orderBy: [{ sortOrder: "asc" }, { vehicle: { code: "asc" } }],
            select: {
              isPreferred: true,
              usageNotes: true,
              vehicle: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  vehicleType: true,
                  awardingAgency: true,
                },
              },
            },
          },
          scoringCriteria: {
            where: {
              isActive: true,
            },
            orderBy: [{ sortOrder: "asc" }, { factorLabel: "asc" }],
            select: {
              id: true,
              factorKey: true,
              factorLabel: true,
              description: true,
              weight: true,
              isActive: true,
            },
          },
        },
      },
      _count: {
        select: {
          users: true,
          auditLogs: true,
        },
      },
      auditLogs: {
        orderBy: {
          occurredAt: "desc",
        },
        take: 12,
        ...auditLogSummaryArgs,
      },
    },
  });

const organizationUserManagementSnapshotArgs =
  Prisma.validator<Prisma.OrganizationDefaultArgs>()({
    select: {
      id: true,
      name: true,
      roles: {
        orderBy: {
          name: "asc",
        },
        select: {
          key: true,
          name: true,
          description: true,
        },
      },
      users: {
        orderBy: [{ status: "asc" }, { email: "asc" }],
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          roles: {
            orderBy: [{ assignedAt: "desc" }, { role: { name: "asc" } }],
            select: {
              assignedAt: true,
              role: {
                select: {
                  key: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

const sourceConnectorHealthArgs =
  Prisma.validator<Prisma.SourceConnectorConfigDefaultArgs>()({
    select: {
      id: true,
      sourceSystemKey: true,
      sourceDisplayName: true,
      isEnabled: true,
      validationStatus: true,
      connectorVersion: true,
      lastValidatedAt: true,
      lastValidationMessage: true,
      rateLimitProfile: true,
      _count: {
        select: {
          savedSearches: true,
        },
      },
      syncRuns: {
        orderBy: {
          requestedAt: "desc",
        },
        take: 10,
        select: {
          id: true,
          status: true,
          requestedAt: true,
          completedAt: true,
          errorCode: true,
          errorMessage: true,
          savedSearch: {
            select: {
              id: true,
              name: true,
            },
          },
          searchExecution: {
            select: {
              httpStatus: true,
              errorCode: true,
              errorMessage: true,
            },
          },
        },
      },
    },
  });

const recentSourceSyncRunArgs =
  Prisma.validator<Prisma.SourceSyncRunDefaultArgs>()({
    select: {
      id: true,
      sourceSystem: true,
      status: true,
      triggerType: true,
      recordsFetched: true,
      recordsImported: true,
      recordsFailed: true,
      requestedAt: true,
      completedAt: true,
      errorCode: true,
      errorMessage: true,
      connectorConfig: {
        select: {
          sourceDisplayName: true,
          sourceSystemKey: true,
        },
      },
      savedSearch: {
        select: {
          id: true,
          name: true,
        },
      },
      searchExecution: {
        select: {
          httpStatus: true,
          errorCode: true,
          errorMessage: true,
        },
      },
    },
  });

const adminSavedSearchArgs =
  Prisma.validator<Prisma.SourceSavedSearchDefaultArgs>()({
    select: {
      id: true,
      sourceSystem: true,
      name: true,
      description: true,
      canonicalFilters: true,
      createdAt: true,
      updatedAt: true,
      lastExecutedAt: true,
      lastSyncedAt: true,
      connectorConfig: {
        select: {
          sourceDisplayName: true,
          connectorVersion: true,
        },
      },
      createdByUser: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

const failedImportReviewArgs =
  Prisma.validator<Prisma.SourceImportDecisionDefaultArgs>()({
    select: {
      id: true,
      mode: true,
      status: true,
      rationale: true,
      requestedAt: true,
      decidedAt: true,
      connectorConfig: {
        select: {
          sourceDisplayName: true,
        },
      },
      sourceRecord: {
        select: {
          sourceSystem: true,
          sourceRecordId: true,
          sourceImportPreviewPayload: true,
          sourceNormalizedPayload: true,
          sourceRawPayload: true,
        },
      },
      targetOpportunity: {
        select: {
          title: true,
        },
      },
    },
  });

const recalibrationOpportunityArgs =
  Prisma.validator<Prisma.OpportunityDefaultArgs>()({
    select: {
      id: true,
      title: true,
      currentStageKey: true,
      currentStageLabel: true,
      scorecards: {
        where: {
          isCurrent: true,
        },
        orderBy: {
          calculatedAt: "desc",
        },
        take: 1,
        select: {
          scorePercent: true,
          factorScores: {
            orderBy: {
              sortOrder: "asc",
            },
            select: {
              factorKey: true,
              score: true,
              maximumScore: true,
            },
          },
        },
      },
      bidDecisions: {
        where: {
          isCurrent: true,
        },
        orderBy: {
          decidedAt: "desc",
        },
        take: 1,
        select: {
          recommendationOutcome: true,
          finalOutcome: true,
        },
      },
      closeouts: {
        where: {
          isCurrent: true,
        },
        orderBy: {
          recordedAt: "desc",
        },
        take: 1,
        select: {
          outcomeStageKey: true,
        },
      },
    },
  });

export type AdminRepositoryClient = Pick<
  PrismaClient,
  | "organization"
  | "user"
  | "opportunity"
  | "sourceConnectorConfig"
  | "sourceSavedSearch"
  | "sourceImportDecision"
  | "sourceSyncRun"
>;

export type OrganizationSettingsRecord = Prisma.OrganizationGetPayload<
  typeof organizationSettingsSnapshotArgs
>;
export type OrganizationUserManagementRecord = Prisma.OrganizationGetPayload<
  typeof organizationUserManagementSnapshotArgs
>;
export type AuditLogSummaryPayload = Prisma.AuditLogGetPayload<
  typeof auditLogSummaryArgs
>;
export type SourceConnectorHealthPayload =
  Prisma.SourceConnectorConfigGetPayload<typeof sourceConnectorHealthArgs>;
export type RecentSourceSyncRunPayload = Prisma.SourceSyncRunGetPayload<
  typeof recentSourceSyncRunArgs
>;
export type AdminSavedSearchPayload = Prisma.SourceSavedSearchGetPayload<
  typeof adminSavedSearchArgs
>;
export type FailedImportReviewPayload = Prisma.SourceImportDecisionGetPayload<
  typeof failedImportReviewArgs
>;
export type RecalibrationOpportunityPayload = Prisma.OpportunityGetPayload<
  typeof recalibrationOpportunityArgs
>;

export async function getAdminSettingsSnapshot({
  db,
  organizationId,
}: {
  db: AdminRepositoryClient;
  organizationId: string;
}): Promise<AdminSettingsSnapshot | null> {
  const [
    organization,
    adminUserCount,
    connectorHealthRecords,
    recentSyncRunRecords,
    savedSearchRecords,
    failedImportReviews,
    recalibrationOpportunities,
  ] = await Promise.all([
    db.organization.findUnique({
      where: {
        id: organizationId,
      },
      ...organizationSettingsSnapshotArgs,
    }),
    db.user.count({
      where: {
        organizationId,
        roles: {
          some: {
            role: {
              key: "admin",
            },
          },
        },
      },
    }),
    db.sourceConnectorConfig.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        sourceDisplayName: "asc",
      },
      ...sourceConnectorHealthArgs,
    }),
    db.sourceSyncRun.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        requestedAt: "desc",
      },
      take: 8,
      ...recentSourceSyncRunArgs,
    }),
    db.sourceSavedSearch.findMany({
      where: {
        organizationId,
      },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      take: 8,
      ...adminSavedSearchArgs,
    }),
    db.sourceImportDecision.findMany({
      where: {
        organizationId,
        status: {
          not: "APPLIED",
        },
      },
      orderBy: {
        requestedAt: "desc",
      },
      take: 8,
      ...failedImportReviewArgs,
    }),
    db.opportunity.findMany({
      where: {
        organizationId,
        currentStageKey: {
          in: ["awarded", "lost", "no_bid"],
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      ...recalibrationOpportunityArgs,
    }),
  ]);

  if (!organization) {
    return null;
  }
  const agenciesById = new Map(
    organization.agencies.map((agency) => [
      agency.id,
      {
        id: agency.id,
        label: agency.organizationCode
          ? `${agency.name} (${agency.organizationCode})`
          : agency.name,
      },
    ]),
  );
  const scoringProfile = organization.organizationProfile
    ? (() => {
        const recalibration = buildScoringRecalibrationSnapshot({
          criteria: organization.organizationProfile.scoringCriteria.map(
            (criterion) => ({
              key: criterion.factorKey as OpportunityScoringFactorKey,
              label: criterion.factorLabel,
              description: criterion.description,
              weight: Number.parseFloat(criterion.weight.toString()),
            }),
          ),
          observations: recalibrationOpportunities
            .map(mapRecalibrationObservation)
            .filter(isDefined),
        });

        return {
          overview: organization.organizationProfile.overview,
          strategicFocus: organization.organizationProfile.strategicFocus,
          targetNaicsCodes: organization.organizationProfile.targetNaicsCodes,
          activeScoringModelKey:
            organization.organizationProfile.activeScoringModelKey,
          activeScoringModelVersion:
            organization.organizationProfile.activeScoringModelVersion,
          goRecommendationThreshold:
            organization.organizationProfile.goRecommendationThreshold.toString(),
          deferRecommendationThreshold:
            organization.organizationProfile.deferRecommendationThreshold.toString(),
          minimumRiskScorePercent:
            organization.organizationProfile.minimumRiskScorePercent.toString(),
          priorityAgencies: organization.organizationProfile.priorityAgencyIds
            .map((agencyId) => agenciesById.get(agencyId))
            .filter(isDefined),
          relationshipAgencies:
            organization.organizationProfile.relationshipAgencyIds
              .map((agencyId) => agenciesById.get(agencyId))
              .filter(isDefined),
          capabilities: organization.organizationProfile.capabilities.map(
            (capability) => ({
              id: capability.id,
              key: capability.capabilityKey,
              label: capability.capabilityLabel,
              category: capability.capabilityCategory,
              keywords: capability.capabilityKeywords,
              description: capability.description,
            }),
          ),
          certifications: organization.organizationProfile.certifications.map(
            (certification) => ({
              id: certification.id,
              key: certification.certificationKey,
              label: certification.certificationLabel,
              code: certification.certificationCode,
              issuingBody: certification.issuingBody,
              description: certification.description,
            }),
          ),
          selectedVehicles:
            organization.organizationProfile.selectedVehicles.map(
              (selectedVehicle) => ({
                id: selectedVehicle.vehicle.id,
                code: selectedVehicle.vehicle.code,
                name: selectedVehicle.vehicle.name,
                vehicleType: selectedVehicle.vehicle.vehicleType,
                awardingAgency: selectedVehicle.vehicle.awardingAgency,
                isPreferred: selectedVehicle.isPreferred,
                usageNotes: selectedVehicle.usageNotes,
              }),
            ),
          scoringCriteria: organization.organizationProfile.scoringCriteria.map(
            (criterion) => ({
              id: criterion.id,
              key: criterion.factorKey,
              label: criterion.factorLabel,
              description: criterion.description,
              weight: criterion.weight.toString(),
              isActive: criterion.isActive,
            }),
          ),
          recalibration,
        };
      })()
    : null;

  const sourceOperations = buildAdminSourceOperationsSnapshot({
    connectorHealthRecords:
      connectorHealthRecords as AdminSourceConnectorHealthRecord[],
    failedImportDecisionRecords:
      failedImportReviews as AdminFailedImportDecisionRecord[],
    recentSyncRunRecords:
      recentSyncRunRecords as AdminRecentSourceSyncRunRecord[],
  });
  const savedSearches = savedSearchRecords.map(mapAdminSavedSearchSummary);

  return {
    organizationId: organization.id,
    organizationName: organization.name,
    totalUserCount: organization._count.users,
    adminUserCount,
    totalAuditLogCount: organization._count.auditLogs,
    scoringProfileSummary: scoringProfile
      ? {
          activeScoringModelKey: scoringProfile.activeScoringModelKey,
          activeScoringModelVersion: scoringProfile.activeScoringModelVersion,
          capabilityCount: scoringProfile.capabilities.length,
          scoringCriteriaCount: scoringProfile.scoringCriteria.length,
        }
      : null,
    sourceOperationsSummary: {
      totalConnectorCount: sourceOperations.totalConnectorCount,
      activeConnectorCount: sourceOperations.activeConnectorCount,
      healthyConnectorCount: sourceOperations.healthyConnectorCount,
      rateLimitedConnectorCount: sourceOperations.rateLimitedConnectorCount,
      failedImportReviewCount: sourceOperations.failedImportReviewCount,
      lastSuccessfulSyncAt: sourceOperations.lastSuccessfulSyncAt,
      lastSuccessfulSyncSourceDisplayName:
        sourceOperations.lastSuccessfulSyncSourceDisplayName,
    },
    savedSearchCount: savedSearches.length,
    scoringProfile,
    sourceOperations,
    savedSearches,
    recentAuditEvents: organization.auditLogs.map(mapAuditEventSummary),
  };
}

export async function getAdminSettingsOverviewSnapshot({
  db,
  organizationId,
}: {
  db: AdminRepositoryClient;
  organizationId: string;
}): Promise<AdminSettingsOverviewSnapshot | null> {
  const [
    organization,
    adminUserCount,
    connectorHealthRecords,
    recentSyncRunRecords,
    failedImportReviews,
    savedSearchCount,
  ] = await Promise.all([
    db.organization.findUnique({
      where: {
        id: organizationId,
      },
      select: {
        id: true,
        name: true,
        organizationProfile: {
          select: {
            activeScoringModelKey: true,
            activeScoringModelVersion: true,
            capabilities: {
              where: {
                isActive: true,
              },
              select: {
                id: true,
              },
            },
            scoringCriteria: {
              where: {
                isActive: true,
              },
              select: {
                id: true,
              },
            },
          },
        },
        _count: {
          select: {
            users: true,
            auditLogs: true,
          },
        },
      },
    }),
    db.user.count({
      where: {
        organizationId,
        roles: {
          some: {
            role: {
              key: "admin",
            },
          },
        },
      },
    }),
    db.sourceConnectorConfig.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        sourceDisplayName: "asc",
      },
      ...sourceConnectorHealthArgs,
    }),
    db.sourceSyncRun.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        requestedAt: "desc",
      },
      take: 8,
      ...recentSourceSyncRunArgs,
    }),
    db.sourceImportDecision.findMany({
      where: {
        organizationId,
        status: {
          not: "APPLIED",
        },
      },
      orderBy: {
        requestedAt: "desc",
      },
      take: 8,
      ...failedImportReviewArgs,
    }),
    db.sourceSavedSearch.count({
      where: {
        organizationId,
      },
    }),
  ]);

  if (!organization) {
    return null;
  }

  const sourceOperations = buildAdminSourceOperationsSnapshot({
    connectorHealthRecords:
      connectorHealthRecords as AdminSourceConnectorHealthRecord[],
    failedImportDecisionRecords:
      failedImportReviews as AdminFailedImportDecisionRecord[],
    recentSyncRunRecords:
      recentSyncRunRecords as AdminRecentSourceSyncRunRecord[],
  });

  return {
    organizationId: organization.id,
    organizationName: organization.name,
    totalUserCount: organization._count.users,
    adminUserCount,
    totalAuditLogCount: organization._count.auditLogs,
    scoringProfileSummary: organization.organizationProfile
      ? {
          activeScoringModelKey:
            organization.organizationProfile.activeScoringModelKey,
          activeScoringModelVersion:
            organization.organizationProfile.activeScoringModelVersion,
          capabilityCount: organization.organizationProfile.capabilities.length,
          scoringCriteriaCount:
            organization.organizationProfile.scoringCriteria.length,
        }
      : null,
    sourceOperationsSummary: {
      totalConnectorCount: sourceOperations.totalConnectorCount,
      activeConnectorCount: sourceOperations.activeConnectorCount,
      healthyConnectorCount: sourceOperations.healthyConnectorCount,
      rateLimitedConnectorCount: sourceOperations.rateLimitedConnectorCount,
      failedImportReviewCount: sourceOperations.failedImportReviewCount,
      lastSuccessfulSyncAt: sourceOperations.lastSuccessfulSyncAt,
      lastSuccessfulSyncSourceDisplayName:
        sourceOperations.lastSuccessfulSyncSourceDisplayName,
    },
    savedSearchCount,
  };
}

export async function getAdminConnectorSettingsSnapshot({
  db,
  organizationId,
}: {
  db: AdminRepositoryClient;
  organizationId: string;
}): Promise<AdminConnectorSettingsSnapshot | null> {
  const [
    organization,
    connectorHealthRecords,
    recentSyncRunRecords,
    failedImportReviews,
  ] = await Promise.all([
    db.organization.findUnique({
      where: {
        id: organizationId,
      },
      select: {
        id: true,
        name: true,
      },
    }),
    db.sourceConnectorConfig.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        sourceDisplayName: "asc",
      },
      ...sourceConnectorHealthArgs,
    }),
    db.sourceSyncRun.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        requestedAt: "desc",
      },
      take: 8,
      ...recentSourceSyncRunArgs,
    }),
    db.sourceImportDecision.findMany({
      where: {
        organizationId,
        status: {
          not: "APPLIED",
        },
      },
      orderBy: {
        requestedAt: "desc",
      },
      take: 8,
      ...failedImportReviewArgs,
    }),
  ]);

  if (!organization) {
    return null;
  }

  return {
    organizationId: organization.id,
    organizationName: organization.name,
    sourceOperations: buildAdminSourceOperationsSnapshot({
      connectorHealthRecords:
        connectorHealthRecords as AdminSourceConnectorHealthRecord[],
      failedImportDecisionRecords:
        failedImportReviews as AdminFailedImportDecisionRecord[],
      recentSyncRunRecords:
        recentSyncRunRecords as AdminRecentSourceSyncRunRecord[],
    }),
  };
}

export async function getAdminSavedSearchSettingsSnapshot({
  db,
  organizationId,
}: {
  db: AdminRepositoryClient;
  organizationId: string;
}): Promise<AdminSavedSearchSettingsSnapshot | null> {
  const [organization, savedSearchRecords] = await Promise.all([
    db.organization.findUnique({
      where: {
        id: organizationId,
      },
      select: {
        id: true,
        name: true,
      },
    }),
    db.sourceSavedSearch.findMany({
      where: {
        organizationId,
      },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      ...adminSavedSearchArgs,
    }),
  ]);

  if (!organization) {
    return null;
  }

  return {
    organizationId: organization.id,
    organizationName: organization.name,
    savedSearches: savedSearchRecords.map(mapAdminSavedSearchSummary),
  };
}

export async function getAdminScoringSettingsSnapshot({
  db,
  organizationId,
}: {
  db: AdminRepositoryClient;
  organizationId: string;
}): Promise<AdminScoringSettingsSnapshot | null> {
  const snapshot = await getAdminSettingsSnapshot({ db, organizationId });

  if (!snapshot) {
    return null;
  }

  return {
    organizationId: snapshot.organizationId,
    organizationName: snapshot.organizationName,
    scoringProfile: snapshot.scoringProfile,
  };
}

export async function getAdminAuditSettingsSnapshot({
  db,
  organizationId,
}: {
  db: AdminRepositoryClient;
  organizationId: string;
}): Promise<AdminAuditSettingsSnapshot | null> {
  const organization = await db.organization.findUnique({
    where: {
      id: organizationId,
    },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          auditLogs: true,
        },
      },
      auditLogs: {
        orderBy: {
          occurredAt: "desc",
        },
        take: 24,
        ...auditLogSummaryArgs,
      },
    },
  });

  if (!organization) {
    return null;
  }

  return {
    organizationId: organization.id,
    organizationName: organization.name,
    totalAuditLogCount: organization._count.auditLogs,
    recentAuditEvents: organization.auditLogs.map(mapAuditEventSummary),
  };
}

export async function getAdminUserManagementSnapshot({
  db,
  organizationId,
}: {
  db: AdminRepositoryClient;
  organizationId: string;
}): Promise<AdminUserManagementSnapshot | null> {
  const organization = await db.organization.findUnique({
    where: {
      id: organizationId,
    },
    ...organizationUserManagementSnapshotArgs,
  });

  if (!organization) {
    return null;
  }

  const users = organization.users.map(mapAdminUserSummary);

  return {
    organizationId: organization.id,
    organizationName: organization.name,
    totalUserCount: users.length,
    activeUserCount: users.filter((user) => user.status === "ACTIVE").length,
    invitedUserCount: users.filter((user) => user.status === "INVITED").length,
    disabledUserCount: users.filter((user) => user.status === "DISABLED")
      .length,
    adminUserCount: users.filter((user) => user.roleKeys.includes("admin"))
      .length,
    roleOptions: organization.roles.map((role) => ({
      key: role.key,
      label: role.name,
      description: role.description,
    })),
    users,
  };
}

function mapAdminSavedSearchSummary(savedSearch: AdminSavedSearchPayload) {
  return {
    id: savedSearch.id,
    name: savedSearch.name,
    description: savedSearch.description,
    sourceSystem: savedSearch.sourceSystem,
    sourceDisplayName:
      savedSearch.connectorConfig?.sourceDisplayName ??
      humanizeSourceSystem(savedSearch.sourceSystem),
    connectorVersion: savedSearch.connectorConfig?.connectorVersion ?? null,
    createdByLabel:
      savedSearch.createdByUser?.name ??
      savedSearch.createdByUser?.email ??
      "Unknown owner",
    createdAt: savedSearch.createdAt.toISOString(),
    updatedAt: savedSearch.updatedAt.toISOString(),
    lastExecutedAt: savedSearch.lastExecutedAt?.toISOString() ?? null,
    lastSyncedAt: savedSearch.lastSyncedAt?.toISOString() ?? null,
    filterSummary: buildSavedSearchFilterSummary(savedSearch),
  };
}

function mapAdminUserSummary(
  user: OrganizationUserManagementRecord["users"][number],
) {
  const roles = user.roles.map((assignment) => ({
    key: assignment.role.key,
    label: assignment.role.name,
    assignedAt: assignment.assignedAt.toISOString(),
  }));
  const latestRoleAssignedAt = roles.reduce<string | null>((latest, role) => {
    if (!latest || role.assignedAt > latest) {
      return role.assignedAt;
    }

    return latest;
  }, null);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    status: user.status,
    latestRoleAssignedAt,
    roleKeys: roles.map((role) => role.key),
    roleLabels: roles.map((role) => role.label),
    roles,
  };
}

function mapAuditEventSummary(auditLog: AuditLogSummaryPayload) {
  return {
    id: auditLog.id,
    occurredAt: auditLog.occurredAt.toISOString(),
    action: auditLog.action,
    actionLabel: formatAuditActionLabel(auditLog.action),
    actorType: auditLog.actorType,
    actorLabel:
      auditLog.actorUser?.name ??
      auditLog.actorUser?.email ??
      auditLog.actorIdentifier ??
      formatEnumLabel(auditLog.actorType),
    targetLabel:
      auditLog.targetDisplay ??
      auditLog.targetId ??
      formatEnumLabel(auditLog.targetType),
    targetType: auditLog.targetType,
    summary: auditLog.summary,
    metadataPreview: formatAuditMetadataPreview(auditLog.metadata),
  };
}

function mapRecalibrationObservation(
  opportunity: RecalibrationOpportunityPayload,
): ScoringRecalibrationObservation | undefined {
  const scorecard = opportunity.scorecards[0];
  const outcomeKey = resolveRecalibrationOutcomeKey(opportunity);

  if (!scorecard || !outcomeKey) {
    return undefined;
  }

  const finalDecision = opportunity.bidDecisions[0]?.finalOutcome ?? null;
  const recommendationOutcome =
    opportunity.bidDecisions[0]?.recommendationOutcome ?? null;

  return {
    opportunityId: opportunity.id,
    opportunityTitle: opportunity.title,
    outcomeKey,
    scorePercent:
      scorecard.scorePercent === null
        ? null
        : Number.parseFloat(scorecard.scorePercent.toString()),
    recommendationAligned:
      finalDecision === null || recommendationOutcome === null
        ? null
        : finalDecision === recommendationOutcome,
    factorPercents: Object.fromEntries(
      scorecard.factorScores.map((factor) => [
        factor.factorKey,
        factor.maximumScore &&
        Number.parseFloat(factor.maximumScore.toString()) > 0
          ? Number.parseFloat(
              (
                (Number.parseFloat(factor.score?.toString() ?? "0") /
                  Number.parseFloat(factor.maximumScore.toString())) *
                100
              ).toFixed(2),
            )
          : null,
      ]),
    ),
  };
}

function buildSavedSearchFilterSummary(savedSearch: AdminSavedSearchPayload) {
  const filters = savedSearch.canonicalFilters;

  if (!filters || typeof filters !== "object" || Array.isArray(filters)) {
    return [];
  }

  const summary: string[] = [];
  const record = filters as Record<string, unknown>;
  const keywords = readJsonString(record.keywords);
  const naicsCode = readJsonString(record.naicsCode);
  const organizationCode = readJsonString(record.organizationCode);
  const organizationName = readJsonString(record.organizationName);
  const status = readJsonString(record.status);
  const procurementTypes = readJsonStringArray(record.procurementTypes);
  const postedDateFrom = readJsonString(record.postedDateFrom);
  const postedDateTo = readJsonString(record.postedDateTo);

  if (keywords) {
    summary.push(`Keywords: ${keywords}`);
  }

  if (naicsCode) {
    summary.push(`NAICS ${naicsCode}`);
  }

  if (organizationCode || organizationName) {
    summary.push(
      organizationCode
        ? `Agency ${organizationCode}`
        : `Agency ${organizationName}`,
    );
  }

  if (status) {
    summary.push(`Status ${status}`);
  }

  if (procurementTypes.length > 0) {
    summary.push(`Types ${procurementTypes.join(", ")}`);
  }

  if (postedDateFrom && postedDateTo) {
    summary.push(`Posted ${postedDateFrom} to ${postedDateTo}`);
  }

  return summary.slice(0, 4);
}

function readJsonString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function readJsonStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}

function humanizeSourceSystem(value: string) {
  return value
    .split("_")
    .map((segment) => `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`)
    .join(" ");
}

function resolveRecalibrationOutcomeKey(
  opportunity: RecalibrationOpportunityPayload,
): ScoringRecalibrationOutcomeKey | null {
  const closeoutOutcomeStageKey =
    opportunity.closeouts[0]?.outcomeStageKey ?? null;
  const stageKey = closeoutOutcomeStageKey ?? opportunity.currentStageKey;

  switch (stageKey) {
    case "awarded":
      return "awarded";
    case "lost":
      return "lost";
    case "no_bid":
      return "no_bid";
    default:
      return null;
  }
}

function formatAuditActionLabel(action: string) {
  return action
    .split(".")
    .filter(Boolean)
    .map((segment) => formatEnumLabel(segment))
    .join(" / ");
}

function formatEnumLabel(value: string) {
  return value
    .split(/[_\s-]+/g)
    .filter(Boolean)
    .map(
      (segment) =>
        segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase(),
    )
    .join(" ");
}

function formatAuditMetadataPreview(metadata: Prisma.JsonValue | null) {
  if (metadata === null) {
    return null;
  }

  const serialized = JSON.stringify(metadata);

  if (!serialized) {
    return null;
  }

  return serialized.length > 280
    ? `${serialized.slice(0, 277)}...`
    : serialized;
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}
