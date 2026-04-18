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

import type { SourceSearchResultSummary } from "./source-search.service";

const DEFAULT_ORGANIZATION_SLUG = "default-org";
const IMPORT_MATCH_THRESHOLD = 60;
const AUTO_CANONICALIZE_MATCH_KINDS = new Set<SourceImportMatchKind>([
  "exact_notice",
  "strong_candidate",
]);

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
        postedAt: true,
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
} as const;

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
    postedAt: Date | null;
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

type SourceRecordPreviewRecord = {
  id: string;
  organizationId: string;
  opportunityId: string | null;
  sourceConnectorConfigId: string | null;
  sourceSystem: string;
  sourceRecordId: string;
  sourceRawPayload: Prisma.JsonValue;
  sourceNormalizedPayload: Prisma.JsonValue;
  sourceImportPreviewPayload: Prisma.JsonValue | null;
  sourceNormalizationVersion: string;
  sourceUiUrl: string | null;
  sourceDetailUrl: string | null;
  sourceDescriptionUrl: string | null;
  sourceHashFingerprint: string;
  opportunity: {
    id: string;
    title: string;
    currentStageKey: string | null;
    currentStageLabel: string | null;
  } | null;
};

const opportunityCanonicalizationSelect = {
  id: true,
  organizationId: true,
  title: true,
  description: true,
  importedFromSourceRecordId: true,
  originSourceSystem: true,
  leadAgencyId: true,
  externalNoticeId: true,
  solicitationNumber: true,
  sourceSummaryText: true,
  sourceSummaryUrl: true,
  postedAt: true,
  postedDateRaw: true,
  responseDeadlineAt: true,
  responseDeadlineRaw: true,
  procurementTypeLabel: true,
  procurementBaseTypeLabel: true,
  archiveType: true,
  archivedAt: true,
  archiveDateRaw: true,
  sourceStatus: true,
  naicsCode: true,
  classificationCode: true,
  setAsideCode: true,
  setAsideDescription: true,
  organizationType: true,
  officeCity: true,
  officeState: true,
  officePostalCode: true,
  officeCountryCode: true,
  placeOfPerformanceStreet1: true,
  placeOfPerformanceStreet2: true,
  placeOfPerformanceCityCode: true,
  placeOfPerformanceCityName: true,
  placeOfPerformanceStateCode: true,
  placeOfPerformanceStateName: true,
  placeOfPerformancePostalCode: true,
  placeOfPerformanceCountryCode: true,
  additionalInfoUrl: true,
  uiLink: true,
  apiSelfLink: true,
} as const;

type OpportunityCanonicalizationRecord = {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  importedFromSourceRecordId: string | null;
  originSourceSystem: string | null;
  leadAgencyId: string | null;
  externalNoticeId: string | null;
  solicitationNumber: string | null;
  sourceSummaryText: string | null;
  sourceSummaryUrl: string | null;
  postedAt: Date | null;
  postedDateRaw: string | null;
  responseDeadlineAt: Date | null;
  responseDeadlineRaw: string | null;
  procurementTypeLabel: string | null;
  procurementBaseTypeLabel: string | null;
  archiveType: string | null;
  archivedAt: Date | null;
  archiveDateRaw: string | null;
  sourceStatus: string | null;
  naicsCode: string | null;
  classificationCode: string | null;
  setAsideCode: string | null;
  setAsideDescription: string | null;
  organizationType: string | null;
  officeCity: string | null;
  officeState: string | null;
  officePostalCode: string | null;
  officeCountryCode: string | null;
  placeOfPerformanceStreet1: string | null;
  placeOfPerformanceStreet2: string | null;
  placeOfPerformanceCityCode: string | null;
  placeOfPerformanceCityName: string | null;
  placeOfPerformanceStateCode: string | null;
  placeOfPerformanceStateName: string | null;
  placeOfPerformancePostalCode: string | null;
  placeOfPerformanceCountryCode: string | null;
  additionalInfoUrl: string | null;
  uiLink: string | null;
  apiSelfLink: string | null;
};

