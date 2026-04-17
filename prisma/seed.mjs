import {
  AuditActorType,
  OrganizationStatus,
  PrismaClient,
  UserStatus,
} from "@prisma/client";

import { buildOpportunitySeedScenario } from "./opportunity-seed-scenarios.mjs";
import { SYSTEM_ROLE_DEFINITIONS } from "./system-roles.mjs";

const prisma = new PrismaClient();

async function upsertSearchExecution({
  organizationId,
  savedSearchId,
  requestedByUserId,
  execution,
}) {
  const requestedAt = new Date(execution.requestedAt);
  const existingExecution = await prisma.sourceSearchExecution.findFirst({
    where: {
      organizationId,
      savedSearchId,
      sourceSystem: execution.sourceSystem,
      requestedAt,
    },
  });

  const data = {
    organizationId,
    savedSearchId,
    requestedByUserId,
    requestedByActorType: execution.requestedByActorType,
    sourceSystem: execution.sourceSystem,
    status: execution.status,
    canonicalFilters: execution.canonicalFilters,
    sourceSpecificFilters: execution.sourceSpecificFilters,
    outboundRequest: execution.outboundRequest,
    httpStatus: execution.httpStatus,
    responseLatencyMs: execution.responseLatencyMs,
    resultCount: execution.resultCount,
    totalRecords: execution.totalRecords,
    connectorVersion: execution.connectorVersion,
    requestedAt,
    completedAt: execution.completedAt ? new Date(execution.completedAt) : null,
    errorCode: execution.errorCode ?? null,
    errorMessage: execution.errorMessage ?? null,
  };

  if (existingExecution) {
    return prisma.sourceSearchExecution.update({
      where: { id: existingExecution.id },
      data,
    });
  }

  return prisma.sourceSearchExecution.create({ data });
}

async function upsertSyncRun({
  organizationId,
  savedSearchId,
  searchExecutionId,
  requestedByUserId,
  syncRun,
  sourceSystem,
}) {
  const requestedAt = new Date(syncRun.requestedAt);
  const existingSyncRun = await prisma.sourceSyncRun.findFirst({
    where: {
      organizationId,
      savedSearchId,
      sourceSystem,
      requestedAt,
    },
  });

  const data = {
    organizationId,
    savedSearchId,
    searchExecutionId,
    requestedByUserId,
    requestedByActorType: syncRun.requestedByActorType,
    sourceSystem,
    triggerType: syncRun.triggerType,
    status: syncRun.status,
    recordsFetched: syncRun.recordsFetched,
    recordsImported: syncRun.recordsImported,
    recordsFailed: syncRun.recordsFailed,
    connectorVersion: syncRun.connectorVersion,
    requestedAt,
    startedAt: syncRun.startedAt ? new Date(syncRun.startedAt) : null,
    completedAt: syncRun.completedAt ? new Date(syncRun.completedAt) : null,
    errorCode: syncRun.errorCode ?? null,
    errorMessage: syncRun.errorMessage ?? null,
  };

  if (existingSyncRun) {
    return prisma.sourceSyncRun.update({
      where: { id: existingSyncRun.id },
      data,
    });
  }

  return prisma.sourceSyncRun.create({ data });
}

