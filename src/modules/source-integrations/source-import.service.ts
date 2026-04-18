import {
  AuditActorType,
  Prisma,
  type SourceImportDecisionMode,
} from "@prisma/client";

import {
  AUDIT_ACTIONS,
  recordAuditEvent,
  type AuditActorContext,
  type AuditLogWriter,
} from "@/modules/audit/audit.service";

import {
  buildMockSamGovImportPreview,
  getMockSamGovSearchResultById,
  type MockSamGovImportPreview,
  type MockSamGovSearchResult,
} from "./source-search.service";

const DEFAULT_ORGANIZATION_SLUG = "default-org";
const IMPORT_MATCH_THRESHOLD = 60;

const organizationSourceImportArgs = {
  select: {
    id: true,
    name: true,
    slug: true,
    sourceConnectorConfigs: {
      orderBy: {
        sourceDisplayName: "asc",
      },
      select: {
        id: true,
        sourceSystemKey: true,
        sourceDisplayName: true,
        isEnabled: true,
        supportsResultPreview: true,
      },
    },
    opportunities: {
      orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
      select: {
        id: true,
        title: true,
        currentStageKey: true,
        currentStageLabel: true,
        externalNoticeId: true,
        solicitationNumber: true,
        naicsCode: true,
        originSourceSystem: true,
        responseDeadlineAt: true,
        leadAgency: {
          select: {
            name: true,
            organizationCode: true,
          },
        },
      },
    },
    sourceRecords: {
      select: {
        id: true,
        sourceSystem: true,
        sourceRecordId: true,
        opportunityId: true,
        opportunity: {
          select: {
            id: true,
            title: true,
            currentStageKey: true,
            currentStageLabel: true,
          },
        },
      },
    },
  },
};

type OrganizationSourceImportRecord = {
  id: string;
  name: string;
  slug: string;
  sourceConnectorConfigs: Array<{
    id: string;
    sourceSystemKey: string;
    sourceDisplayName: string;
    isEnabled: boolean;
    supportsResultPreview: boolean;
  }>;
  opportunities: Array<{
    id: string;
    title: string;
    currentStageKey: string | null;
    currentStageLabel: string | null;
    externalNoticeId: string | null;
    solicitationNumber: string | null;
    naicsCode: string | null;
    originSourceSystem: string | null;
    responseDeadlineAt: Date | null;
    leadAgency: {
      name: string;
      organizationCode: string | null;
    } | null;
  }>;
  sourceRecords: Array<{
    id: string;
    sourceSystem: string;
    sourceRecordId: string;
    opportunityId: string | null;
    opportunity: {
      id: string;
      title: string;
      currentStageKey: string | null;
      currentStageLabel: string | null;
    } | null;
  }>;
};

export type SourceImportRepositoryClient = SourceImportTransactionClient & {
  organization: {
    findUnique(args: {
      where: {
        slug: string;
      };
    } & typeof organizationSourceImportArgs): Promise<OrganizationSourceImportRecord | null>;
  };
  $transaction<T>(
    callback: (tx: SourceImportTransactionClient) => Promise<T>,
  ): Promise<T>;
};