export type SourceImportRepositoryClient = {
  organization: {
    findFirst(args: {
      where: {
        id?: string;
        slug?: string;
      };
    } & typeof organizationSourceImportArgs): Promise<OrganizationSourceImportRecord | null>;
  };
  sourceRecord: {
    findFirst(args: unknown): Promise<SourceRecordPreviewRecord | null>;
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
    findFirst(args: unknown): Promise<{
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
      select: typeof opportunityCanonicalizationSelect;
    }): Promise<OpportunityCanonicalizationRecord | null>;
    update(args: {
      where: {
        id: string;
      };
      data: Prisma.OpportunityUncheckedUpdateInput;
      select: typeof opportunityCanonicalizationSelect;
    }): Promise<OpportunityCanonicalizationRecord>;
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
  | "exact_notice"
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

export type SourceImportPreview = {
  importPreviewPayload: Record<string, unknown>;
  normalizedPayload: Record<string, unknown>;
  normalizationVersion: string;
  rawPayload: Record<string, unknown>;
  sourceDescriptionUrl: string | null;
  sourceDetailUrl: string | null;
  sourceHashFingerprint: string;
  sourceUiUrl: string | null;
  warnings: string[];
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
  importPreview: SourceImportPreview;
  recommendedMode: SourceImportDecisionMode | null;
  result: SourceSearchResultSummary;
  shouldAutoCanonicalize: boolean;
  suggestedTargetOpportunityId: string | null;
};

export type ApplySourceImportInput = {
  actor: AuditActorContext & {
    organizationId: string;
  };
  mode: SourceImportDecisionMode;
  sourceRecordId: string;
  targetOpportunityId?: string | null;
};

export type ApplySourceImportResult = {
  action: "already_tracked" | "created" | "linked" | "merged";
  sourceRecordId: string;
  targetOpportunityId: string;
  targetOpportunityTitle: string;
};

export async function getSourceImportPreviewSnapshot({
  db,
  organizationSlug = DEFAULT_ORGANIZATION_SLUG,
  sourceRecordId,
}: {
  db: SourceImportRepositoryClient;
  organizationSlug?: string;
  sourceRecordId: string;
}): Promise<SourceImportPreviewSnapshot | null> {
  const organization = await db.organization.findFirst({
    where: {
      slug: organizationSlug,
    },
    ...organizationSourceImportArgs,
  });

  if (!organization) {
    return null;
  }

  const sourceRecord = await db.sourceRecord.findFirst({
    where: {
      id: sourceRecordId,
      organizationId: organization.id,
    },
    select: {
      id: true,
      organizationId: true,
      opportunityId: true,
      sourceConnectorConfigId: true,
      sourceSystem: true,
      sourceRecordId: true,
      sourceRawPayload: true,
      sourceNormalizedPayload: true,
      sourceImportPreviewPayload: true,
      sourceNormalizationVersion: true,
      sourceUiUrl: true,
      sourceDetailUrl: true,
      sourceDescriptionUrl: true,
      sourceHashFingerprint: true,
      opportunity: {
        select: {
          id: true,
          title: true,
          currentStageKey: true,
          currentStageLabel: true,
        },
      },
    },
  });

  if (!sourceRecord) {
    return null;
  }

  return buildSourceImportPreviewSnapshot({
    organization,
    sourceRecord,
  });
}

export function buildSourceImportPreviewSnapshot({
  organization,
  sourceRecord,
}: {
  organization: OrganizationSourceImportRecord;
  sourceRecord: SourceRecordPreviewRecord;
}): SourceImportPreviewSnapshot | null {
  const importPreview = buildImportPreview(sourceRecord);
  const result = buildResultSummary(sourceRecord);

  if (!importPreview || !result) {
    return null;
  }

  const duplicateCandidates = rankDuplicateCandidates({
    opportunities: organization.opportunities,
    result,
    sourceRecords: organization.sourceRecords,
  });
  const exactSourceRecord = organization.sourceRecords.find(
    (record) => record.id === sourceRecord.id && record.opportunity,
  );
  const canonicalDuplicateCandidate = selectCanonicalDuplicateCandidate(
    duplicateCandidates,
  );

  return {
    alreadyTrackedOpportunity: exactSourceRecord?.opportunity ?? null,
    connector:
      organization.sourceConnectorConfigs.find(
        (connector) =>
          connector.sourceSystemKey === sourceRecord.sourceSystem &&
          connector.isEnabled &&
          connector.supportsResultPreview,
      ) ?? null,
    duplicateCandidates,
    importPreview,
    recommendedMode:
      exactSourceRecord?.opportunity || canonicalDuplicateCandidate
        ? "LINK_TO_EXISTING"
        : "CREATE_OPPORTUNITY",
    result,
    shouldAutoCanonicalize: canonicalDuplicateCandidate !== null,
    suggestedTargetOpportunityId:
      duplicateCandidates[0]?.matchKind === "exact_source"
        ? duplicateCandidates[0].opportunityId
        : canonicalDuplicateCandidate?.opportunityId ??
          duplicateCandidates[0]?.opportunityId ??
          null,
  };
}

export async function applySourceImport({
  db,
  input,
}: {
  db: SourceImportRepositoryClient;
  input: ApplySourceImportInput;
}): Promise<ApplySourceImportResult> {
  const previewSourceRecord = await db.sourceRecord.findFirst({
    where: {
      id: input.sourceRecordId,
      organizationId: input.actor.organizationId,
    },
    select: {
      id: true,
      organizationId: true,
      opportunityId: true,
      sourceConnectorConfigId: true,
      sourceSystem: true,
      sourceRecordId: true,
      sourceRawPayload: true,
      sourceNormalizedPayload: true,
      sourceImportPreviewPayload: true,
      sourceNormalizationVersion: true,
      sourceUiUrl: true,
      sourceDetailUrl: true,
      sourceDescriptionUrl: true,
      sourceHashFingerprint: true,
      opportunity: {
        select: {
          id: true,
          title: true,
          currentStageKey: true,
          currentStageLabel: true,
        },
      },
    },
  });

  if (!previewSourceRecord) {
    throw new Error("Selected source result could not be resolved.");
  }

  const preview = buildImportPreview(previewSourceRecord);
  const result = buildResultSummary(previewSourceRecord);

  if (!preview || !result) {
    throw new Error("Selected source result could not be normalized for import.");
  }

  const organization = await db.organization.findFirst({
    where: {
      id: input.actor.organizationId,
    },
    ...organizationSourceImportArgs,
  });

  if (!organization) {
    throw new Error("The source-import workspace organization could not be loaded.");
  }

  const previewSnapshot = buildSourceImportPreviewSnapshot({
    organization,
    sourceRecord: previewSourceRecord,
  });
  const canonicalDuplicateCandidate = previewSnapshot
    ? selectCanonicalDuplicateCandidate(previewSnapshot.duplicateCandidates)
    : null;

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
        id: input.sourceRecordId,
        organizationId: input.actor.organizationId,
      },
      select: {
        id: true,
        opportunityId: true,
      },
    });

    if (!existingSourceRecord) {
      throw new Error("The selected source record no longer exists.");
    }

    if (existingSourceRecord.opportunityId) {
      const existingOpportunity = await tx.opportunity.findFirst({
        where: {
          id: existingSourceRecord.opportunityId,
          organizationId: input.actor.organizationId,
        },
        select: opportunityCanonicalizationSelect,
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
    const requestedMode = input.mode;
    const effectiveMode =
      requestedMode === "CREATE_OPPORTUNITY" && canonicalDuplicateCandidate
        ? "LINK_TO_EXISTING"
        : requestedMode;
    let targetOpportunityId =
      input.targetOpportunityId ??
      (effectiveMode === "LINK_TO_EXISTING"
        ? canonicalDuplicateCandidate?.opportunityId ?? null
        : null);
    let targetOpportunityTitle: string;
    let action: ApplySourceImportResult["action"];
    let canonicalizedFieldKeys: string[] = [];

    if (effectiveMode === "CREATE_OPPORTUNITY") {
      const createdOpportunity = await tx.opportunity.create({
        data: buildOpportunityCreateInput({
          agencyId,
          occurredAt,
          organizationId: input.actor.organizationId,
          preview,
          result,
          sourceRecordId: existingSourceRecord.id,
        }),
        select: {
          id: true,
          title: true,
        },
      });

      await tx.sourceRecord.update({
        where: {
          id: existingSourceRecord.id,
        },
        data: {
          opportunityId: createdOpportunity.id,
          sourceConnectorConfigId: connector?.id ?? previewSourceRecord.sourceConnectorConfigId,
          sourceImportActorIdentifier: input.actor.identifier ?? null,
          sourceImportActorType: "USER",
          sourceImportActorUserId:
            input.actor.type === AuditActorType.USER ? input.actor.userId ?? null : null,
          sourceImportMethod: "MANUAL_PULL",
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
            importedFromSourceRecordId: existingSourceRecord.id,
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
        select: opportunityCanonicalizationSelect,
      });

      if (!linkedOpportunity) {
        throw new Error("Selected duplicate opportunity could not be found.");
      }

      await tx.sourceRecord.update({
        where: {
          id: existingSourceRecord.id,
        },
        data: {
          opportunityId: linkedOpportunity.id,
          sourceConnectorConfigId: connector?.id ?? previewSourceRecord.sourceConnectorConfigId,
          sourceImportActorIdentifier: input.actor.identifier ?? null,
          sourceImportActorType: "USER",
          sourceImportActorUserId:
            input.actor.type === AuditActorType.USER ? input.actor.userId ?? null : null,
          sourceImportMethod: "MANUAL_PULL",
        },
        select: {
          id: true,
          opportunityId: true,
        },
      });

      const canonicalizationPatch = buildCanonicalOpportunityUpdateInput({
        agencyId,
        existingOpportunity: linkedOpportunity,
        preview,
        result,
        sourceRecordId: existingSourceRecord.id,
      });

      const canonicalizedOpportunity =
        Object.keys(canonicalizationPatch.data).length > 0
          ? await tx.opportunity.update({
              where: {
                id: linkedOpportunity.id,
              },
              data: canonicalizationPatch.data,
              select: opportunityCanonicalizationSelect,
            })
          : linkedOpportunity;

      if (canonicalizationPatch.changedFields.length > 0) {
        canonicalizedFieldKeys = canonicalizationPatch.changedFields.map(
          (change) => change.field,
        );
        await recordAuditEvent({
          db: tx,
          event: {
            action: AUDIT_ACTIONS.opportunityUpdate,
            actor: input.actor,
            metadata: {
              canonicalizedFromSourceRecordId: existingSourceRecord.id,
              changedFields: canonicalizationPatch.changedFields,
              sourceSystem: result.sourceSystem,
            },
            occurredAt,
            organizationId: input.actor.organizationId,
            summary: `Canonicalized opportunity ${canonicalizedOpportunity.title} with source data from ${result.sourceSystem}:${result.noticeId}.`,
            target: {
              type: "opportunity",
              id: canonicalizedOpportunity.id,
              display: canonicalizedOpportunity.title,
            },
          },
        });
      }

      targetOpportunityId = canonicalizedOpportunity.id;
      targetOpportunityTitle = canonicalizedOpportunity.title;
      action =
        requestedMode === "CREATE_OPPORTUNITY" && canonicalDuplicateCandidate
          ? "merged"
          : "linked";
    }

    const importDecision = await tx.sourceImportDecision.create({
      data: {
        decidedAt: occurredAt,
        decidedByUserId:
          input.actor.type === AuditActorType.USER ? input.actor.userId ?? null : null,
        decisionMetadata: asJsonValue({
          autoCanonicalized:
            requestedMode === "CREATE_OPPORTUNITY" &&
            canonicalDuplicateCandidate !== null,
          canonicalizedFieldKeys,
          connectorDisplayName: connector?.sourceDisplayName ?? "Unknown connector",
          duplicateDetectionApplied: true,
          requestedMode,
        }),
        importPreviewPayload: asJsonValue(preview.importPreviewPayload),
        mode: effectiveMode,
        organizationId: input.actor.organizationId,
        rationale:
          action === "merged"
            ? "Automatically merged the duplicate source result into the existing canonical opportunity."
            : effectiveMode === "CREATE_OPPORTUNITY"
            ? "Promoted the persisted source result into a new tracked opportunity."
            : "Linked the persisted source result to an existing tracked opportunity after duplicate review.",
        requestedAt: occurredAt,
        requestedByActorType: "USER",
        requestedByUserId:
          input.actor.type === AuditActorType.USER ? input.actor.userId ?? null : null,
        sourceConnectorConfigId: connector?.id ?? previewSourceRecord.sourceConnectorConfigId,
        sourceRecordId: existingSourceRecord.id,
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
          mode: effectiveMode,
          requestedMode,
          sourceRecordId: existingSourceRecord.id,
          sourceSystem: result.sourceSystem,
          targetOpportunityId,
        },
        occurredAt,
        organizationId: input.actor.organizationId,
        summary:
          action === "merged"
            ? `Recorded canonical merge import decision for ${result.sourceSystem}:${result.noticeId}.`
            : effectiveMode === "CREATE_OPPORTUNITY"
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
          action === "merged"
            ? `Merged ${result.noticeId} from ${result.sourceSystem} into the existing tracked opportunity after canonical duplicate detection.`
            : effectiveMode === "CREATE_OPPORTUNITY"
            ? `Imported ${result.noticeId} from ${result.sourceSystem} into a new tracked opportunity.`
            : `Linked ${result.noticeId} from ${result.sourceSystem} to the existing tracked opportunity after duplicate review.`,
        eventType: "source_import_applied",
        metadata: {
          importDecisionId: importDecision.id,
          mode: effectiveMode,
          requestedMode,
          sourceRecordId: existingSourceRecord.id,
        },
        occurredAt,
        opportunityId: targetOpportunityId,
        organizationId: input.actor.organizationId,
        relatedEntityId: importDecision.id,
        relatedEntityType: "source_import_decision",
        title:
          action === "merged"
            ? "Source result merged into the canonical opportunity"
            : effectiveMode === "CREATE_OPPORTUNITY"
            ? "Source result promoted into the pipeline"
            : "Source result linked to an existing opportunity",
      },
    });

    return {
      action,
      sourceRecordId: existingSourceRecord.id,
      targetOpportunityId,
      targetOpportunityTitle,
    };
  });
}

