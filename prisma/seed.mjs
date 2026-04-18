import {
  AuditActorType,
  OrganizationStatus,
  PrismaClient,
  UserStatus,
} from "@prisma/client";

import { buildOpportunitySeedScenario } from "./opportunity-seed-scenarios.mjs";
import { SYSTEM_ROLE_DEFINITIONS } from "./system-roles.mjs";
import { LOCAL_DEMO_PASSWORD_HASH } from "../src/lib/auth/local-demo-auth.mjs";
import { runDeadlineReminderSweep } from "../scripts/deadline-reminder-job.mjs";

const prisma = new PrismaClient();

async function upsertSearchExecution({
  organizationId,
  savedSearchId,
  requestedByUserId,
  sourceConnectorConfigId,
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
    sourceConnectorConfigId,
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
  sourceConnectorConfigId,
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
    sourceConnectorConfigId,
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

async function syncSourceRecordChildren({
  sourceRecordId,
  attachments,
  contacts,
  award,
}) {
  await prisma.sourceRecordAttachment.deleteMany({
    where: { sourceRecordId },
  });

  if (attachments.length > 0) {
    await prisma.sourceRecordAttachment.createMany({
      data: attachments.map((attachment) => ({
        sourceRecordId,
        externalId: attachment.externalId ?? null,
        url: attachment.url,
        linkType: attachment.linkType,
        displayLabel: attachment.displayLabel ?? null,
        mimeType: attachment.mimeType ?? null,
        sourceFileName: attachment.sourceFileName ?? null,
        fileSizeBytes: attachment.fileSizeBytes ?? null,
        sortOrder: attachment.sortOrder ?? 0,
        metadata: attachment.metadata ?? null,
      })),
    });
  }

  await prisma.sourceRecordContact.deleteMany({
    where: { sourceRecordId },
  });

  if (contacts.length > 0) {
    await prisma.sourceRecordContact.createMany({
      data: contacts.map((contact) => ({
        sourceRecordId,
        contactType: contact.contactType ?? null,
        fullName: contact.fullName ?? null,
        title: contact.title ?? null,
        email: contact.email ?? null,
        phone: contact.phone ?? null,
        fax: contact.fax ?? null,
        additionalInfoText: contact.additionalInfoText ?? null,
        sortOrder: contact.sortOrder ?? 0,
      })),
    });
  }

  if (award) {
    await prisma.sourceRecordAward.upsert({
      where: { sourceRecordId },
      update: {
        awardNumber: award.awardNumber ?? null,
        awardAmount: award.awardAmount ?? null,
        awardDate: award.awardDate ? new Date(award.awardDate) : null,
        awardeeName: award.awardeeName ?? null,
        awardeeUEI: award.awardeeUEI ?? null,
        awardeeStreet1: award.awardeeStreet1 ?? null,
        awardeeStreet2: award.awardeeStreet2 ?? null,
        awardeeCityCode: award.awardeeCityCode ?? null,
        awardeeCityName: award.awardeeCityName ?? null,
        awardeeStateCode: award.awardeeStateCode ?? null,
        awardeeStateName: award.awardeeStateName ?? null,
        awardeePostalCode: award.awardeePostalCode ?? null,
        awardeeCountryCode: award.awardeeCountryCode ?? null,
        awardeeCountryName: award.awardeeCountryName ?? null,
      },
      create: {
        sourceRecordId,
        awardNumber: award.awardNumber ?? null,
        awardAmount: award.awardAmount ?? null,
        awardDate: award.awardDate ? new Date(award.awardDate) : null,
        awardeeName: award.awardeeName ?? null,
        awardeeUEI: award.awardeeUEI ?? null,
        awardeeStreet1: award.awardeeStreet1 ?? null,
        awardeeStreet2: award.awardeeStreet2 ?? null,
        awardeeCityCode: award.awardeeCityCode ?? null,
        awardeeCityName: award.awardeeCityName ?? null,
        awardeeStateCode: award.awardeeStateCode ?? null,
        awardeeStateName: award.awardeeStateName ?? null,
        awardeePostalCode: award.awardeePostalCode ?? null,
        awardeeCountryCode: award.awardeeCountryCode ?? null,
        awardeeCountryName: award.awardeeCountryName ?? null,
      },
    });
  } else {
    await prisma.sourceRecordAward.deleteMany({
      where: { sourceRecordId },
    });
  }
}

async function upsertImportDecision({
  organizationId,
  sourceConnectorConfigId,
  sourceRecordId,
  targetOpportunityId,
  requestedByUserId,
  decidedByUserId,
  decision,
}) {
  const requestedAt = new Date(decision.requestedAt);
  const existingDecision = await prisma.sourceImportDecision.findFirst({
    where: {
      organizationId,
      sourceRecordId,
      mode: decision.mode,
      requestedAt,
    },
  });

  const data = {
    organizationId,
    sourceConnectorConfigId,
    sourceRecordId,
    targetOpportunityId,
    requestedByUserId,
    decidedByUserId,
    requestedByActorType: decision.requestedByActorType,
    mode: decision.mode,
    status: decision.status,
    rationale: decision.rationale ?? null,
    decisionMetadata: decision.decisionMetadata ?? null,
    importPreviewPayload: decision.importPreviewPayload ?? null,
    requestedAt,
    decidedAt: decision.decidedAt ? new Date(decision.decidedAt) : null,
  };

  if (existingDecision) {
    return prisma.sourceImportDecision.update({
      where: { id: existingDecision.id },
      data,
    });
  }

  return prisma.sourceImportDecision.create({ data });
}

function buildOpportunityWriteData({
  organizationId,
  leadAgencyId,
  importedFromSourceRecordId = null,
  opportunity,
}) {
  return {
    organizationId,
    leadAgencyId,
    importedFromSourceRecordId,
    originSourceSystem: opportunity.originSourceSystem ?? null,
    title: opportunity.title,
    description: opportunity.description ?? null,
    externalNoticeId: opportunity.externalNoticeId ?? null,
    solicitationNumber: opportunity.solicitationNumber ?? null,
    sourceSummaryText: opportunity.sourceSummaryText ?? null,
    sourceSummaryUrl: opportunity.sourceSummaryUrl ?? null,
    postedAt: opportunity.postedAt ? new Date(opportunity.postedAt) : null,
    postedDateRaw: opportunity.postedDateRaw ?? null,
    responseDeadlineAt: opportunity.responseDeadlineAt
      ? new Date(opportunity.responseDeadlineAt)
      : null,
    responseDeadlineRaw: opportunity.responseDeadlineRaw ?? null,
    procurementTypeLabel: opportunity.procurementTypeLabel ?? null,
    procurementBaseTypeLabel: opportunity.procurementBaseTypeLabel ?? null,
    archiveType: opportunity.archiveType ?? null,
    archivedAt: opportunity.archivedAt ? new Date(opportunity.archivedAt) : null,
    archiveDateRaw: opportunity.archiveDateRaw ?? null,
    sourceStatus: opportunity.sourceStatus ?? null,
    isActiveSourceRecord: opportunity.isActiveSourceRecord ?? true,
    isArchivedSourceRecord: opportunity.isArchivedSourceRecord ?? false,
    setAsideCode: opportunity.setAsideCode ?? null,
    setAsideDescription: opportunity.setAsideDescription ?? null,
    naicsCode: opportunity.naicsCode ?? null,
    classificationCode: opportunity.classificationCode ?? null,
    organizationType: opportunity.organizationType ?? null,
    officeCity: opportunity.officeCity ?? null,
    officeState: opportunity.officeState ?? null,
    officePostalCode: opportunity.officePostalCode ?? null,
    officeCountryCode: opportunity.officeCountryCode ?? null,
    placeOfPerformanceStreet1: opportunity.placeOfPerformanceStreet1 ?? null,
    placeOfPerformanceStreet2: opportunity.placeOfPerformanceStreet2 ?? null,
    placeOfPerformanceCityCode: opportunity.placeOfPerformanceCityCode ?? null,
    placeOfPerformanceCityName: opportunity.placeOfPerformanceCityName ?? null,
    placeOfPerformanceStateCode:
      opportunity.placeOfPerformanceStateCode ?? null,
    placeOfPerformanceStateName:
      opportunity.placeOfPerformanceStateName ?? null,
    placeOfPerformancePostalCode:
      opportunity.placeOfPerformancePostalCode ?? null,
    placeOfPerformanceCountryCode:
      opportunity.placeOfPerformanceCountryCode ?? null,
    additionalInfoUrl: opportunity.additionalInfoUrl ?? null,
    uiLink: opportunity.uiLink ?? null,
    apiSelfLink: opportunity.apiSelfLink ?? null,
    currentStageKey: opportunity.currentStageKey ?? null,
    currentStageLabel: opportunity.currentStageLabel ?? null,
    currentStageChangedAt: opportunity.currentStageChangedAt
      ? new Date(opportunity.currentStageChangedAt)
      : null,
  };
}

async function syncOpportunityVehicles({
  opportunityId,
  opportunityTitle,
  vehicleKeys,
  vehiclesByKey,
}) {
  await prisma.opportunityVehicle.deleteMany({
    where: { opportunityId },
  });

  for (const [index, vehicleKey] of vehicleKeys.entries()) {
    const vehicle = vehiclesByKey.get(vehicleKey);

    if (!vehicle) {
      throw new Error(`Missing seeded vehicle for key ${vehicleKey}`);
    }

    await prisma.opportunityVehicle.create({
      data: {
        opportunityId,
        vehicleId: vehicle.id,
        isPrimary: index === 0,
        notes:
          index === 0
            ? `Primary pursuit vehicle for ${opportunityTitle}.`
            : `Secondary vehicle coverage retained for ${opportunityTitle}.`,
      },
    });
  }
}

async function syncOpportunityCompetitors({
  opportunityId,
  competitorLinks,
  competitorsByKey,
}) {
  await prisma.opportunityCompetitor.deleteMany({
    where: { opportunityId },
  });

  for (const competitorLink of competitorLinks) {
    const competitor = competitorsByKey.get(competitorLink.competitorKey);

    if (!competitor) {
      throw new Error(
        `Missing seeded competitor for key ${competitorLink.competitorKey}`,
      );
    }

    await prisma.opportunityCompetitor.create({
      data: {
        opportunityId,
        competitorId: competitor.id,
        role: competitorLink.role,
        notes: competitorLink.notes,
      },
    });
  }
}

async function syncOpportunityWorkspace({
  organizationId,
  opportunityId,
  primarySourceRecordId,
  primaryImportDecisionId,
  userId,
  userEmail,
  usersByKey,
  workspace,
}) {
  await prisma.opportunityActivityEvent.deleteMany({
    where: { opportunityId },
  });
  await prisma.bidDecision.deleteMany({
    where: { opportunityId },
  });
  await prisma.opportunityScorecard.deleteMany({
    where: { opportunityId },
  });
  await prisma.opportunityStageTransition.deleteMany({
    where: { opportunityId },
  });
  await prisma.opportunityDocument.deleteMany({
    where: { opportunityId },
  });
  await prisma.opportunityNote.deleteMany({
    where: { opportunityId },
  });
  await prisma.opportunityMilestone.deleteMany({
    where: { opportunityId },
  });
  await prisma.opportunityTask.deleteMany({
    where: { opportunityId },
  });

  const relatedEntityIdsByRef = new Map([
    ["primary-source-record", primarySourceRecordId],
    ["primary-import-decision", primaryImportDecisionId],
  ]);

  for (const task of workspace.tasks) {
    const assigneeUser = task.assigneeUserKey
      ? usersByKey.get(task.assigneeUserKey) ?? null
      : null;

    const createdTask = await prisma.opportunityTask.create({
      data: {
        organizationId,
        opportunityId,
        createdByUserId: userId,
        assigneeUserId: assigneeUser?.id ?? userId,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueAt: task.dueAt ? new Date(task.dueAt) : null,
        startedAt: task.startedAt ? new Date(task.startedAt) : null,
        completedAt: task.completedAt ? new Date(task.completedAt) : null,
        sortOrder: task.sortOrder ?? 0,
        metadata: task.metadata ?? null,
      },
    });

    relatedEntityIdsByRef.set(task.key, createdTask.id);
  }

  for (const milestone of workspace.milestones) {
    const createdMilestone = await prisma.opportunityMilestone.create({
      data: {
        organizationId,
        opportunityId,
        createdByUserId: userId,
        title: milestone.title,
        description: milestone.description ?? null,
        milestoneTypeKey: milestone.milestoneTypeKey ?? null,
        status: milestone.status,
        targetDate: new Date(milestone.targetDate),
        completedAt: milestone.completedAt
          ? new Date(milestone.completedAt)
          : null,
        sortOrder: milestone.sortOrder ?? 0,
        metadata: milestone.metadata ?? null,
      },
    });

    relatedEntityIdsByRef.set(milestone.key, createdMilestone.id);
  }

  for (const note of workspace.notes) {
    const createdNote = await prisma.opportunityNote.create({
      data: {
        organizationId,
        opportunityId,
        authorUserId: userId,
        title: note.title ?? null,
        body: note.body,
        contentFormat: note.contentFormat ?? "markdown",
        isPinned: note.isPinned ?? false,
      },
    });

    relatedEntityIdsByRef.set(note.key, createdNote.id);
  }

  for (const document of workspace.documents) {
    const sourceRecordId =
      document.sourceRecordRef === "primary-source-record"
        ? primarySourceRecordId
        : null;

    const createdDocument = await prisma.opportunityDocument.create({
      data: {
        organizationId,
        opportunityId,
        sourceRecordId,
        uploadedByUserId: userId,
        title: document.title,
        documentType: document.documentType ?? null,
        sourceType: document.sourceType,
        sourceUrl: document.sourceUrl ?? null,
        originalFileName: document.originalFileName ?? null,
        storageProvider: document.storageProvider ?? null,
        storagePath: document.storagePath ?? null,
        mimeType: document.mimeType ?? null,
        fileSizeBytes: document.fileSizeBytes ?? null,
        checksumSha256: document.checksumSha256 ?? null,
        extractedText: document.extractedText ?? null,
        extractionStatus: document.extractionStatus,
        extractedAt: document.extractedAt ? new Date(document.extractedAt) : null,
        metadata: document.metadata ?? null,
      },
    });

    relatedEntityIdsByRef.set(document.key, createdDocument.id);
  }

  for (const transition of workspace.stageTransitions) {
    const createdTransition = await prisma.opportunityStageTransition.create({
      data: {
        organizationId,
        opportunityId,
        actorUserId: userId,
        triggerType: transition.triggerType,
        fromStageKey: transition.fromStageKey ?? null,
        fromStageLabel: transition.fromStageLabel ?? null,
        toStageKey: transition.toStageKey,
        toStageLabel: transition.toStageLabel ?? null,
        rationale: transition.rationale ?? null,
        requiredFieldsSnapshot: transition.requiredFieldsSnapshot ?? null,
        metadata: transition.metadata ?? null,
        transitionedAt: new Date(transition.transitionedAt),
      },
    });

    relatedEntityIdsByRef.set(transition.key, createdTransition.id);
  }

  const scorecard = await prisma.opportunityScorecard.create({
    data: {
      organizationId,
      opportunityId,
      calculatedByUserId: userId,
      scoringModelKey: workspace.scorecard.scoringModelKey ?? null,
      scoringModelVersion: workspace.scorecard.scoringModelVersion ?? null,
      totalScore: workspace.scorecard.totalScore ?? null,
      maximumScore: workspace.scorecard.maximumScore ?? null,
      scorePercent: workspace.scorecard.scorePercent ?? null,
      recommendationOutcome: workspace.scorecard.recommendationOutcome ?? null,
      recommendationSummary: workspace.scorecard.recommendationSummary ?? null,
      summary: workspace.scorecard.summary ?? null,
      inputSnapshot: workspace.scorecard.inputSnapshot ?? null,
      isCurrent: true,
      calculatedAt: new Date(workspace.scorecard.calculatedAt),
      factorScores: {
        create: workspace.scorecard.factors.map((factor) => ({
          factorKey: factor.key,
          factorLabel: factor.label,
          weight: factor.weight ?? null,
          score: factor.score ?? null,
          maximumScore: factor.maximumScore ?? null,
          explanation: factor.explanation ?? null,
          factorMetadata: factor.factorMetadata ?? null,
          sortOrder: factor.sortOrder ?? 0,
        })),
      },
    },
  });

  relatedEntityIdsByRef.set("primary-scorecard", scorecard.id);

  const bidDecision = await prisma.bidDecision.create({
    data: {
      organizationId,
      opportunityId,
      scorecardId: scorecard.id,
      recommendedByUserId:
        workspace.bidDecision.recommendedByActorType === AuditActorType.USER
          ? userId
          : null,
      decidedByUserId: userId,
      decisionTypeKey: workspace.bidDecision.decisionTypeKey ?? null,
      recommendationOutcome: workspace.bidDecision.recommendationOutcome ?? null,
      recommendationSummary: workspace.bidDecision.recommendationSummary ?? null,
      recommendationMetadata:
        workspace.bidDecision.recommendationMetadata ?? null,
      recommendedByActorType: workspace.bidDecision.recommendedByActorType,
      recommendedByIdentifier:
        workspace.bidDecision.recommendedByIdentifier ?? null,
      recommendedAt: workspace.bidDecision.recommendedAt
        ? new Date(workspace.bidDecision.recommendedAt)
        : null,
      finalOutcome: workspace.bidDecision.finalOutcome ?? null,
      finalRationale: workspace.bidDecision.finalRationale ?? null,
      decisionMetadata: workspace.bidDecision.decisionMetadata ?? null,
      decidedAt: workspace.bidDecision.decidedAt
        ? new Date(workspace.bidDecision.decidedAt)
        : null,
      isCurrent: true,
    },
  });

  relatedEntityIdsByRef.set("initial-pursuit-decision", bidDecision.id);

  for (const event of workspace.activityEvents) {
    const relatedEntityId = event.relatedEntityRef
      ? relatedEntityIdsByRef.get(event.relatedEntityRef) ?? null
      : null;

    await prisma.opportunityActivityEvent.create({
      data: {
        organizationId,
        opportunityId,
        actorUserId: event.actorType === AuditActorType.USER ? userId : null,
        actorType: event.actorType,
        actorIdentifier:
          event.actorType === AuditActorType.USER
            ? userEmail
            : event.actorIdentifier ?? null,
        eventType: event.eventType,
        title: event.title,
        description: event.description ?? null,
        relatedEntityType: event.relatedEntityType ?? null,
        relatedEntityId,
        metadata: event.metadata ?? null,
        occurredAt: new Date(event.occurredAt),
      },
    });
  }
}

async function syncKnowledgeAssets({
  knowledgeAssets,
  organizationId,
  usersByKey,
}) {
  await prisma.knowledgeAsset.deleteMany({
    where: { organizationId },
  });

  const opportunities = await prisma.opportunity.findMany({
    where: { organizationId },
    select: {
      id: true,
      title: true,
    },
  });
  const opportunitiesByTitle = new Map(
    opportunities.map((opportunity) => [opportunity.title, opportunity]),
  );

  for (const asset of knowledgeAssets) {
    const author = usersByKey.get(asset.authorUserKey);

    if (!author) {
      throw new Error(`Missing seeded knowledge asset author ${asset.authorUserKey}`);
    }

    const linkedOpportunities = asset.linkedOpportunityTitles.map((title) => {
      const opportunity = opportunitiesByTitle.get(title);

      if (!opportunity) {
        throw new Error(`Missing seeded opportunity for knowledge asset link ${title}`);
      }

      return opportunity;
    });

    await prisma.knowledgeAsset.create({
      data: {
        organizationId,
        createdByUserId: author.id,
        updatedByUserId: author.id,
        assetType: asset.assetType,
        title: asset.title,
        summary: asset.summary,
        body: asset.body,
        contentFormat: "markdown",
        tags: {
          create: asset.tags.map((tag) => ({
            organizationId,
            label: tag,
            normalizedLabel: tag.trim().toLowerCase(),
          })),
        },
        linkedOpportunities: {
          create: linkedOpportunities.map((opportunity) => ({
            organizationId,
            opportunityId: opportunity.id,
          })),
        },
      },
    });
  }
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

  const rolesByKey = new Map();

  for (const role of SYSTEM_ROLE_DEFINITIONS) {
    const persistedRole = await prisma.role.upsert({
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

    rolesByKey.set(role.key, persistedRole);
  }

  const usersByKey = new Map();

  for (const teamMember of scenario.teamMembers) {
    const persistedUser = await prisma.user.upsert({
      where: { email: teamMember.email },
      update: {
        organizationId: organization.id,
        name: teamMember.name,
        passwordHash: LOCAL_DEMO_PASSWORD_HASH,
        status: UserStatus.ACTIVE,
      },
      create: {
        organizationId: organization.id,
        email: teamMember.email,
        name: teamMember.name,
        passwordHash: LOCAL_DEMO_PASSWORD_HASH,
        status: UserStatus.ACTIVE,
      },
    });

    usersByKey.set(teamMember.key, persistedUser);

    for (const roleKey of teamMember.roleKeys) {
      const role = rolesByKey.get(roleKey);

      if (!role) {
        throw new Error(`Missing seeded role for key ${roleKey}`);
      }

      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: persistedUser.id,
            roleId: role.id,
          },
        },
        update: {},
        create: {
          userId: persistedUser.id,
          roleId: role.id,
        },
      });
    }
  }

  const adminUser = usersByKey.get("alex-morgan");

  if (!adminUser) {
    throw new Error("Missing seeded admin user alex-morgan");
  }

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

  const scoringProfile = scenario.organizationScoringProfile;
  const priorityAgencyIds = scoringProfile.priorityAgencyKeys.map((agencyKey) => {
    const agency = agenciesByKey.get(agencyKey);

    if (!agency) {
      throw new Error(`Missing seeded priority agency for key ${agencyKey}`);
    }

    return agency.id;
  });
  const relationshipAgencyIds = scoringProfile.relationshipAgencyKeys.map(
    (agencyKey) => {
      const agency = agenciesByKey.get(agencyKey);

      if (!agency) {
        throw new Error(`Missing seeded relationship agency for key ${agencyKey}`);
      }

      return agency.id;
    },
  );

  const organizationProfile = await prisma.organizationProfile.upsert({
    where: {
      organizationId: organization.id,
    },
    update: {
      overview: scoringProfile.overview,
      strategicFocus: scoringProfile.strategicFocus,
      targetNaicsCodes: scoringProfile.targetNaicsCodes,
      priorityAgencyIds,
      relationshipAgencyIds,
      activeScoringModelKey: scoringProfile.activeScoringModelKey,
      activeScoringModelVersion: scoringProfile.activeScoringModelVersion,
      goRecommendationThreshold: scoringProfile.goRecommendationThreshold,
      deferRecommendationThreshold:
        scoringProfile.deferRecommendationThreshold,
      minimumRiskScorePercent: scoringProfile.minimumRiskScorePercent,
    },
    create: {
      organizationId: organization.id,
      overview: scoringProfile.overview,
      strategicFocus: scoringProfile.strategicFocus,
      targetNaicsCodes: scoringProfile.targetNaicsCodes,
      priorityAgencyIds,
      relationshipAgencyIds,
      activeScoringModelKey: scoringProfile.activeScoringModelKey,
      activeScoringModelVersion: scoringProfile.activeScoringModelVersion,
      goRecommendationThreshold: scoringProfile.goRecommendationThreshold,
      deferRecommendationThreshold:
        scoringProfile.deferRecommendationThreshold,
      minimumRiskScorePercent: scoringProfile.minimumRiskScorePercent,
    },
  });

  await prisma.organizationCapability.deleteMany({
    where: {
      organizationProfileId: organizationProfile.id,
    },
  });
  await prisma.organizationCertification.deleteMany({
    where: {
      organizationProfileId: organizationProfile.id,
    },
  });
  await prisma.organizationProfileVehicle.deleteMany({
    where: {
      organizationProfileId: organizationProfile.id,
    },
  });
  await prisma.organizationScoringCriterion.deleteMany({
    where: {
      organizationProfileId: organizationProfile.id,
    },
  });

  await prisma.organizationCapability.createMany({
    data: scoringProfile.capabilities.map((capability, index) => ({
      organizationId: organization.id,
      organizationProfileId: organizationProfile.id,
      capabilityKey: capability.key,
      capabilityLabel: capability.label,
      capabilityCategory: capability.category ?? null,
      capabilityKeywords: capability.keywords,
      description: capability.description ?? null,
      sortOrder: index,
      isActive: true,
    })),
  });

  await prisma.organizationCertification.createMany({
    data: scoringProfile.certifications.map((certification, index) => ({
      organizationId: organization.id,
      organizationProfileId: organizationProfile.id,
      certificationKey: certification.key,
      certificationLabel: certification.label,
      certificationCode: certification.code ?? null,
      issuingBody: certification.issuingBody ?? null,
      description: certification.description ?? null,
      sortOrder: index,
      isActive: true,
    })),
  });

  for (const [index, vehicleKey] of scoringProfile.selectedVehicleKeys.entries()) {
    const vehicle = vehiclesByKey.get(vehicleKey);

    if (!vehicle) {
      throw new Error(`Missing seeded scoring vehicle for key ${vehicleKey}`);
    }

    await prisma.organizationProfileVehicle.create({
      data: {
        organizationProfileId: organizationProfile.id,
        organizationId: organization.id,
        vehicleId: vehicle.id,
        isPreferred: index === 0,
        usageNotes:
          index === 0
            ? "Default preferred vehicle for high-fit pursuits."
            : "Retained as active vehicle coverage for scoring and down-select.",
        sortOrder: index,
      },
    });
  }

  await prisma.organizationScoringCriterion.createMany({
    data: scoringProfile.scoringCriteria.map((criterion, index) => ({
      organizationId: organization.id,
      organizationProfileId: organizationProfile.id,
      factorKey: criterion.key,
      factorLabel: criterion.label,
      description: criterion.description ?? null,
      weight: criterion.weight,
      sortOrder: index,
      isActive: true,
    })),
  });

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

  const connectorConfigsByKey = new Map();

  for (const connectorConfig of scenario.connectorConfigs) {
    const persistedConnectorConfig = await prisma.sourceConnectorConfig.upsert({
      where: {
        organizationId_sourceSystemKey: {
          organizationId: organization.id,
          sourceSystemKey: connectorConfig.sourceSystemKey,
        },
      },
      update: {
        sourceDisplayName: connectorConfig.sourceDisplayName,
        sourceCategory: connectorConfig.sourceCategory,
        authType: connectorConfig.authType,
        isEnabled: connectorConfig.isEnabled,
        supportsSearch: connectorConfig.supportsSearch,
        supportsScheduledSync: connectorConfig.supportsScheduledSync,
        supportsDetailFetch: connectorConfig.supportsDetailFetch,
        supportsDocumentFetch: connectorConfig.supportsDocumentFetch,
        supportsResultPreview: connectorConfig.supportsResultPreview,
        supportsSavedSearches: connectorConfig.supportsSavedSearches,
        supportsIncrementalSync: connectorConfig.supportsIncrementalSync,
        supportsWebhooks: connectorConfig.supportsWebhooks,
        supportsAttachments: connectorConfig.supportsAttachments,
        supportsAwardData: connectorConfig.supportsAwardData,
        defaultPageSize: connectorConfig.defaultPageSize,
        maxPageSize: connectorConfig.maxPageSize,
        rateLimitProfile: connectorConfig.rateLimitProfile,
        credentialReference: connectorConfig.credentialReference,
        configData: connectorConfig.configData,
        connectorVersion: connectorConfig.connectorVersion,
        validationStatus: connectorConfig.validationStatus,
        lastValidatedAt: connectorConfig.lastValidatedAt
          ? new Date(connectorConfig.lastValidatedAt)
          : null,
        lastValidationMessage: connectorConfig.lastValidationMessage ?? null,
      },
      create: {
        organizationId: organization.id,
        sourceSystemKey: connectorConfig.sourceSystemKey,
        sourceDisplayName: connectorConfig.sourceDisplayName,
        sourceCategory: connectorConfig.sourceCategory,
        authType: connectorConfig.authType,
        isEnabled: connectorConfig.isEnabled,
        supportsSearch: connectorConfig.supportsSearch,
        supportsScheduledSync: connectorConfig.supportsScheduledSync,
        supportsDetailFetch: connectorConfig.supportsDetailFetch,
        supportsDocumentFetch: connectorConfig.supportsDocumentFetch,
        supportsResultPreview: connectorConfig.supportsResultPreview,
        supportsSavedSearches: connectorConfig.supportsSavedSearches,
        supportsIncrementalSync: connectorConfig.supportsIncrementalSync,
        supportsWebhooks: connectorConfig.supportsWebhooks,
        supportsAttachments: connectorConfig.supportsAttachments,
        supportsAwardData: connectorConfig.supportsAwardData,
        defaultPageSize: connectorConfig.defaultPageSize,
        maxPageSize: connectorConfig.maxPageSize,
        rateLimitProfile: connectorConfig.rateLimitProfile,
        credentialReference: connectorConfig.credentialReference,
        configData: connectorConfig.configData,
        connectorVersion: connectorConfig.connectorVersion,
        validationStatus: connectorConfig.validationStatus,
        lastValidatedAt: connectorConfig.lastValidatedAt
          ? new Date(connectorConfig.lastValidatedAt)
          : null,
        lastValidationMessage: connectorConfig.lastValidationMessage ?? null,
      },
    });

    connectorConfigsByKey.set(
      connectorConfig.sourceSystemKey,
      persistedConnectorConfig,
    );
  }

  const samGovConnectorConfig = connectorConfigsByKey.get(
    scenario.sourceSavedSearch.connectorKey,
  );

  if (!samGovConnectorConfig) {
    throw new Error("Missing seeded connector config for sam_gov");
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
      sourceConnectorConfigId: samGovConnectorConfig.id,
      description: scenario.sourceSavedSearch.description,
      canonicalFilters: scenario.sourceSavedSearch.canonicalFilters,
      sourceSpecificFilters: scenario.sourceSavedSearch.sourceSpecificFilters,
      lastExecutedAt: new Date(scenario.sourceSearchExecution.completedAt),
      lastSyncedAt: new Date(scenario.sourceSyncRun.completedAt),
    },
    create: {
      organizationId: organization.id,
      createdByUserId: adminUser.id,
      sourceConnectorConfigId: samGovConnectorConfig.id,
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
    sourceConnectorConfigId: samGovConnectorConfig.id,
    execution: {
      ...scenario.sourceSearchExecution,
      sourceSystem: scenario.sourceSavedSearch.sourceSystem,
    },
  });

  const failedSearchExecution = await upsertSearchExecution({
    organizationId: organization.id,
    savedSearchId: savedSearch.id,
    requestedByUserId: null,
    sourceConnectorConfigId: samGovConnectorConfig.id,
    execution: {
      ...scenario.failedSourceSearchExecution,
      sourceSystem: scenario.sourceSavedSearch.sourceSystem,
    },
  });

  const syncRun = await upsertSyncRun({
    organizationId: organization.id,
    savedSearchId: savedSearch.id,
    searchExecutionId: searchExecution.id,
    requestedByUserId: adminUser.id,
    sourceConnectorConfigId: samGovConnectorConfig.id,
    syncRun: scenario.sourceSyncRun,
    sourceSystem: scenario.sourceSavedSearch.sourceSystem,
  });

  await upsertSyncRun({
    organizationId: organization.id,
    savedSearchId: savedSearch.id,
    searchExecutionId: failedSearchExecution.id,
    requestedByUserId: null,
    sourceConnectorConfigId: samGovConnectorConfig.id,
    syncRun: scenario.failedSourceSyncRun,
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
      sourceConnectorConfigId: samGovConnectorConfig.id,
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
      sourceConnectorConfigId: samGovConnectorConfig.id,
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

  await syncSourceRecordChildren({
    sourceRecordId: sourceRecord.id,
    attachments: scenario.sourceRecord.attachments,
    contacts: scenario.sourceRecord.contacts,
    award: null,
  });

  const importedOpportunityData = buildOpportunityWriteData({
    organizationId: organization.id,
    leadAgencyId: sourceAgency?.id ?? null,
    importedFromSourceRecordId: sourceRecord.id,
    opportunity: scenario.importedOpportunity,
  });

  const importedOpportunity = await prisma.opportunity.upsert({
    where: {
      importedFromSourceRecordId: sourceRecord.id,
    },
    update: importedOpportunityData,
    create: importedOpportunityData,
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

  const primaryImportDecision = await upsertImportDecision({
    organizationId: organization.id,
    sourceConnectorConfigId: samGovConnectorConfig.id,
    sourceRecordId: sourceRecord.id,
    targetOpportunityId: importedOpportunity.id,
    requestedByUserId: adminUser.id,
    decidedByUserId: adminUser.id,
    decision: scenario.sourceImportDecision,
  });

  await upsertImportDecision({
    organizationId: organization.id,
    sourceConnectorConfigId: samGovConnectorConfig.id,
    sourceRecordId: sourceRecord.id,
    targetOpportunityId: importedOpportunity.id,
    requestedByUserId: adminUser.id,
    decidedByUserId: adminUser.id,
    decision: scenario.rejectedSourceImportDecision,
  });

  await syncOpportunityVehicles({
    opportunityId: importedOpportunity.id,
    opportunityTitle: importedOpportunity.title,
    vehicleKeys: scenario.importedOpportunity.vehicleKeys,
    vehiclesByKey,
  });

  await syncOpportunityCompetitors({
    opportunityId: importedOpportunity.id,
    competitorLinks: scenario.importedOpportunity.competitorLinks,
    competitorsByKey,
  });

  const secondaryScenario = scenario.secondarySourceScenario;
  const usaspendingConnectorConfig = connectorConfigsByKey.get(
    secondaryScenario.sourceSavedSearch.connectorKey,
  );

  if (!usaspendingConnectorConfig) {
    throw new Error("Missing seeded connector config for usaspending_api");
  }

  const secondarySavedSearch = await prisma.sourceSavedSearch.upsert({
    where: {
      organizationId_sourceSystem_name: {
        organizationId: organization.id,
        sourceSystem: secondaryScenario.sourceSavedSearch.sourceSystem,
        name: secondaryScenario.sourceSavedSearch.name,
      },
    },
    update: {
      createdByUserId: adminUser.id,
      sourceConnectorConfigId: usaspendingConnectorConfig.id,
      description: secondaryScenario.sourceSavedSearch.description,
      canonicalFilters: secondaryScenario.sourceSavedSearch.canonicalFilters,
      sourceSpecificFilters:
        secondaryScenario.sourceSavedSearch.sourceSpecificFilters,
      lastExecutedAt: new Date(
        secondaryScenario.sourceSearchExecution.completedAt,
      ),
      lastSyncedAt: new Date(secondaryScenario.sourceSyncRun.completedAt),
    },
    create: {
      organizationId: organization.id,
      createdByUserId: adminUser.id,
      sourceConnectorConfigId: usaspendingConnectorConfig.id,
      sourceSystem: secondaryScenario.sourceSavedSearch.sourceSystem,
      name: secondaryScenario.sourceSavedSearch.name,
      description: secondaryScenario.sourceSavedSearch.description,
      canonicalFilters: secondaryScenario.sourceSavedSearch.canonicalFilters,
      sourceSpecificFilters:
        secondaryScenario.sourceSavedSearch.sourceSpecificFilters,
      lastExecutedAt: new Date(
        secondaryScenario.sourceSearchExecution.completedAt,
      ),
      lastSyncedAt: new Date(secondaryScenario.sourceSyncRun.completedAt),
    },
  });

  const secondarySearchExecution = await upsertSearchExecution({
    organizationId: organization.id,
    savedSearchId: secondarySavedSearch.id,
    requestedByUserId: adminUser.id,
    sourceConnectorConfigId: usaspendingConnectorConfig.id,
    execution: {
      ...secondaryScenario.sourceSearchExecution,
      sourceSystem: secondaryScenario.sourceSavedSearch.sourceSystem,
    },
  });

  const secondarySyncRun = await upsertSyncRun({
    organizationId: organization.id,
    savedSearchId: secondarySavedSearch.id,
    searchExecutionId: secondarySearchExecution.id,
    requestedByUserId: adminUser.id,
    sourceConnectorConfigId: usaspendingConnectorConfig.id,
    syncRun: secondaryScenario.sourceSyncRun,
    sourceSystem: secondaryScenario.sourceSavedSearch.sourceSystem,
  });

  const secondaryAgency = agenciesByKey.get(
    secondaryScenario.sourceRecord.agencyKey,
  );

  const secondarySourceRecord = await prisma.sourceRecord.upsert({
    where: {
      organizationId_sourceSystem_sourceRecordId: {
        organizationId: organization.id,
        sourceSystem: secondaryScenario.sourceRecord.sourceSystem,
        sourceRecordId: secondaryScenario.sourceRecord.sourceRecordId,
      },
    },
    update: {
      opportunityId: importedOpportunity.id,
      agencyId: secondaryAgency?.id ?? null,
      sourceImportActorUserId: adminUser.id,
      sourceConnectorConfigId: usaspendingConnectorConfig.id,
      sourceApiEndpoint: secondaryScenario.sourceRecord.sourceApiEndpoint,
      sourceUiUrl: secondaryScenario.sourceRecord.sourceUiUrl,
      sourceDetailUrl: secondaryScenario.sourceRecord.sourceDetailUrl,
      sourceDescriptionUrl: secondaryScenario.sourceRecord.sourceDescriptionUrl,
      sourceFetchedAt: new Date(secondaryScenario.sourceRecord.sourceFetchedAt),
      sourceSearchExecutedAt: new Date(
        secondaryScenario.sourceRecord.sourceSearchExecutedAt,
      ),
      sourceSearchQuery: secondaryScenario.sourceRecord.sourceSearchQuery,
      sourceRawPayload: secondaryScenario.sourceRecord.sourceRawPayload,
      sourceNormalizedPayload:
        secondaryScenario.sourceRecord.sourceNormalizedPayload,
      sourceImportPreviewPayload:
        secondaryScenario.sourceRecord.sourceImportPreviewPayload,
      sourceNormalizationVersion:
        secondaryScenario.sourceRecord.sourceNormalizationVersion,
      sourceNormalizationAppliedAt: new Date(
        secondaryScenario.sourceRecord.sourceNormalizationAppliedAt,
      ),
      sourceRawPostedDate: secondaryScenario.sourceRecord.sourceRawPostedDate,
      sourceRawResponseDeadline:
        secondaryScenario.sourceRecord.sourceRawResponseDeadline,
      sourceRawArchiveDate: secondaryScenario.sourceRecord.sourceRawArchiveDate,
      sourceStatusRaw: secondaryScenario.sourceRecord.sourceStatusRaw,
      sourceImportMethod: secondaryScenario.sourceRecord.sourceImportMethod,
      sourceImportActorType:
        secondaryScenario.sourceRecord.sourceImportActorType,
      sourceImportActorIdentifier: adminUser.email,
      sourceHashFingerprint:
        secondaryScenario.sourceRecord.sourceHashFingerprint,
    },
    create: {
      organizationId: organization.id,
      opportunityId: importedOpportunity.id,
      agencyId: secondaryAgency?.id ?? null,
      sourceImportActorUserId: adminUser.id,
      sourceConnectorConfigId: usaspendingConnectorConfig.id,
      sourceSystem: secondaryScenario.sourceRecord.sourceSystem,
      sourceRecordId: secondaryScenario.sourceRecord.sourceRecordId,
      sourceApiEndpoint: secondaryScenario.sourceRecord.sourceApiEndpoint,
      sourceUiUrl: secondaryScenario.sourceRecord.sourceUiUrl,
      sourceDetailUrl: secondaryScenario.sourceRecord.sourceDetailUrl,
      sourceDescriptionUrl: secondaryScenario.sourceRecord.sourceDescriptionUrl,
      sourceFetchedAt: new Date(secondaryScenario.sourceRecord.sourceFetchedAt),
      sourceSearchExecutedAt: new Date(
        secondaryScenario.sourceRecord.sourceSearchExecutedAt,
      ),
      sourceSearchQuery: secondaryScenario.sourceRecord.sourceSearchQuery,
      sourceRawPayload: secondaryScenario.sourceRecord.sourceRawPayload,
      sourceNormalizedPayload:
        secondaryScenario.sourceRecord.sourceNormalizedPayload,
      sourceImportPreviewPayload:
        secondaryScenario.sourceRecord.sourceImportPreviewPayload,
      sourceNormalizationVersion:
        secondaryScenario.sourceRecord.sourceNormalizationVersion,
      sourceNormalizationAppliedAt: new Date(
        secondaryScenario.sourceRecord.sourceNormalizationAppliedAt,
      ),
      sourceRawPostedDate: secondaryScenario.sourceRecord.sourceRawPostedDate,
      sourceRawResponseDeadline:
        secondaryScenario.sourceRecord.sourceRawResponseDeadline,
      sourceRawArchiveDate: secondaryScenario.sourceRecord.sourceRawArchiveDate,
      sourceStatusRaw: secondaryScenario.sourceRecord.sourceStatusRaw,
      sourceImportMethod: secondaryScenario.sourceRecord.sourceImportMethod,
      sourceImportActorType:
        secondaryScenario.sourceRecord.sourceImportActorType,
      sourceImportActorIdentifier: adminUser.email,
      sourceHashFingerprint:
        secondaryScenario.sourceRecord.sourceHashFingerprint,
    },
  });

  await syncSourceRecordChildren({
    sourceRecordId: secondarySourceRecord.id,
    attachments: secondaryScenario.sourceRecord.attachments,
    contacts: secondaryScenario.sourceRecord.contacts,
    award: secondaryScenario.sourceRecord.award,
  });

  await prisma.sourceSearchResult.upsert({
    where: {
      searchExecutionId_sourceRecordId: {
        searchExecutionId: secondarySearchExecution.id,
        sourceRecordId: secondarySourceRecord.id,
      },
    },
    update: {
      resultRank: secondaryScenario.sourceRecord.searchResult.resultRank,
    },
    create: {
      searchExecutionId: secondarySearchExecution.id,
      sourceRecordId: secondarySourceRecord.id,
      resultRank: secondaryScenario.sourceRecord.searchResult.resultRank,
    },
  });

  await prisma.sourceSyncRunRecord.upsert({
    where: {
      syncRunId_sourceRecordId: {
        syncRunId: secondarySyncRun.id,
        sourceRecordId: secondarySourceRecord.id,
      },
    },
    update: {
      syncAction: secondaryScenario.sourceRecord.syncRecord.syncAction,
      errorMessage: null,
    },
    create: {
      syncRunId: secondarySyncRun.id,
      sourceRecordId: secondarySourceRecord.id,
      syncAction: secondaryScenario.sourceRecord.syncRecord.syncAction,
      errorMessage: null,
    },
  });

  await upsertImportDecision({
    organizationId: organization.id,
    sourceConnectorConfigId: usaspendingConnectorConfig.id,
    sourceRecordId: secondarySourceRecord.id,
    targetOpportunityId: importedOpportunity.id,
    requestedByUserId: adminUser.id,
    decidedByUserId: adminUser.id,
    decision: secondaryScenario.sourceImportDecision,
  });

  await syncOpportunityWorkspace({
    organizationId: organization.id,
    opportunityId: importedOpportunity.id,
    primarySourceRecordId: sourceRecord.id,
    primaryImportDecisionId: primaryImportDecision.id,
    userId: adminUser.id,
    userEmail: adminUser.email,
    usersByKey,
    workspace: scenario.workspace,
  });

  for (const manualScenario of scenario.manualOpportunities) {
    const manualAgency = agenciesByKey.get(manualScenario.opportunity.agencyKey);
    const existingManualOpportunity = await prisma.opportunity.findFirst({
      where: {
        organizationId: organization.id,
        title: manualScenario.opportunity.title,
      },
    });

    const manualOpportunityData = buildOpportunityWriteData({
      organizationId: organization.id,
      leadAgencyId: manualAgency?.id ?? null,
      opportunity: manualScenario.opportunity,
    });

    const manualOpportunity = existingManualOpportunity
      ? await prisma.opportunity.update({
          where: { id: existingManualOpportunity.id },
          data: manualOpportunityData,
        })
      : await prisma.opportunity.create({
          data: manualOpportunityData,
        });

    await syncOpportunityVehicles({
      opportunityId: manualOpportunity.id,
      opportunityTitle: manualOpportunity.title,
      vehicleKeys: manualScenario.opportunity.vehicleKeys,
      vehiclesByKey,
    });

    await syncOpportunityCompetitors({
      opportunityId: manualOpportunity.id,
      competitorLinks: manualScenario.opportunity.competitorLinks,
      competitorsByKey,
    });

    await syncOpportunityWorkspace({
      organizationId: organization.id,
      opportunityId: manualOpportunity.id,
      primarySourceRecordId: null,
      primaryImportDecisionId: null,
      userId: adminUser.id,
      userEmail: adminUser.email,
      usersByKey,
      workspace: manualScenario.workspace,
    });
  }

  await syncKnowledgeAssets({
    knowledgeAssets: scenario.knowledgeAssets,
    organizationId: organization.id,
    usersByKey,
  });

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
        "Initialized baseline organization, connector metadata, and multi-source opportunity seed data.",
      metadata: {
        seededTeamMemberEmails: scenario.teamMembers.map((member) => member.email),
        seededAgencyCount: scenario.agencies.length,
        seededOpportunityCount: 1 + scenario.manualOpportunities.length,
        seededProfileCapabilityCount:
          scenario.organizationScoringProfile.capabilities.length,
        seededProfileCertificationCount:
          scenario.organizationScoringProfile.certifications.length,
        seededProfileVehicleCount:
          scenario.organizationScoringProfile.selectedVehicleKeys.length,
        seededScoringCriterionCount:
          scenario.organizationScoringProfile.scoringCriteria.length,
        seededKnowledgeAssetCount: scenario.knowledgeAssets.length,
        seededOpportunityTitles: [
          importedOpportunity.title,
          ...scenario.manualOpportunities.map(
            (manualScenario) => manualScenario.opportunity.title,
          ),
        ],
        roleKeys: SYSTEM_ROLE_DEFINITIONS.map((role) => role.key),
        seededOpportunityTitle: importedOpportunity.title,
        seededConnectorKeys: scenario.connectorConfigs.map(
          (connector) => connector.sourceSystemKey,
        ),
        seededPrimarySourceSystem: scenario.sourceRecord.sourceSystem,
        seededSecondarySourceSystem:
          secondaryScenario.sourceRecord.sourceSystem,
      },
    },
  });

  await runDeadlineReminderSweep({
    db: prisma,
    log: () => undefined,
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