type SourceImportTransactionClient = AuditLogWriter & {
  agency: {
    create(args: {
      data: Prisma.AgencyUncheckedCreateInput;
      select: {
        id: true;
      };
    }): Promise<{ id: string }>;
    findFirst(args: {
      where: Prisma.AgencyWhereInput;
      select: {
        id: true;
      };
    }): Promise<{ id: string } | null>;
  };
  sourceConnectorConfig: {
    findFirst(args: {
      where: {
        organizationId: string;
        sourceSystemKey: string;
      };
      select: {
        id: true;
        sourceDisplayName: true;
      };
    }): Promise<{
      id: string;
      sourceDisplayName: string;
    } | null>;
  };
  sourceRecord: {
    create(args: {
      data: Prisma.SourceRecordUncheckedCreateInput;
      select: {
        id: true;
        opportunityId: true;
      };
    }): Promise<{
      id: string;
      opportunityId: string | null;
    }>;
    findFirst(args: {
      where: {
        organizationId: string;
        sourceSystem: string;
        sourceRecordId: string;
      };
      select: {
        id: true;
        opportunityId: true;
      };
    }): Promise<{
      id: string;
      opportunityId: string | null;
    } | null>;
    update(args: {
      where: {
        id: string;
      };
      data: Prisma.SourceRecordUncheckedUpdateInput;
      select: {
        id: true;
        opportunityId: true;
      };
    }): Promise<{
      id: string;
      opportunityId: string | null;
    }>;
  };
  opportunity: {
    create(args: {
      data: Prisma.OpportunityUncheckedCreateInput;
      select: {
        id: true;
        title: true;
      };
    }): Promise<{
      id: string;
      title: string;
    }>;
    findFirst(args: {
      where: {
        id: string;
        organizationId: string;
      };
      select: {
        id: true;
        title: true;
      };
    }): Promise<{
      id: string;
      title: string;
    } | null>;
  };
  sourceImportDecision: {
    create(args: {
      data: Prisma.SourceImportDecisionUncheckedCreateInput;
      select: {
        id: true;
      };
    }): Promise<{
      id: string;
    }>;
  };
  opportunityActivityEvent: {
    create(args: {
      data: Prisma.OpportunityActivityEventUncheckedCreateInput;
    }): Promise<unknown>;
  };
};

export type SourceImportMatchKind =
  | "exact_source"
  | "strong_candidate"
  | "possible_candidate";

export type SourceImportDuplicateCandidate = {
  currentStageLabel: string | null;
  matchKind: SourceImportMatchKind;
  matchReasons: string[];
  matchScore: number;
  opportunityId: string;
  originSourceSystem: string | null;
  title: string;
};

export type SourceImportPreviewSnapshot = {
  alreadyTrackedOpportunity: {
    id: string;
    title: string;
    currentStageLabel: string | null;
  } | null;
  connector: {
    id: string;
    sourceDisplayName: string;
  } | null;
  duplicateCandidates: SourceImportDuplicateCandidate[];
  importPreview: MockSamGovImportPreview;
  result: MockSamGovSearchResult;
  suggestedTargetOpportunityId: string | null;
};

export type ApplyMockSourceImportInput = {
  actor: AuditActorContext & {
    organizationId: string;
  };
  mode: SourceImportDecisionMode;
  resultId: string;
  searchExecutedAt?: string | null;
  searchQuery?: Prisma.InputJsonValue | null;
  targetOpportunityId?: string | null;
};

export type ApplyMockSourceImportResult = {
  action: "already_tracked" | "created" | "linked";
  sourceRecordId: string;
  targetOpportunityId: string;
  targetOpportunityTitle: string;
};

export async function getSourceImportPreviewSnapshot({
  db,
  organizationSlug = DEFAULT_ORGANIZATION_SLUG,
  resultId,
}: {
  db: SourceImportRepositoryClient;
  organizationSlug?: string;
  resultId: string;
}): Promise<SourceImportPreviewSnapshot | null> {
  const organization = await db.organization.findUnique({
    where: {
      slug: organizationSlug,
    },
    ...organizationSourceImportArgs,
  });

  if (!organization) {
    return null;
  }

  return buildSourceImportPreviewSnapshot({
    organization,
    resultId,
  });
}

export function buildSourceImportPreviewSnapshot({
  organization,
  resultId,
}: {
  organization: OrganizationSourceImportRecord;
  resultId: string;
}): SourceImportPreviewSnapshot | null {
  const result = getMockSamGovSearchResultById(resultId);
  const importPreview = buildMockSamGovImportPreview(resultId);

  if (!result || !importPreview) {
    return null;
  }

  const duplicateCandidates = rankDuplicateCandidates({
    opportunities: organization.opportunities,
    result,
    sourceRecords: organization.sourceRecords,
  });
  const exactSourceRecord = organization.sourceRecords.find(
    (sourceRecord) =>
      sourceRecord.sourceSystem === result.sourceSystem &&
      sourceRecord.sourceRecordId === result.noticeId &&
      sourceRecord.opportunity,
  );

  return {
    alreadyTrackedOpportunity: exactSourceRecord?.opportunity ?? null,
    connector:
      organization.sourceConnectorConfigs.find(
        (connector) =>
          connector.sourceSystemKey === result.sourceSystem &&
          connector.isEnabled &&
          connector.supportsResultPreview,
      ) ?? null,
    duplicateCandidates,
    importPreview,
    result,
    suggestedTargetOpportunityId:
      duplicateCandidates[0]?.matchKind === "exact_source"
        ? duplicateCandidates[0].opportunityId
        : duplicateCandidates[0]?.opportunityId ?? null,
  };
}