async function main() {
  const scenario = buildOpportunitySeedScenario();

  const organization = await prisma.organization.upsert({
    where: { slug: "default-org" },
    update: {
      name: "Default Organization",
      status: OrganizationStatus.ACTIVE,
    },
    create: {
      slug: "default-org",
      name: "Default Organization",
      status: OrganizationStatus.ACTIVE,
    },
  });

  for (const role of SYSTEM_ROLE_DEFINITIONS) {
    await prisma.role.upsert({
      where: {
        organizationId_key: {
          organizationId: organization.id,
          key: role.key,
        },
      },
      update: {
        name: role.name,
        description: role.description,
        isSystem: true,
      },
      create: {
        organizationId: organization.id,
        key: role.key,
        name: role.name,
        description: role.description,
        isSystem: true,
      },
    });
  }

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@onesource.local" },
    update: {
      organizationId: organization.id,
      name: "OneSource Admin",
      status: UserStatus.ACTIVE,
    },
    create: {
      organizationId: organization.id,
      email: "admin@onesource.local",
      name: "OneSource Admin",
      status: UserStatus.ACTIVE,
    },
  });

  const adminRole = await prisma.role.findUniqueOrThrow({
    where: {
      organizationId_key: {
        organizationId: organization.id,
        key: "admin",
      },
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  const agenciesByKey = new Map();

  for (const agency of scenario.agencies) {
    const persistedAgency = await prisma.agency.upsert({
      where: {
        organizationId_pathCode: {
          organizationId: organization.id,
          pathCode: agency.pathCode,
        },
      },
      update: {
        name: agency.name,
        organizationCode: agency.organizationCode,
        pathName: agency.pathName,
        departmentName: agency.departmentName,
        subtierName: agency.subtierName,
        officeName: agency.officeName,
        officeCity: agency.officeCity,
        officeState: agency.officeState,
        officePostalCode: agency.officePostalCode,
        officeCountryCode: agency.officeCountryCode,
      },
      create: {
        organizationId: organization.id,
        name: agency.name,
        organizationCode: agency.organizationCode,
        pathName: agency.pathName,
        pathCode: agency.pathCode,
        departmentName: agency.departmentName,
        subtierName: agency.subtierName,
        officeName: agency.officeName,
        officeCity: agency.officeCity,
        officeState: agency.officeState,
        officePostalCode: agency.officePostalCode,
        officeCountryCode: agency.officeCountryCode,
      },
    });

    agenciesByKey.set(agency.key, persistedAgency);
  }

  const vehiclesByKey = new Map();

  for (const vehicle of scenario.vehicles) {
    const persistedVehicle = await prisma.contractVehicle.upsert({
      where: {
        organizationId_code: {
          organizationId: organization.id,
          code: vehicle.code,
        },
      },
      update: {
        name: vehicle.name,
        vehicleType: vehicle.vehicleType,
        awardingAgency: vehicle.awardingAgency,
        notes: vehicle.notes,
      },
      create: {
        organizationId: organization.id,
        code: vehicle.code,
        name: vehicle.name,
        vehicleType: vehicle.vehicleType,
        awardingAgency: vehicle.awardingAgency,
        notes: vehicle.notes,
      },
    });

    vehiclesByKey.set(vehicle.key, persistedVehicle);
  }

  const competitorsByKey = new Map();

  for (const competitor of scenario.competitors) {
    const persistedCompetitor = await prisma.competitor.upsert({
      where: {
        organizationId_name: {
          organizationId: organization.id,
          name: competitor.name,
        },
      },
      update: {
        websiteUrl: competitor.websiteUrl,
        notes: competitor.notes,
      },
      create: {
        organizationId: organization.id,
        name: competitor.name,
        websiteUrl: competitor.websiteUrl,
        notes: competitor.notes,
      },
    });

    competitorsByKey.set(competitor.key, persistedCompetitor);
  }

  const savedSearch = await prisma.sourceSavedSearch.upsert({
    where: {
      organizationId_sourceSystem_name: {
        organizationId: organization.id,
        sourceSystem: scenario.sourceSavedSearch.sourceSystem,
        name: scenario.sourceSavedSearch.name,
      },
    },
    update: {
      createdByUserId: adminUser.id,
      description: scenario.sourceSavedSearch.description,
      canonicalFilters: scenario.sourceSavedSearch.canonicalFilters,
      sourceSpecificFilters: scenario.sourceSavedSearch.sourceSpecificFilters,
      lastExecutedAt: new Date(scenario.sourceSearchExecution.completedAt),
      lastSyncedAt: new Date(scenario.sourceSyncRun.completedAt),
    },
    create: {
      organizationId: organization.id,
      createdByUserId: adminUser.id,
      sourceSystem: scenario.sourceSavedSearch.sourceSystem,
      name: scenario.sourceSavedSearch.name,
      description: scenario.sourceSavedSearch.description,
      canonicalFilters: scenario.sourceSavedSearch.canonicalFilters,
      sourceSpecificFilters: scenario.sourceSavedSearch.sourceSpecificFilters,
      lastExecutedAt: new Date(scenario.sourceSearchExecution.completedAt),
      lastSyncedAt: new Date(scenario.sourceSyncRun.completedAt),
    },
  });

  const searchExecution = await upsertSearchExecution({
    organizationId: organization.id,
    savedSearchId: savedSearch.id,
    requestedByUserId: adminUser.id,
    execution: {
      ...scenario.sourceSearchExecution,
      sourceSystem: scenario.sourceSavedSearch.sourceSystem,
    },
  });

  const syncRun = await upsertSyncRun({
    organizationId: organization.id,
    savedSearchId: savedSearch.id,
    searchExecutionId: searchExecution.id,
    requestedByUserId: adminUser.id,
    syncRun: scenario.sourceSyncRun,
    sourceSystem: scenario.sourceSavedSearch.sourceSystem,
  });

  const sourceAgency = agenciesByKey.get(scenario.sourceRecord.agencyKey);

  const sourceRecord = await prisma.sourceRecord.upsert({
    where: {
      organizationId_sourceSystem_sourceRecordId: {
        organizationId: organization.id,
        sourceSystem: scenario.sourceRecord.sourceSystem,
        sourceRecordId: scenario.sourceRecord.sourceRecordId,
      },
    },
    update: {
      agencyId: sourceAgency?.id ?? null,
      sourceImportActorUserId: adminUser.id,
      sourceApiEndpoint: scenario.sourceRecord.sourceApiEndpoint,
      sourceUiUrl: scenario.sourceRecord.sourceUiUrl,
      sourceDetailUrl: scenario.sourceRecord.sourceDetailUrl,
      sourceDescriptionUrl: scenario.sourceRecord.sourceDescriptionUrl,
      sourceFetchedAt: new Date(scenario.sourceRecord.sourceFetchedAt),
      sourceSearchExecutedAt: new Date(
        scenario.sourceRecord.sourceSearchExecutedAt,
      ),
      sourceSearchQuery: scenario.sourceRecord.sourceSearchQuery,
      sourceRawPayload: scenario.sourceRecord.sourceRawPayload,
      sourceNormalizedPayload: scenario.sourceRecord.sourceNormalizedPayload,
      sourceImportPreviewPayload:
        scenario.sourceRecord.sourceImportPreviewPayload,
      sourceNormalizationVersion:
        scenario.sourceRecord.sourceNormalizationVersion,
      sourceNormalizationAppliedAt: new Date(
        scenario.sourceRecord.sourceNormalizationAppliedAt,
      ),
      sourceRawPostedDate: scenario.sourceRecord.sourceRawPostedDate,
      sourceRawResponseDeadline:
        scenario.sourceRecord.sourceRawResponseDeadline,
      sourceRawArchiveDate: scenario.sourceRecord.sourceRawArchiveDate,
      sourceStatusRaw: scenario.sourceRecord.sourceStatusRaw,
      sourceImportMethod: scenario.sourceRecord.sourceImportMethod,
      sourceImportActorType: scenario.sourceRecord.sourceImportActorType,
      sourceImportActorIdentifier: adminUser.email,
      sourceHashFingerprint: scenario.sourceRecord.sourceHashFingerprint,
    },
    create: {
      organizationId: organization.id,
      agencyId: sourceAgency?.id ?? null,
      sourceImportActorUserId: adminUser.id,
      sourceSystem: scenario.sourceRecord.sourceSystem,
      sourceRecordId: scenario.sourceRecord.sourceRecordId,
      sourceApiEndpoint: scenario.sourceRecord.sourceApiEndpoint,
      sourceUiUrl: scenario.sourceRecord.sourceUiUrl,
      sourceDetailUrl: scenario.sourceRecord.sourceDetailUrl,
      sourceDescriptionUrl: scenario.sourceRecord.sourceDescriptionUrl,
      sourceFetchedAt: new Date(scenario.sourceRecord.sourceFetchedAt),
      sourceSearchExecutedAt: new Date(
        scenario.sourceRecord.sourceSearchExecutedAt,
      ),
      sourceSearchQuery: scenario.sourceRecord.sourceSearchQuery,
      sourceRawPayload: scenario.sourceRecord.sourceRawPayload,
      sourceNormalizedPayload: scenario.sourceRecord.sourceNormalizedPayload,
      sourceImportPreviewPayload:
        scenario.sourceRecord.sourceImportPreviewPayload,
      sourceNormalizationVersion:
        scenario.sourceRecord.sourceNormalizationVersion,
      sourceNormalizationAppliedAt: new Date(
        scenario.sourceRecord.sourceNormalizationAppliedAt,
      ),
      sourceRawPostedDate: scenario.sourceRecord.sourceRawPostedDate,
      sourceRawResponseDeadline:
        scenario.sourceRecord.sourceRawResponseDeadline,
      sourceRawArchiveDate: scenario.sourceRecord.sourceRawArchiveDate,
      sourceStatusRaw: scenario.sourceRecord.sourceStatusRaw,
      sourceImportMethod: scenario.sourceRecord.sourceImportMethod,
      sourceImportActorType: scenario.sourceRecord.sourceImportActorType,
      sourceImportActorIdentifier: adminUser.email,
      sourceHashFingerprint: scenario.sourceRecord.sourceHashFingerprint,
    },
  });

  const importedOpportunity = await prisma.opportunity.upsert({
    where: {
      importedFromSourceRecordId: sourceRecord.id,
    },
    update: {
      organizationId: organization.id,
      leadAgencyId: sourceAgency?.id ?? null,
      originSourceSystem: scenario.importedOpportunity.originSourceSystem,
      title: scenario.importedOpportunity.title,
      description: scenario.importedOpportunity.description,
      externalNoticeId: scenario.importedOpportunity.externalNoticeId,
      solicitationNumber: scenario.importedOpportunity.solicitationNumber,
      sourceSummaryText: scenario.importedOpportunity.sourceSummaryText,
      sourceSummaryUrl: scenario.importedOpportunity.sourceSummaryUrl,
      postedAt: new Date(scenario.importedOpportunity.postedAt),
      postedDateRaw: scenario.importedOpportunity.postedDateRaw,
      responseDeadlineAt: new Date(
        scenario.importedOpportunity.responseDeadlineAt,
      ),
      responseDeadlineRaw: scenario.importedOpportunity.responseDeadlineRaw,
      procurementTypeLabel:
        scenario.importedOpportunity.procurementTypeLabel,
      procurementBaseTypeLabel:
        scenario.importedOpportunity.procurementBaseTypeLabel,
      archiveType: scenario.importedOpportunity.archiveType,
      archivedAt: scenario.importedOpportunity.archivedAt
        ? new Date(scenario.importedOpportunity.archivedAt)
        : null,
      archiveDateRaw: scenario.importedOpportunity.archiveDateRaw,
      sourceStatus: scenario.importedOpportunity.sourceStatus,
      isActiveSourceRecord: scenario.importedOpportunity.isActiveSourceRecord,
      isArchivedSourceRecord:
        scenario.importedOpportunity.isArchivedSourceRecord,
      setAsideCode: scenario.importedOpportunity.setAsideCode,
      setAsideDescription: scenario.importedOpportunity.setAsideDescription,
      naicsCode: scenario.importedOpportunity.naicsCode,
      classificationCode: scenario.importedOpportunity.classificationCode,
      organizationType: scenario.importedOpportunity.organizationType,
      officeCity: scenario.importedOpportunity.officeCity,
      officeState: scenario.importedOpportunity.officeState,
      officePostalCode: scenario.importedOpportunity.officePostalCode,
      officeCountryCode: scenario.importedOpportunity.officeCountryCode,
      placeOfPerformanceStreet1:
        scenario.importedOpportunity.placeOfPerformanceStreet1,
      placeOfPerformanceStreet2:
        scenario.importedOpportunity.placeOfPerformanceStreet2,
      placeOfPerformanceCityCode:
        scenario.importedOpportunity.placeOfPerformanceCityCode,
      placeOfPerformanceCityName:
        scenario.importedOpportunity.placeOfPerformanceCityName,
      placeOfPerformanceStateCode:
        scenario.importedOpportunity.placeOfPerformanceStateCode,
      placeOfPerformanceStateName:
        scenario.importedOpportunity.placeOfPerformanceStateName,
      placeOfPerformancePostalCode:
        scenario.importedOpportunity.placeOfPerformancePostalCode,
      placeOfPerformanceCountryCode:
        scenario.importedOpportunity.placeOfPerformanceCountryCode,
      additionalInfoUrl: scenario.importedOpportunity.additionalInfoUrl,
      uiLink: scenario.importedOpportunity.uiLink,
      apiSelfLink: scenario.importedOpportunity.apiSelfLink,
    },
    create: {
      organizationId: organization.id,
      leadAgencyId: sourceAgency?.id ?? null,
      importedFromSourceRecordId: sourceRecord.id,
      originSourceSystem: scenario.importedOpportunity.originSourceSystem,
      title: scenario.importedOpportunity.title,
      description: scenario.importedOpportunity.description,
      externalNoticeId: scenario.importedOpportunity.externalNoticeId,
      solicitationNumber: scenario.importedOpportunity.solicitationNumber,
      sourceSummaryText: scenario.importedOpportunity.sourceSummaryText,
      sourceSummaryUrl: scenario.importedOpportunity.sourceSummaryUrl,
      postedAt: new Date(scenario.importedOpportunity.postedAt),
      postedDateRaw: scenario.importedOpportunity.postedDateRaw,
      responseDeadlineAt: new Date(
        scenario.importedOpportunity.responseDeadlineAt,
      ),
      responseDeadlineRaw: scenario.importedOpportunity.responseDeadlineRaw,
      procurementTypeLabel:
        scenario.importedOpportunity.procurementTypeLabel,
      procurementBaseTypeLabel:
        scenario.importedOpportunity.procurementBaseTypeLabel,
      archiveType: scenario.importedOpportunity.archiveType,
      archivedAt: scenario.importedOpportunity.archivedAt
        ? new Date(scenario.importedOpportunity.archivedAt)
        : null,
      archiveDateRaw: scenario.importedOpportunity.archiveDateRaw,
      sourceStatus: scenario.importedOpportunity.sourceStatus,
      isActiveSourceRecord: scenario.importedOpportunity.isActiveSourceRecord,
      isArchivedSourceRecord:
        scenario.importedOpportunity.isArchivedSourceRecord,
      setAsideCode: scenario.importedOpportunity.setAsideCode,
      setAsideDescription: scenario.importedOpportunity.setAsideDescription,
      naicsCode: scenario.importedOpportunity.naicsCode,
      classificationCode: scenario.importedOpportunity.classificationCode,
      organizationType: scenario.importedOpportunity.organizationType,
      officeCity: scenario.importedOpportunity.officeCity,
      officeState: scenario.importedOpportunity.officeState,
      officePostalCode: scenario.importedOpportunity.officePostalCode,
      officeCountryCode: scenario.importedOpportunity.officeCountryCode,
      placeOfPerformanceStreet1:
        scenario.importedOpportunity.placeOfPerformanceStreet1,
      placeOfPerformanceStreet2:
        scenario.importedOpportunity.placeOfPerformanceStreet2,
      placeOfPerformanceCityCode:
        scenario.importedOpportunity.placeOfPerformanceCityCode,
      placeOfPerformanceCityName:
        scenario.importedOpportunity.placeOfPerformanceCityName,
      placeOfPerformanceStateCode:
        scenario.importedOpportunity.placeOfPerformanceStateCode,
      placeOfPerformanceStateName:
        scenario.importedOpportunity.placeOfPerformanceStateName,
      placeOfPerformancePostalCode:
        scenario.importedOpportunity.placeOfPerformancePostalCode,
      placeOfPerformanceCountryCode:
        scenario.importedOpportunity.placeOfPerformanceCountryCode,
      additionalInfoUrl: scenario.importedOpportunity.additionalInfoUrl,
      uiLink: scenario.importedOpportunity.uiLink,
      apiSelfLink: scenario.importedOpportunity.apiSelfLink,
    },
  });

  await prisma.sourceRecord.update({
    where: { id: sourceRecord.id },
    data: {
      opportunityId: importedOpportunity.id,
    },
  });

  await prisma.sourceSearchResult.upsert({
    where: {
      searchExecutionId_sourceRecordId: {
        searchExecutionId: searchExecution.id,
        sourceRecordId: sourceRecord.id,
      },
    },
    update: {
      resultRank: scenario.sourceRecord.searchResult.resultRank,
    },
    create: {
      searchExecutionId: searchExecution.id,
      sourceRecordId: sourceRecord.id,
      resultRank: scenario.sourceRecord.searchResult.resultRank,
    },
  });

  await prisma.sourceSyncRunRecord.upsert({
    where: {
      syncRunId_sourceRecordId: {
        syncRunId: syncRun.id,
        sourceRecordId: sourceRecord.id,
      },
    },
    update: {
      syncAction: scenario.sourceRecord.syncRecord.syncAction,
      errorMessage: null,
    },
    create: {
      syncRunId: syncRun.id,
      sourceRecordId: sourceRecord.id,
      syncAction: scenario.sourceRecord.syncRecord.syncAction,
      errorMessage: null,
    },
  });

  for (const vehicleKey of scenario.importedOpportunity.vehicleKeys) {
    const vehicle = vehiclesByKey.get(vehicleKey);

    if (!vehicle) {
      throw new Error(`Missing seeded vehicle for key ${vehicleKey}`);
    }

    await prisma.opportunityVehicle.upsert({
      where: {
        opportunityId_vehicleId: {
          opportunityId: importedOpportunity.id,
          vehicleId: vehicle.id,
        },
      },
      update: {
        isPrimary: vehicle.code === "OASIS-PLUS-UNR",
        notes:
          vehicle.code === "OASIS-PLUS-UNR"
            ? "Primary pursuit vehicle for the seeded imported opportunity."
            : "Secondary viable path if ordering guidance shifts.",
      },
      create: {
        opportunityId: importedOpportunity.id,
        vehicleId: vehicle.id,
        isPrimary: vehicle.code === "OASIS-PLUS-UNR",
        notes:
          vehicle.code === "OASIS-PLUS-UNR"
            ? "Primary pursuit vehicle for the seeded imported opportunity."
            : "Secondary viable path if ordering guidance shifts.",
      },
    });
  }

  for (const competitorLink of scenario.importedOpportunity.competitorLinks) {
    const competitor = competitorsByKey.get(competitorLink.competitorKey);

    if (!competitor) {
      throw new Error(
        `Missing seeded competitor for key ${competitorLink.competitorKey}`,
      );
    }

    await prisma.opportunityCompetitor.upsert({
      where: {
        opportunityId_competitorId: {
          opportunityId: importedOpportunity.id,
          competitorId: competitor.id,
        },
      },
      update: {
        role: competitorLink.role,
        notes: competitorLink.notes,
      },
      create: {
        opportunityId: importedOpportunity.id,
        competitorId: competitor.id,
        role: competitorLink.role,
        notes: competitorLink.notes,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      organizationId: organization.id,
      actorUserId: adminUser.id,
      actorType: AuditActorType.USER,
      actorIdentifier: adminUser.email,
      action: "seed.bootstrap",
      targetType: "organization",
      targetId: organization.id,
      targetDisplay: organization.name,
      summary:
        "Initialized baseline organization, roles, admin, and imported opportunity seed data.",
      metadata: {
        roleKeys: SYSTEM_ROLE_DEFINITIONS.map((role) => role.key),
        seededOpportunityTitle: importedOpportunity.title,
        seededSourceSystem: scenario.sourceRecord.sourceSystem,
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