function buildImportPreview(sourceRecord: SourceRecordPreviewRecord): SourceImportPreview | null {
  const rawPayload = readRecord(sourceRecord.sourceRawPayload);
  const normalizedPayload = readRecord(sourceRecord.sourceNormalizedPayload);

  if (!rawPayload || !normalizedPayload) {
    return null;
  }

  const previewPayload =
    readRecord(sourceRecord.sourceImportPreviewPayload) ??
    ({
      canonicalOpportunity: {
        currentStageKey: "identified",
        currentStageLabel: "Identified",
        externalNoticeId:
          readString(normalizedPayload.externalNoticeId) ?? sourceRecord.sourceRecordId,
        leadAgency: readString(normalizedPayload.agencyOfficeName),
        originSourceSystem: sourceRecord.sourceSystem,
        title:
          readString(normalizedPayload.title) ??
          readString(rawPayload.title) ??
          "Untitled source result",
      },
      duplicateCheckKey: sourceRecord.sourceHashFingerprint,
      normalizedPayload,
      rawPayload,
      warnings: readStringArray(normalizedPayload.warnings),
    } satisfies Record<string, unknown>);

  return {
    importPreviewPayload: previewPayload,
    normalizedPayload,
    normalizationVersion: sourceRecord.sourceNormalizationVersion,
    rawPayload,
    sourceDescriptionUrl: sourceRecord.sourceDescriptionUrl,
    sourceDetailUrl: sourceRecord.sourceDetailUrl,
    sourceHashFingerprint: sourceRecord.sourceHashFingerprint,
    sourceUiUrl: sourceRecord.sourceUiUrl,
    warnings:
      readStringArray(previewPayload.warnings) ||
      readStringArray(normalizedPayload.warnings) ||
      [],
  };
}