export async function applyMockSourceImport({
  db,
  input,
}: {
  db: SourceImportRepositoryClient;
  input: ApplyMockSourceImportInput;
}): Promise<ApplyMockSourceImportResult> {
  const preview = buildMockSamGovImportPreview(input.resultId);
  const result = getMockSamGovSearchResultById(input.resultId);

  if (!preview || !result) {
    throw new Error("Selected source result could not be resolved.");
  }

  return db.$transaction(async (tx) => {
    const connector = await tx.sourceConnectorConfig.findFirst({
      where: {
        organizationId: input.actor.organizationId,
        sourceSystemKey: result.sourceSystem,
      },
      select: {
        id: true,
        sourceDisplayName: true,
      },
    });

    const existingSourceRecord = await tx.sourceRecord.findFirst({
      where: {
        organizationId: input.actor.organizationId,
        sourceSystem: result.sourceSystem,
        sourceRecordId: result.noticeId,
      },
      select: {
        id: true,
        opportunityId: true,
      },
    });

    if (existingSourceRecord?.opportunityId) {
      const existingOpportunity = await tx.opportunity.findFirst({
        where: {
          id: existingSourceRecord.opportunityId,
          organizationId: input.actor.organizationId,
        },
        select: {
          id: true,
          title: true,
        },
      });

      if (!existingOpportunity) {
        throw new Error(
          "The existing linked opportunity for this source record could not be loaded.",
        );
      }

      return {
        action: "already_tracked",
        sourceRecordId: existingSourceRecord.id,
        targetOpportunityId: existingOpportunity.id,
        targetOpportunityTitle: existingOpportunity.title,
      };
    }

    const agencyId = await resolveAgencyId({
      db: tx,
      organizationId: input.actor.organizationId,
      result,
    });
    const occurredAt = new Date();
    let sourceRecordId = existingSourceRecord?.id ?? null;
    let targetOpportunityId = input.targetOpportunityId ?? null;
    let targetOpportunityTitle: string;
    let action: ApplyMockSourceImportResult["action"];

    if (!sourceRecordId) {
      const createdSourceRecord = await tx.sourceRecord.create({
        data: {
          agencyId,
          opportunityId: null,
          organizationId: input.actor.organizationId,
          sourceApiEndpoint: "https://api.sam.gov/opportunities/v2/search",
          sourceConnectorConfigId: connector?.id ?? null,
          sourceDescriptionUrl: preview.sourceDescriptionUrl,
          sourceDetailUrl: preview.sourceDetailUrl,
          sourceFetchedAt: occurredAt,
          sourceHashFingerprint: preview.sourceHashFingerprint,
          sourceImportActorIdentifier: input.actor.identifier ?? null,
          sourceImportActorType: "USER",
          sourceImportMethod: "MANUAL_PULL",
          sourceNormalizationAppliedAt: occurredAt,
          sourceNormalizationVersion: preview.normalizationVersion,
          sourceNormalizedPayload: asJsonValue(preview.normalizedPayload),
          sourceRawArchiveDate: readString(preview.rawPayload.archiveDate),
          sourceRawPayload: asJsonValue(preview.rawPayload),
          sourceRawPostedDate: readString(preview.rawPayload.postedDate),
          sourceRawResponseDeadline: readString(
            preview.rawPayload.responseDeadLine,
          ),
          sourceRecordId: result.noticeId,
          sourceSearchExecutedAt: parseNullableDate(input.searchExecutedAt),
          sourceSearchQuery: toNullableJson(input.searchQuery),
          sourceStatusRaw: result.status,
          sourceSystem: result.sourceSystem,
          sourceUiUrl: preview.sourceUiUrl,
          sourceImportPreviewPayload: asJsonValue(preview.importPreviewPayload),
        },
        select: {
          id: true,
          opportunityId: true,
        },
      });

      sourceRecordId = createdSourceRecord.id;
    } else {
      await tx.sourceRecord.update({
        where: {
          id: sourceRecordId,
        },
        data: {
          agencyId,
          sourceApiEndpoint: "https://api.sam.gov/opportunities/v2/search",
          sourceConnectorConfigId: connector?.id ?? null,
          sourceDescriptionUrl: preview.sourceDescriptionUrl,
          sourceDetailUrl: preview.sourceDetailUrl,
          sourceFetchedAt: occurredAt,
          sourceHashFingerprint: preview.sourceHashFingerprint,
          sourceImportActorIdentifier: input.actor.identifier ?? null,
          sourceImportActorType: "USER",
          sourceImportMethod: "MANUAL_PULL",
          sourceNormalizationAppliedAt: occurredAt,
          sourceNormalizationVersion: preview.normalizationVersion,
          sourceNormalizedPayload: asJsonValue(preview.normalizedPayload),
          sourceRawArchiveDate: readString(preview.rawPayload.archiveDate),
          sourceRawPayload: asJsonValue(preview.rawPayload),
          sourceRawPostedDate: readString(preview.rawPayload.postedDate),
          sourceRawResponseDeadline: readString(
            preview.rawPayload.responseDeadLine,
          ),
          sourceSearchExecutedAt: parseNullableDate(input.searchExecutedAt),
          sourceSearchQuery: toNullableJson(input.searchQuery),
          sourceStatusRaw: result.status,
          sourceUiUrl: preview.sourceUiUrl,
          sourceImportPreviewPayload: asJsonValue(preview.importPreviewPayload),
        },
        select: {
          id: true,
          opportunityId: true,
        },
      });
    }

    if (input.mode === "CREATE_OPPORTUNITY") {
      const createdOpportunity = await tx.opportunity.create({
        data: buildOpportunityCreateInput({
          agencyId,
          occurredAt,
          organizationId: input.actor.organizationId,
          preview,
          result,
          sourceRecordId,
        }),
        select: {
          id: true,
          title: true,
        },
      });

      await tx.sourceRecord.update({
        where: {
          id: sourceRecordId,
        },
        data: {
          opportunityId: createdOpportunity.id,
        },
        select: {
          id: true,
          opportunityId: true,
        },
      });

      await recordAuditEvent({
        db: tx,
        event: {
          action: AUDIT_ACTIONS.opportunityCreate,
          actor: input.actor,
          metadata: {
            importedFromSourceRecordId: sourceRecordId,
            originSourceSystem: result.sourceSystem,
          },
          occurredAt,
          organizationId: input.actor.organizationId,
          summary: `Created opportunity ${createdOpportunity.title} from ${result.sourceSystem}:${result.noticeId}.`,
          target: {
            type: "opportunity",
            id: createdOpportunity.id,
            display: createdOpportunity.title,
          },
        },
      });

      targetOpportunityId = createdOpportunity.id;
      targetOpportunityTitle = createdOpportunity.title;
      action = "created";
    } else {
      if (!targetOpportunityId) {
        throw new Error("Select an existing opportunity before linking the source record.");
      }

      const linkedOpportunity = await tx.opportunity.findFirst({
        where: {
          id: targetOpportunityId,
          organizationId: input.actor.organizationId,
        },
        select: {
          id: true,
          title: true,
        },
      });

      if (!linkedOpportunity) {
        throw new Error("Selected duplicate opportunity could not be found.");
      }

      await tx.sourceRecord.update({
        where: {
          id: sourceRecordId,
        },
        data: {
          opportunityId: linkedOpportunity.id,
        },
        select: {
          id: true,
          opportunityId: true,
        },
      });

      targetOpportunityId = linkedOpportunity.id;
      targetOpportunityTitle = linkedOpportunity.title;
      action = "linked";
    }

    const importDecision = await tx.sourceImportDecision.create({
      data: {
        decidedAt: occurredAt,
        decidedByUserId:
          input.actor.type === AuditActorType.USER ? input.actor.userId ?? null : null,
        decisionMetadata: asJsonValue({
          connectorDisplayName: connector?.sourceDisplayName ?? "Unknown connector",
          duplicateDetectionApplied: true,
        }),
        importPreviewPayload: asJsonValue(preview.importPreviewPayload),
        mode: input.mode,
        organizationId: input.actor.organizationId,
        rationale:
          input.mode === "CREATE_OPPORTUNITY"
            ? "Promoted mocked external search result into a new tracked opportunity."
            : "Linked mocked external search result to an existing tracked opportunity after duplicate review.",
        requestedAt: occurredAt,
        requestedByActorType: "USER",
        requestedByUserId:
          input.actor.type === AuditActorType.USER ? input.actor.userId ?? null : null,
        sourceConnectorConfigId: connector?.id ?? null,
        sourceRecordId,
        status: "APPLIED",
        targetOpportunityId,
      },
      select: {
        id: true,
      },
    });

    await recordAuditEvent({
      db: tx,
      event: {
        action: AUDIT_ACTIONS.sourceImportDecisionRecord,
        actor: input.actor,
        metadata: {
          mode: input.mode,
          sourceRecordId,
          sourceSystem: result.sourceSystem,
          targetOpportunityId,
        },
        occurredAt,
        organizationId: input.actor.organizationId,
        summary:
          input.mode === "CREATE_OPPORTUNITY"
            ? `Recorded create-opportunity import decision for ${result.sourceSystem}:${result.noticeId}.`
            : `Recorded link-to-existing import decision for ${result.sourceSystem}:${result.noticeId}.`,
        target: {
          type: "source_import_decision",
          id: importDecision.id,
          display: `${result.sourceSystem}:${result.noticeId}`,
        },
      },
    });

    await tx.opportunityActivityEvent.create({
      data: {
        actorIdentifier: input.actor.identifier ?? null,
        actorType: input.actor.type,
        actorUserId:
          input.actor.type === AuditActorType.USER ? input.actor.userId ?? null : null,
        description:
          input.mode === "CREATE_OPPORTUNITY"
            ? `Imported ${result.noticeId} from ${result.sourceSystem} into a new tracked opportunity.`
            : `Linked ${result.noticeId} from ${result.sourceSystem} to the existing tracked opportunity after duplicate review.`,
        eventType: "source_import_applied",
        metadata: {
          importDecisionId: importDecision.id,
          mode: input.mode,
          sourceRecordId,
        },
        occurredAt,
        opportunityId: targetOpportunityId,
        organizationId: input.actor.organizationId,
        relatedEntityId: importDecision.id,
        relatedEntityType: "source_import_decision",
        title:
          input.mode === "CREATE_OPPORTUNITY"
            ? "Source result promoted into the pipeline"
            : "Source result linked to an existing opportunity",
      },
    });

    return {
      action,
      sourceRecordId,
      targetOpportunityId,
      targetOpportunityTitle,
    };
  });
}

