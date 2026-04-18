import { Prisma, type PrismaClient } from "@prisma/client";

import type { AdminWorkspaceSnapshot } from "./admin.types";
import {
  buildAdminSourceOperationsSnapshot,
  type AdminFailedImportDecisionRecord,
  type AdminRecentSourceSyncRunRecord,
  type AdminSourceConnectorHealthRecord,
} from "./source-operations";

const organizationAdminSnapshotArgs =
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
    users: {
      orderBy: {
        email: "asc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        roles: {
          orderBy: {
            role: {
              name: "asc",
            },
          },
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
    auditLogs: {
      orderBy: {
        occurredAt: "desc",
      },
      take: 12,
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

export type AdminRepositoryClient = Pick<
  PrismaClient,
  "organization" | "sourceConnectorConfig" | "sourceImportDecision" | "sourceSyncRun"
>;

export type OrganizationAdminRecord = Prisma.OrganizationGetPayload<
  typeof organizationAdminSnapshotArgs
>;
export type SourceConnectorHealthPayload = Prisma.SourceConnectorConfigGetPayload<
  typeof sourceConnectorHealthArgs
>;
export type RecentSourceSyncRunPayload = Prisma.SourceSyncRunGetPayload<
  typeof recentSourceSyncRunArgs
>;
export type FailedImportReviewPayload = Prisma.SourceImportDecisionGetPayload<
  typeof failedImportReviewArgs
>;

export async function getAdminWorkspaceSnapshot({
  db,
  organizationId,
}: {
  db: AdminRepositoryClient;
  organizationId: string;
}): Promise<AdminWorkspaceSnapshot | null> {
  const [organization, connectorHealthRecords, recentSyncRunRecords, failedImportReviews] =
    await Promise.all([
      db.organization.findUnique({
        where: {
          id: organizationId,
        },
        ...organizationAdminSnapshotArgs,
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

  const users = organization.users.map((user) => {
    const roles = user.roles.map((assignment) => ({
      key: assignment.role.key,
      label: assignment.role.name,
      assignedAt: assignment.assignedAt.toISOString(),
    }));

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      roleKeys: roles.map((role) => role.key),
      roleLabels: roles.map((role) => role.label),
      roles,
    };
  });

  const adminUserCount = users.filter((user) => user.roleKeys.includes("admin")).length;
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
    ? {
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
        relationshipAgencies: organization.organizationProfile.relationshipAgencyIds
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
        selectedVehicles: organization.organizationProfile.selectedVehicles.map(
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
      }
    : null;

  return {
    organizationId: organization.id,
    organizationName: organization.name,
    totalUserCount: organization._count.users,
    adminUserCount,
    totalAuditLogCount: organization._count.auditLogs,
    scoringProfile,
    sourceOperations: buildAdminSourceOperationsSnapshot({
      connectorHealthRecords:
        connectorHealthRecords as AdminSourceConnectorHealthRecord[],
      failedImportDecisionRecords:
        failedImportReviews as AdminFailedImportDecisionRecord[],
      recentSyncRunRecords: recentSyncRunRecords as AdminRecentSourceSyncRunRecord[],
    }),
    users,
    recentAuditEvents: organization.auditLogs.map((auditLog) => ({
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
    })),
  };
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
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
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

  return serialized.length > 280 ? `${serialized.slice(0, 277)}...` : serialized;
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}