function buildResultSummary(sourceRecord: SourceRecordPreviewRecord): SourceSearchResultSummary | null {
  const rawPayload = readRecord(sourceRecord.sourceRawPayload);
  const normalizedPayload = readRecord(sourceRecord.sourceNormalizedPayload);

  if (!rawPayload || !normalizedPayload) {
    return null;
  }

  const postedDate =
    toIsoDate(readString(rawPayload.postedDate)) ??
    toIsoDate(readString(normalizedPayload.postedDateRaw)) ??
    "1970-01-01";
  const responseDeadline =
    toIsoDate(readString(rawPayload.responseDeadLine)) ??
    toIsoDate(readString(normalizedPayload.responseDeadlineRaw));

  return {
    id: sourceRecord.id,
    naicsCode:
      readString(normalizedPayload.naicsCode) ??
      readString(rawPayload.naicsCode),
    noticeId:
      readString(normalizedPayload.externalNoticeId) ??
      sourceRecord.sourceRecordId,
    organizationCode:
      readString(rawPayload.organizationCode) ??
      readString(normalizedPayload.agencyPathCode),
    organizationName:
      readString(rawPayload.organizationName) ??
      readString(normalizedPayload.agencyOfficeName) ??
      "Unknown organization",
    organizationPathName:
      readString(normalizedPayload.agencyPathName) ??
      readString(rawPayload.fullParentPathName) ??
      readString(rawPayload.organizationName) ??
      readString(normalizedPayload.agencyOfficeName),
    placeOfPerformanceState:
      readString(normalizedPayload.placeOfPerformanceStateCode) ??
      readNestedString(rawPayload, ["placeOfPerformance", "state", "code"]),
    placeOfPerformanceZip:
      readString(normalizedPayload.placeOfPerformancePostalCode) ??
      readNestedString(rawPayload, ["placeOfPerformance", "zip"]),
    postedDate,
    procurementTypeCode: readString(rawPayload.procurementTypeCode) ?? "",
    procurementTypeLabel:
      readString(normalizedPayload.procurementTypeLabel) ??
      readString(rawPayload.type) ??
      "Unknown",
    responseDeadline,
    setAsideDescription:
      readString(normalizedPayload.setAsideDescription) ??
      readString(rawPayload.typeOfSetAsideDescription),
    solicitationNumber:
      readString(normalizedPayload.solicitationNumber) ??
      readString(rawPayload.solicitationNumber),
    sourceSystem: sourceRecord.sourceSystem,
    status:
      readString(normalizedPayload.sourceStatus) ??
      readString(rawPayload.status) ??
      "unknown",
    summary:
      readString(normalizedPayload.sourceSummaryText) ??
      readString(rawPayload.description) ??
      "No summary returned.",
    title:
      readString(normalizedPayload.title) ??
      readString(rawPayload.title) ??
      "Untitled source result",
    uiLink:
      sourceRecord.sourceUiUrl ??
      readString(normalizedPayload.uiLink) ??
      "#",
  };
}