function rankDuplicateCandidates({
  opportunities,
  result,
  sourceRecords,
}: {
  opportunities: OrganizationSourceImportRecord["opportunities"];
  result: MockSamGovSearchResult;
  sourceRecords: OrganizationSourceImportRecord["sourceRecords"];
}) {
  const exactSourceOpportunityIds = new Set(
    sourceRecords
      .filter(
        (sourceRecord) =>
          sourceRecord.sourceSystem === result.sourceSystem &&
          sourceRecord.sourceRecordId === result.noticeId &&
          sourceRecord.opportunityId,
      )
      .map((sourceRecord) => sourceRecord.opportunityId as string),
  );

  return opportunities
    .map((opportunity) =>
      buildDuplicateCandidate({
        exactSourceMatch: exactSourceOpportunityIds.has(opportunity.id),
        opportunity,
        result,
      }),
    )
    .filter((candidate): candidate is SourceImportDuplicateCandidate => candidate !== null)
    .sort((left, right) => {
      if (left.matchScore !== right.matchScore) {
        return right.matchScore - left.matchScore;
      }

      return left.title.localeCompare(right.title);
    });
}

function buildDuplicateCandidate({
  exactSourceMatch,
  opportunity,
  result,
}: {
  exactSourceMatch: boolean;
  opportunity: OrganizationSourceImportRecord["opportunities"][number];
  result: MockSamGovSearchResult;
}) {
  if (exactSourceMatch) {
    return {
      currentStageLabel: opportunity.currentStageLabel,
      matchKind: "exact_source",
      matchReasons: [
        "This exact source notice is already linked to the tracked opportunity.",
      ],
      matchScore: 100,
      opportunityId: opportunity.id,
      originSourceSystem: opportunity.originSourceSystem,
      title: opportunity.title,
    } satisfies SourceImportDuplicateCandidate;
  }

  let matchScore = 0;
  const matchReasons: string[] = [];
  const normalizedOpportunityTitle = normalizeForComparison(opportunity.title);
  const normalizedResultTitle = normalizeForComparison(result.title);

  if (
    opportunity.externalNoticeId &&
    normalizeForComparison(opportunity.externalNoticeId) ===
      normalizeForComparison(result.noticeId)
  ) {
    matchScore += 95;
    matchReasons.push("External notice ID already matches.");
  }

  if (
    opportunity.solicitationNumber &&
    result.solicitationNumber &&
    normalizeForComparison(opportunity.solicitationNumber) ===
      normalizeForComparison(result.solicitationNumber)
  ) {
    matchScore += 55;
    matchReasons.push("Solicitation number matches.");
  }

  if (normalizedOpportunityTitle === normalizedResultTitle) {
    matchScore += 65;
    matchReasons.push("Opportunity title matches exactly.");
  } else if (
    normalizedOpportunityTitle.includes(normalizedResultTitle) ||
    normalizedResultTitle.includes(normalizedOpportunityTitle)
  ) {
    matchScore += 45;
    matchReasons.push("Opportunity title is highly similar.");
  }

  if (
    opportunity.leadAgency?.organizationCode &&
    result.organizationCode &&
    normalizeForComparison(opportunity.leadAgency.organizationCode) ===
      normalizeForComparison(result.organizationCode)
  ) {
    matchScore += 12;
    matchReasons.push("Agency organization code matches.");
  } else if (
    opportunity.leadAgency?.name &&
    normalizeForComparison(opportunity.leadAgency.name) ===
      normalizeForComparison(result.organizationName)
  ) {
    matchScore += 10;
    matchReasons.push("Agency name matches.");
  }

  if (
    opportunity.naicsCode &&
    result.naicsCode &&
    normalizeForComparison(opportunity.naicsCode) ===
      normalizeForComparison(result.naicsCode)
  ) {
    matchScore += 10;
    matchReasons.push("NAICS code matches.");
  }

  if (
    opportunity.responseDeadlineAt &&
    result.responseDeadline &&
    isSameIsoDate(opportunity.responseDeadlineAt, result.responseDeadline)
  ) {
    matchScore += 8;
    matchReasons.push("Response deadline matches.");
  }

  if (matchScore < IMPORT_MATCH_THRESHOLD) {
    return null;
  }

  return {
    currentStageLabel: opportunity.currentStageLabel,
    matchKind:
      matchScore >= 85 ? "strong_candidate" : "possible_candidate",
    matchReasons,
    matchScore,
    opportunityId: opportunity.id,
    originSourceSystem: opportunity.originSourceSystem,
    title: opportunity.title,
  } satisfies SourceImportDuplicateCandidate;
}

function buildOpportunityCreateInput({
  agencyId,
  occurredAt,
  organizationId,
  preview,
  result,
  sourceRecordId,
}: {
  agencyId: string | null;
  occurredAt: Date;
  organizationId: string;
  preview: MockSamGovImportPreview;
  result: MockSamGovSearchResult;
  sourceRecordId: string;
}): Prisma.OpportunityUncheckedCreateInput {
  return {
    additionalInfoUrl: preview.sourceUiUrl
      ? `${preview.sourceUiUrl}/resources`
      : null,
    apiSelfLink: preview.sourceDetailUrl,
    archiveDateRaw: readString(preview.rawPayload.archiveDate),
    archiveType: readString(preview.rawPayload.archiveType),
    archivedAt:
      result.status === "archived" ? parseNullableDate(result.postedDate) : null,
    classificationCode: result.classificationCode,
    createdAt: occurredAt,
    currentStageChangedAt: occurredAt,
    currentStageKey: "identified",
    currentStageLabel: "Identified",
    description: result.summary,
    externalNoticeId: result.noticeId,
    importedFromSourceRecordId: sourceRecordId,
    isActiveSourceRecord: result.status === "active",
    isArchivedSourceRecord: result.status === "archived",
    leadAgencyId: agencyId,
    naicsCode: result.naicsCode,
    officeCity: readString(preview.normalizedPayload.officeCity),
    officeCountryCode: readString(preview.normalizedPayload.officeCountryCode),
    officePostalCode: readString(preview.normalizedPayload.officePostalCode),
    officeState: readString(preview.normalizedPayload.officeState),
    organizationId,
    organizationType: readString(preview.normalizedPayload.organizationType),
    originSourceSystem: result.sourceSystem,
    placeOfPerformanceCityCode: readString(
      preview.normalizedPayload.placeOfPerformanceCityCode,
    ),
    placeOfPerformanceCityName: readString(
      preview.normalizedPayload.placeOfPerformanceCityName,
    ),
    placeOfPerformanceCountryCode: readString(
      preview.normalizedPayload.placeOfPerformanceCountryCode,
    ),
    placeOfPerformancePostalCode: readString(
      preview.normalizedPayload.placeOfPerformancePostalCode,
    ),
    placeOfPerformanceStateCode: readString(
      preview.normalizedPayload.placeOfPerformanceStateCode,
    ),
    placeOfPerformanceStateName: readString(
      preview.normalizedPayload.placeOfPerformanceStateName,
    ),
    placeOfPerformanceStreet1: readString(
      preview.normalizedPayload.placeOfPerformanceStreet1,
    ),
    placeOfPerformanceStreet2: readString(
      preview.normalizedPayload.placeOfPerformanceStreet2,
    ),
    postedAt: parseNullableDate(result.postedDate),
    postedDateRaw: readString(preview.rawPayload.postedDate),
    procurementBaseTypeLabel: result.procurementTypeLabel,
    procurementTypeLabel: result.procurementTypeLabel,
    responseDeadlineAt: result.responseDeadline
      ? parseNullableDate(`${result.responseDeadline}T21:00:00.000Z`)
      : null,
    responseDeadlineRaw: readString(preview.rawPayload.responseDeadLine),
    setAsideCode: result.setAsideCode,
    setAsideDescription: result.setAsideDescription,
    solicitationNumber: result.solicitationNumber,
    sourceStatus: result.status,
    sourceSummaryText: result.summary,
    sourceSummaryUrl: preview.sourceUiUrl,
    title: result.title,
    uiLink: preview.sourceUiUrl,
    updatedAt: occurredAt,
  };
}