function rankDuplicateCandidates({
  opportunities,
  result,
  sourceRecords,
}: {
  opportunities: OrganizationSourceImportRecord["opportunities"];
  result: SourceSearchResultSummary;
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
  result: SourceSearchResultSummary;
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

  if (
    opportunity.externalNoticeId &&
    normalizeForComparison(opportunity.externalNoticeId) ===
      normalizeForComparison(result.noticeId)
  ) {
    return {
      currentStageLabel: opportunity.currentStageLabel,
      matchKind: "exact_notice",
      matchReasons: [
        "External notice ID already matches the canonical opportunity.",
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
    opportunity.solicitationNumber &&
    result.solicitationNumber &&
    normalizeForComparison(opportunity.solicitationNumber) ===
      normalizeForComparison(result.solicitationNumber)
  ) {
    matchScore += 36;
    matchReasons.push("Solicitation number matches.");
  }

  if (normalizedOpportunityTitle === normalizedResultTitle) {
    matchScore += 40;
    matchReasons.push("Opportunity title matches exactly.");
  } else if (
    normalizedOpportunityTitle.includes(normalizedResultTitle) ||
    normalizedResultTitle.includes(normalizedOpportunityTitle)
  ) {
    matchScore += 26;
    matchReasons.push("Opportunity title is highly similar.");
  }

  if (
    opportunity.leadAgency?.organizationCode &&
    result.organizationCode &&
    normalizeForComparison(opportunity.leadAgency.organizationCode) ===
      normalizeForComparison(result.organizationCode)
  ) {
    matchScore += 15;
    matchReasons.push("Agency organization code matches.");
  } else if (
    opportunity.leadAgency?.name &&
    result.organizationPathName &&
    normalizeForComparison(result.organizationPathName).includes(
      normalizeForComparison(opportunity.leadAgency.name),
    )
  ) {
    matchScore += 14;
    matchReasons.push("Organization path aligns with the lead agency.");
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
    opportunity.postedAt &&
    isSameIsoDate(opportunity.postedAt, result.postedDate)
  ) {
    matchScore += 12;
    matchReasons.push("Posted date matches.");
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

function selectCanonicalDuplicateCandidate(
  duplicateCandidates: SourceImportDuplicateCandidate[],
) {
  return (
    duplicateCandidates.find((candidate) =>
      AUTO_CANONICALIZE_MATCH_KINDS.has(candidate.matchKind),
    ) ?? null
  );
}

function buildCanonicalOpportunityUpdateInput({
  agencyId,
  existingOpportunity,
  preview,
  result,
  sourceRecordId,
}: {
  agencyId: string | null;
  existingOpportunity: OpportunityCanonicalizationRecord;
  preview: SourceImportPreview;
  result: SourceSearchResultSummary;
  sourceRecordId: string;
}) {
  const createInput = buildOpportunityCreateInput({
    agencyId,
    occurredAt: new Date("1970-01-01T00:00:00.000Z"),
    organizationId: existingOpportunity.organizationId,
    preview,
    result,
    sourceRecordId,
  });
  const data: Prisma.OpportunityUncheckedUpdateInput = {};
  const changedFields: Array<{
    field: string;
    from: string | null;
    to: string | null;
  }> = [];

  applyCanonicalField({
    data,
    changedFields,
    existingValue: existingOpportunity.importedFromSourceRecordId,
    field: "importedFromSourceRecordId",
    nextValue:
      existingOpportunity.importedFromSourceRecordId === null
        ? createInput.importedFromSourceRecordId
        : null,
  });
  applyCanonicalField({
    data,
    changedFields,
    existingValue: existingOpportunity.originSourceSystem,
    field: "originSourceSystem",
    nextValue:
      existingOpportunity.originSourceSystem === null
        ? createInput.originSourceSystem
        : null,
  });
  applyCanonicalField({
    data,
    changedFields,
    existingValue: existingOpportunity.leadAgencyId,
    field: "leadAgencyId",
    nextValue: existingOpportunity.leadAgencyId === null ? createInput.leadAgencyId : null,
  });
  applyCanonicalField({
    data,
    changedFields,
    existingValue: existingOpportunity.externalNoticeId,
    field: "externalNoticeId",
    nextValue:
      isBlankText(existingOpportunity.externalNoticeId)
        ? createInput.externalNoticeId
        : null,
  });
  applyCanonicalField({
    data,
    changedFields,
    existingValue: existingOpportunity.solicitationNumber,
    field: "solicitationNumber",
    nextValue:
      isBlankText(existingOpportunity.solicitationNumber)
        ? createInput.solicitationNumber
        : null,
  });
  applyCanonicalField({
    data,
    changedFields,
    existingValue: existingOpportunity.description,
    field: "description",
    nextValue:
      isBlankText(existingOpportunity.description) ? createInput.description : null,
  });
  applyCanonicalField({
    data,
    changedFields,
    existingValue: existingOpportunity.sourceSummaryText,
    field: "sourceSummaryText",
    nextValue:
      isBlankText(existingOpportunity.sourceSummaryText)
        ? createInput.sourceSummaryText
        : null,
  });
  applyCanonicalField({
    data,
    changedFields,
    existingValue: existingOpportunity.sourceSummaryUrl,
    field: "sourceSummaryUrl",
    nextValue:
      isBlankText(existingOpportunity.sourceSummaryUrl)
        ? createInput.sourceSummaryUrl
        : null,
  });
  applyCanonicalField({
    data,
    changedFields,
    existingValue: existingOpportunity.postedAt,
    field: "postedAt",
    nextValue: existingOpportunity.postedAt === null ? createInput.postedAt : null,
  });
  applyCanonicalField({
    data,
    changedFields,
    existingValue: existingOpportunity.postedDateRaw,
    field: "postedDateRaw",
    nextValue:
      isBlankText(existingOpportunity.postedDateRaw) ? createInput.postedDateRaw : null,
  });
  applyCanonicalField({
    data,
    changedFields,
    existingValue: existingOpportunity.responseDeadlineAt,
    field: "responseDeadlineAt",
    nextValue:
      existingOpportunity.responseDeadlineAt === null
        ? createInput.responseDeadlineAt
        : null,
  });
  applyCanonicalField({
    data,
    changedFields,
    existingValue: existingOpportunity.responseDeadlineRaw,
    field: "responseDeadlineRaw",
    nextValue:
      isBlankText(existingOpportunity.responseDeadlineRaw)
        ? createInput.responseDeadlineRaw
        : null,
  });
  applyCanonicalField({
    data,
    changedFields,
    existingValue: existingOpportunity.procurementTypeLabel,
    field: "procurementTypeLabel",
    nextValue:
      isBlankText(existingOpportunity.procurementTypeLabel)
        ? createInput.procurementTypeLabel
        : null,
  });
  applyCanonicalField({
    data,
    changedFields,
    existingValue: existingOpportunity.procurementBaseTypeLabel,
    field: "procurementBaseTypeLabel",
    nextValue:
      isBlankText(existingOpportunity.procurementBaseTypeLabel)
        ? createInput.procurementBaseTypeLabel
        : null,
  });
  applyCanonicalField({
    data,
    changedFields,
    existingValue: existingOpportunity.archiveType,
    field: "archiveType",
    nextValue:
      isBlankText(existingOpportunity.archiveType) ? createInput.archiveType : null,
  });
  applyCanonicalField({
    data,
    changedFields,
    existingValue: existingOpportunity.archivedAt,
    field: "archivedAt",
    nextValue:
      existingOpportunity.archivedAt === null ? createInput.archivedAt : null,
  });
  applyCanonicalField({
    data,
    changedFields,
    existingValue: existingOpportunity.archiveDateRaw,
    field: "archiveDateRaw",
    nextValue:
      isBlankText(existingOpportunity.archiveDateRaw)
        ? createInput.archiveDateRaw
        : null,
  });
  applyCanonicalField({
    data,
    changedFields,
    existingValue: existingOpportunity.sourceStatus,
    field: "sourceStatus",
    nextValue:
      isBlankText(existingOpportunity.sourceStatus) ? createInput.sourceStatus : null,
  });
  applyCanonicalField({
    data,
    changedFields,
    existingValue: existingOpportunity.naicsCode,
    field: "naicsCode",
    nextValue:
      isBlankText(existingOpportunity.naicsCode) ? createInput.naicsCode : null,
  });
  applyCanonicalField({
    data,
    changedFields,
    existingValue: existingOpportunity.classificationCode,
    field: "classificationCode",
    nextValue:
      isBlankText(existingOpportunity.classificationCode)
        ? createInput.classificationCode
        : null,
  });
  applyCanonicalField({
    data,
    changedFields,
    existingValue: existingOpportunity.setAsideCode,
    field: "setAsideCode",
    nextValue:
      isBlankText(existingOpportunity.setAsideCode)
        ? createInput.setAsideCode
        : null,
  });
  applyCanonicalField({
    data,
    changedFields,
    existingValue: existingOpportunity.setAsideDescription,
    field: "setAsideDescription",
    nextValue:
      isBlankText(existingOpportunity.setAsideDescription)
        ? createInput.setAsideDescription
        : null,
  });
  applyCanonicalField({
    data,
    changedFields,
    existingValue: existingOpportunity.organizationType,
    field: "organizationType",
    nextValue:
      isBlankText(existingOpportunity.organizationType)
        ? createInput.organizationType
        : null,
  });
  applyCanonicalField({
    data,
    changedFields,
    existingValue: existingOpportunity.officeCity,
    field: "officeCity",
    nextValue:
      isBlankText(existingOpportunity.officeCity) ? createInput.officeCity : null,
  });
  applyCanonicalField({
    data,
    changedFields,
    existingValue: existingOpportunity.officeState,
    field: "officeState",
    nextValue:
      isBlankText(existingOpportunity.officeState) ? createInput.officeState : null,
  });
  applyCanonicalField({
    data,
    changedFields,
    existingValue: existingOpportunity.officePostalCode,
    field: "officePostalCode",
    nextValue:
      isBlankText(existingOpportunity.officePostalCode)
        ? createInput.officePostalCode
        : null,
  });
  applyCanonicalField({
    data,
    changedFields,
    existingValue: existingOpportunity.officeCountryCode,
    field: "officeCountryCode",
    nextValue:
      isBlankText(existingOpportunity.officeCountryCode)
        ? createInput.officeCountryCode
        : null,
  });
  applyCanonicalField({
    data,
    changedFields,
    existingValue: existingOpportunity.placeOfPerformanceStreet1,
    field: "placeOfPerformanceStreet1",
    nextValue:
      isBlankText(existingOpportunity.placeOfPerformanceStreet1)
        ? createInput.placeOfPerformanceStreet1
        : null,
  });
  applyCanonicalField({
    data,
    changedFields,
    existingValue: existingOpportunity.placeOfPerformanceStreet2,
    field: "placeOfPerformanceStreet2",
    nextValue:
      isBlankText(existingOpportunity.placeOfPerformanceStreet2)
        ? createInput.placeOfPerformanceStreet2
        : null,
  });
  applyCanonicalField({
    data,
    changedFields,
    existingValue: existingOpportunity.placeOfPerformanceCityCode,
    field: "placeOfPerformanceCityCode",
    nextValue:
      isBlankText(existingOpportunity.placeOfPerformanceCityCode)
        ? createInput.placeOfPerformanceCityCode
        : null,
  });
  applyCanonicalField({
    data,
    changedFields,
    existingValue: existingOpportunity.placeOfPerformanceCityName,
    field: "placeOfPerformanceCityName",
    nextValue:
      isBlankText(existingOpportunity.placeOfPerformanceCityName)
        ? createInput.placeOfPerformanceCityName
        : null,
  });
  applyCanonicalField({
    data,
    changedFields,
    existingValue: existingOpportunity.placeOfPerformanceStateCode,
    field: "placeOfPerformanceStateCode",
    nextValue:
      isBlankText(existingOpportunity.placeOfPerformanceStateCode)
        ? createInput.placeOfPerformanceStateCode
        : null,
  });
  applyCanonicalField({
    data,
    changedFields,
    existingValue: existingOpportunity.placeOfPerformanceStateName,
    field: "placeOfPerformanceStateName",
    nextValue:
      isBlankText(existingOpportunity.placeOfPerformanceStateName)
        ? createInput.placeOfPerformanceStateName
        : null,
  });
  applyCanonicalField({
    data,
    changedFields,
    existingValue: existingOpportunity.placeOfPerformancePostalCode,
    field: "placeOfPerformancePostalCode",
    nextValue:
      isBlankText(existingOpportunity.placeOfPerformancePostalCode)
        ? createInput.placeOfPerformancePostalCode
        : null,
  });
  applyCanonicalField({
    data,
    changedFields,
    existingValue: existingOpportunity.placeOfPerformanceCountryCode,
    field: "placeOfPerformanceCountryCode",
    nextValue:
      isBlankText(existingOpportunity.placeOfPerformanceCountryCode)
        ? createInput.placeOfPerformanceCountryCode
        : null,
  });
  applyCanonicalField({
    data,
    changedFields,
    existingValue: existingOpportunity.additionalInfoUrl,
    field: "additionalInfoUrl",
    nextValue:
      isBlankText(existingOpportunity.additionalInfoUrl)
        ? createInput.additionalInfoUrl
        : null,
  });
  applyCanonicalField({
    data,
    changedFields,
    existingValue: existingOpportunity.uiLink,
    field: "uiLink",
    nextValue: isBlankText(existingOpportunity.uiLink) ? createInput.uiLink : null,
  });
  applyCanonicalField({
    data,
    changedFields,
    existingValue: existingOpportunity.apiSelfLink,
    field: "apiSelfLink",
    nextValue:
      isBlankText(existingOpportunity.apiSelfLink)
        ? createInput.apiSelfLink
        : null,
  });

  return {
    data,
    changedFields,
  };
}

function applyCanonicalField({
  data,
  changedFields,
  existingValue,
  field,
  nextValue,
}: {
  data: Prisma.OpportunityUncheckedUpdateInput;
  changedFields: Array<{
    field: string;
    from: string | null;
    to: string | null;
  }>;
  existingValue: Date | string | null;
  field: keyof Prisma.OpportunityUncheckedUpdateInput;
  nextValue: Date | string | null | undefined;
}) {
  if (nextValue === undefined || nextValue === null) {
    return;
  }

  const existingSerialized = serializeMergeValue(existingValue);
  const nextSerialized = serializeMergeValue(nextValue);

  if (existingSerialized === nextSerialized) {
    return;
  }

  data[field] = nextValue;
  changedFields.push({
    field,
    from: existingSerialized,
    to: nextSerialized,
  });
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
  preview: SourceImportPreview;
  result: SourceSearchResultSummary;
  sourceRecordId: string;
}): Prisma.OpportunityUncheckedCreateInput {
  return {
    additionalInfoUrl: readString(preview.normalizedPayload.additionalInfoUrl),
    apiSelfLink: preview.sourceDetailUrl,
    archiveDateRaw: readString(preview.rawPayload.archiveDate),
    archiveType: readString(preview.rawPayload.archiveType),
    archivedAt: parseNullableDate(readString(preview.rawPayload.archiveDate)),
    classificationCode: readString(preview.normalizedPayload.classificationCode),
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
    naicsCode:
      readString(preview.normalizedPayload.naicsCode) ??
      readString(preview.rawPayload.naicsCode),
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
    procurementBaseTypeLabel: readString(
      preview.normalizedPayload.procurementBaseTypeLabel,
    ),
    procurementTypeLabel: result.procurementTypeLabel,
    responseDeadlineAt: result.responseDeadline
      ? parseNullableDate(`${result.responseDeadline}T21:00:00.000Z`)
      : null,
    responseDeadlineRaw: readString(preview.rawPayload.responseDeadLine),
    setAsideCode: readString(preview.normalizedPayload.setAsideCode),
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
  result: SourceSearchResultSummary;
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

function isBlankText(value: string | null | undefined) {
  return value === null || value === undefined || value.trim().length === 0;
}

function serializeMergeValue(value: Date | string | null | undefined) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return null;
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

function toIsoDate(value: string | null) {
  if (!value) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!match) {
    return null;
  }

  const [, month, day, year] = match;
  return `${year}-${month}-${day}`;
}

function readString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function readRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readNestedString(value: unknown, path: string[]) {
  let current: unknown = value;

  for (const segment of path) {
    const record = readRecord(current);
    if (!record) {
      return null;
    }
    current = record[segment];
  }

  return readString(current);
}

function readStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : null;
}

function asJsonValue(value: Record<string, unknown>) {
  return value as Prisma.InputJsonValue;
}