async function resolveAgencyId({
  db,
  organizationId,
  result,
}: {
  db: SourceImportTransactionClient;
  organizationId: string;
  result: MockSamGovSearchResult;
}) {
  const existingAgency = await db.agency.findFirst({
    where: {
      organizationId,
      OR: [
        result.organizationCode
          ? {
              organizationCode: result.organizationCode,
            }
          : undefined,
        {
          name: result.organizationName,
        },
      ].filter(Boolean) as Prisma.AgencyWhereInput[],
    },
    select: {
      id: true,
    },
  });

  if (existingAgency) {
    return existingAgency.id;
  }

  const createdAgency = await db.agency.create({
    data: {
      name: result.organizationName,
      officeCountryCode: "USA",
      officePostalCode: result.placeOfPerformanceZip,
      officeState: result.placeOfPerformanceState,
      organizationCode: result.organizationCode,
      organizationId,
      pathCode: result.organizationCode,
      pathName: result.organizationName,
    },
    select: {
      id: true,
    },
  });

  return createdAgency.id;
}

function normalizeForComparison(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

function isSameIsoDate(date: Date, isoDate: string) {
  return date.toISOString().slice(0, 10) === isoDate;
}

function parseNullableDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00.000Z`);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function readString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function toNullableJson(value: Prisma.InputJsonValue | null | undefined) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return Prisma.JsonNull;
  }

  return value;
}

function asJsonValue(value: Record<string, unknown>) {
  return value as Prisma.InputJsonValue;
}
