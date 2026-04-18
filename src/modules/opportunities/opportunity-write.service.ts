import {
  AuditActorType,
  Prisma,
  type BidDecisionOutcome,
  type SourceExecutionActorType,
  type SourceImportDecisionMode,
  type SourceImportDecisionStatus,
} from "@prisma/client";

import {
  AUDIT_ACTIONS,
  recordAuditEvent,
  type AuditActorContext,
  type AuditLogWriter,
} from "@/modules/audit/audit.service";
import {
  validateOpportunityStageTransition,
  type OpportunityStageValidationContext,
} from "@/modules/opportunities/opportunity-stage-policy";

type OpportunityWriteRecord = {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  leadAgencyId: string | null;
  responseDeadlineAt: Date | null;
  solicitationNumber: string | null;
  naicsCode: string | null;
  originSourceSystem: string | null;
  currentStageKey: string | null;
  currentStageLabel: string | null;
};

type SourceRecordAuditRecord = {
  id: string;
  organizationId: string;
  sourceRecordId: string;
  sourceSystem: string;
};

type StageTransitionRecord = {
  id: string;
  transitionedAt: Date;
  toStageKey: string;
  toStageLabel: string | null;
};

type OpportunityActivityEventRecord = {
  id: string;
};

type BidDecisionRecord = {
  id: string;
  decisionTypeKey: string | null;
  recommendationOutcome: BidDecisionOutcome | null;
  finalOutcome: BidDecisionOutcome | null;
  decidedAt: Date | null;
};

type OpportunityStageValidationRecord = OpportunityWriteRecord & {
  bidDecisions: Array<{
    finalOutcome: BidDecisionOutcome | null;
  }>;
  documents: Array<{
    id: string;
  }>;
  milestones: Array<{
    id: string;
  }>;
  notes: Array<{
    id: string;
  }>;
  scorecards: Array<{
    id: string;
  }>;
  tasks: Array<{
    id: string;
  }>;
};

type SourceImportDecisionRecord = {
  id: string;
  organizationId: string;
  sourceRecordId: string;
  targetOpportunityId: string | null;
  mode: SourceImportDecisionMode;
  status: SourceImportDecisionStatus;
  decidedAt: Date | null;
};

const opportunityAuditSelect = {
  id: true,
  organizationId: true,
  title: true,
  description: true,
  leadAgencyId: true,
  responseDeadlineAt: true,
  solicitationNumber: true,
  naicsCode: true,
  originSourceSystem: true,
  currentStageKey: true,
  currentStageLabel: true,
} as const;

const sourceRecordAuditSelect = {
  id: true,
  organizationId: true,
  sourceRecordId: true,
  sourceSystem: true,
} as const;

const bidDecisionAuditSelect = {
  id: true,
  decisionTypeKey: true,
  recommendationOutcome: true,
  finalOutcome: true,
  decidedAt: true,
} as const;

const opportunityStageValidationSelect = {
  ...opportunityAuditSelect,
  bidDecisions: {
    where: {
      isCurrent: true,
    },
    orderBy: {
      decidedAt: "desc",
    },
    take: 1,
    select: {
      finalOutcome: true,
    },
  },
  documents: {
    take: 1,
    select: {
      id: true,
    },
  },
  milestones: {
    take: 1,
    select: {
      id: true,
    },
  },
  notes: {
    take: 1,
    select: {
      id: true,
    },
  },
  scorecards: {
    where: {
      isCurrent: true,
    },
    take: 1,
    select: {
      id: true,
    },
  },
  tasks: {
    take: 1,
    select: {
      id: true,
    },
  },
} as const;

const sourceImportDecisionAuditSelect = {
  id: true,
  organizationId: true,
  sourceRecordId: true,
  targetOpportunityId: true,
  mode: true,
  status: true,
  decidedAt: true,
} as const;

const stageTransitionAuditSelect = {
  id: true,
  transitionedAt: true,
  toStageKey: true,
  toStageLabel: true,
} as const;

export type OpportunityWriteTransactionClient = AuditLogWriter & {
  opportunityActivityEvent: {
    create(args: {
      data: Prisma.OpportunityActivityEventUncheckedCreateInput;
      select: {
        id: true;
      };
    }): Promise<OpportunityActivityEventRecord>;
  };
  opportunity: {
    create(args: {
      data: Prisma.OpportunityUncheckedCreateInput;
      select: typeof opportunityAuditSelect;
    }): Promise<OpportunityWriteRecord>;
    findFirstOrThrow(args: {
      where: {
        id: string;
        organizationId: string;
      };
      select: typeof opportunityAuditSelect;
    }): Promise<OpportunityWriteRecord>;
    findFirstOrThrow(args: {
      where: {
        id: string;
        organizationId: string;
      };
      select: typeof opportunityStageValidationSelect;
    }): Promise<OpportunityStageValidationRecord>;
    update(args: {
      where: {
        id: string;
      };
      data: Prisma.OpportunityUncheckedUpdateInput;
      select: typeof opportunityAuditSelect;
    }): Promise<OpportunityWriteRecord>;
    delete(args: {
      where: {
        id: string;
      };
      select: Pick<typeof opportunityAuditSelect, "id" | "organizationId" | "title">;
    }): Promise<Pick<OpportunityWriteRecord, "id" | "organizationId" | "title">>;
  };
  opportunityStageTransition: {
    create(args: {
      data: Prisma.OpportunityStageTransitionUncheckedCreateInput;
      select: typeof stageTransitionAuditSelect;
    }): Promise<StageTransitionRecord>;
  };
  bidDecision: {
    updateMany(args: {
      where: {
        organizationId: string;
        opportunityId: string;
        isCurrent: boolean;
      };
      data: Prisma.BidDecisionUncheckedUpdateManyInput;
    }): Promise<{ count: number }>;
    create(args: {
      data: Prisma.BidDecisionUncheckedCreateInput;
      select: typeof bidDecisionAuditSelect;
    }): Promise<BidDecisionRecord>;
  };
  sourceRecord: {
    findFirstOrThrow(args: {
      where: {
        id: string;
        organizationId: string;
      };
      select: typeof sourceRecordAuditSelect;
    }): Promise<SourceRecordAuditRecord>;
  };
  sourceImportDecision: {
    create(args: {
      data: Prisma.SourceImportDecisionUncheckedCreateInput;
      select: typeof sourceImportDecisionAuditSelect;
    }): Promise<SourceImportDecisionRecord>;
  };
};

export type OpportunityWriteClient = OpportunityWriteTransactionClient & {
  $transaction<T>(
    callback: (tx: OpportunityWriteTransactionClient) => Promise<T>,
  ): Promise<T>;
};

export type OpportunityWriteActor = AuditActorContext & {
  organizationId: string;
};

export type CreateOpportunityInput = {
  actor: OpportunityWriteActor;
  title: string;
  description?: string | null;
  leadAgencyId?: string | null;
  responseDeadlineAt?: Date | null;
  solicitationNumber?: string | null;
  naicsCode?: string | null;
  originSourceSystem?: string | null;
  currentStageKey?: string | null;
  currentStageLabel?: string | null;
  occurredAt?: Date;
};

export type UpdateOpportunityInput = {
  actor: OpportunityWriteActor;
  opportunityId: string;
  title?: string;
  description?: string | null;
  leadAgencyId?: string | null;
  responseDeadlineAt?: Date | null;
  solicitationNumber?: string | null;
  naicsCode?: string | null;
  occurredAt?: Date;
};

export type DeleteOpportunityInput = {
  actor: OpportunityWriteActor;
  opportunityId: string;
  occurredAt?: Date;
};

export type RecordStageTransitionInput = {
  actor: OpportunityWriteActor;
  opportunityId: string;
  toStageKey: string;
  toStageLabel?: string | null;
  rationale?: string | null;
  requiredFieldsSnapshot?: Prisma.InputJsonValue | null;
  metadata?: Prisma.InputJsonValue | null;
  transitionedAt?: Date;
};

export type RecordBidDecisionInput = {
  actor: OpportunityWriteActor;
  opportunityId: string;
  scorecardId?: string | null;
  decisionTypeKey?: string | null;
  recommendationOutcome?: BidDecisionOutcome | null;
  recommendationSummary?: string | null;
  recommendationMetadata?: Prisma.InputJsonValue | null;
  finalOutcome?: BidDecisionOutcome | null;
  finalRationale?: string | null;
  decisionMetadata?: Prisma.InputJsonValue | null;
  recommendedAt?: Date | null;
  decidedAt?: Date | null;
  occurredAt?: Date;
};

export type RecordSourceImportDecisionInput = {
  actor: OpportunityWriteActor;
  sourceRecordId: string;
  sourceConnectorConfigId?: string | null;
  targetOpportunityId?: string | null;
  requestedByActorType?: SourceExecutionActorType;
  mode: SourceImportDecisionMode;
  status: SourceImportDecisionStatus;
  rationale?: string | null;
  decisionMetadata?: Prisma.InputJsonValue | null;
  importPreviewPayload?: Prisma.InputJsonValue | null;
  requestedAt?: Date;
  decidedAt?: Date | null;
  occurredAt?: Date;
};

export async function createOpportunity({
  db,
  input,
}: {
  db: OpportunityWriteClient;
  input: CreateOpportunityInput;
}) {
  return db.$transaction(async (tx) => {
    const title = normalizeRequiredText(input.title, "Opportunity title");
    const stageKey = normalizeOptionalText(input.currentStageKey);
    const stageLabel =
      normalizeOptionalText(input.currentStageLabel) ??
      humanizeStageKey(stageKey);
    const occurredAt = input.occurredAt ?? new Date();

    const opportunity = await tx.opportunity.create({
      data: {
        organizationId: input.actor.organizationId,
        title,
        description: normalizeOptionalText(input.description),
        leadAgencyId: input.leadAgencyId ?? null,
        responseDeadlineAt: input.responseDeadlineAt ?? null,
        solicitationNumber: normalizeOptionalText(input.solicitationNumber),
        naicsCode: normalizeOptionalText(input.naicsCode),
        originSourceSystem: normalizeOptionalText(input.originSourceSystem),
        currentStageKey: stageKey,
        currentStageLabel: stageLabel,
        currentStageChangedAt: stageKey ? occurredAt : null,
      },
      select: opportunityAuditSelect,
    });

    await recordAuditEvent({
      db: tx,
      event: {
        organizationId: opportunity.organizationId,
        actor: input.actor,
        action: AUDIT_ACTIONS.opportunityCreate,
        target: {
          type: "opportunity",
          id: opportunity.id,
          display: opportunity.title,
        },
        summary: `Created opportunity ${opportunity.title}.`,
        metadata: {
          originSourceSystem: opportunity.originSourceSystem,
          currentStageKey: opportunity.currentStageKey,
          currentStageLabel: opportunity.currentStageLabel,
          leadAgencyId: opportunity.leadAgencyId,
        },
        occurredAt,
      },
    });

    return opportunity;
  });
}

export async function updateOpportunity({
  db,
  input,
}: {
  db: OpportunityWriteClient;
  input: UpdateOpportunityInput;
}) {
  return db.$transaction(async (tx) => {
    const existingOpportunity = await tx.opportunity.findFirstOrThrow({
      where: {
        id: input.opportunityId,
        organizationId: input.actor.organizationId,
      },
      select: opportunityAuditSelect,
    });

    const nextValues = {
      title:
        input.title === undefined
          ? existingOpportunity.title
          : normalizeRequiredText(input.title, "Opportunity title"),
      description:
        input.description === undefined
          ? existingOpportunity.description
          : normalizeOptionalText(input.description),
      leadAgencyId:
        input.leadAgencyId === undefined
          ? existingOpportunity.leadAgencyId
          : input.leadAgencyId,
      responseDeadlineAt:
        input.responseDeadlineAt === undefined
          ? existingOpportunity.responseDeadlineAt
          : input.responseDeadlineAt,
      solicitationNumber:
        input.solicitationNumber === undefined
          ? existingOpportunity.solicitationNumber
          : normalizeOptionalText(input.solicitationNumber),
      naicsCode:
        input.naicsCode === undefined
          ? existingOpportunity.naicsCode
          : normalizeOptionalText(input.naicsCode),
    };

    const changedFields = {
      title: buildFieldChange(existingOpportunity.title, nextValues.title),
      description: buildFieldChange(
        existingOpportunity.description,
        nextValues.description,
      ),
      leadAgencyId: buildFieldChange(
        existingOpportunity.leadAgencyId,
        nextValues.leadAgencyId,
      ),
      responseDeadlineAt: buildFieldChange(
        existingOpportunity.responseDeadlineAt,
        nextValues.responseDeadlineAt,
      ),
      solicitationNumber: buildFieldChange(
        existingOpportunity.solicitationNumber,
        nextValues.solicitationNumber,
      ),
      naicsCode: buildFieldChange(
        existingOpportunity.naicsCode,
        nextValues.naicsCode,
      ),
    };

    const auditChanges = Object.fromEntries(
      Object.entries(changedFields).filter(([, value]) => value !== null),
    );

    const updatedOpportunity = await tx.opportunity.update({
      where: {
        id: existingOpportunity.id,
      },
      data: nextValues,
      select: opportunityAuditSelect,
    });

    if (Object.keys(auditChanges).length > 0) {
      await recordAuditEvent({
        db: tx,
        event: {
          organizationId: updatedOpportunity.organizationId,
          actor: input.actor,
          action: AUDIT_ACTIONS.opportunityUpdate,
          target: {
            type: "opportunity",
            id: updatedOpportunity.id,
            display: updatedOpportunity.title,
          },
          summary: `Updated opportunity ${updatedOpportunity.title}.`,
          metadata: {
            changedFields: auditChanges,
          },
          occurredAt: input.occurredAt ?? new Date(),
        },
      });
    }

    return updatedOpportunity;
  });
}

export async function deleteOpportunity({
  db,
  input,
}: {
  db: OpportunityWriteClient;
  input: DeleteOpportunityInput;
}) {
  return db.$transaction(async (tx) => {
    await tx.opportunity.findFirstOrThrow({
      where: {
        id: input.opportunityId,
        organizationId: input.actor.organizationId,
      },
      select: opportunityAuditSelect,
    });

    const deletedOpportunity = await tx.opportunity.delete({
      where: {
        id: input.opportunityId,
      },
      select: {
        id: true,
        organizationId: true,
        title: true,
      },
    });

    await recordAuditEvent({
      db: tx,
      event: {
        organizationId: deletedOpportunity.organizationId,
        actor: input.actor,
        action: AUDIT_ACTIONS.opportunityDelete,
        target: {
          type: "opportunity",
          id: deletedOpportunity.id,
          display: deletedOpportunity.title,
        },
        summary: `Deleted opportunity ${deletedOpportunity.title}.`,
        occurredAt: input.occurredAt ?? new Date(),
      },
    });

    return deletedOpportunity;
  });
}

export async function recordStageTransition({
  db,
  input,
}: {
  db: OpportunityWriteClient;
  input: RecordStageTransitionInput;
}) {
  return db.$transaction(async (tx) => {
    const existingOpportunity = await tx.opportunity.findFirstOrThrow({
      where: {
        id: input.opportunityId,
        organizationId: input.actor.organizationId,
      },
      select: opportunityStageValidationSelect,
    });

    const transitionedAt = input.transitionedAt ?? new Date();
    const validation = validateOpportunityStageTransition({
      context: buildOpportunityStageValidationContext(
        existingOpportunity as OpportunityStageValidationRecord,
      ),
      rationale: input.rationale,
      toStageKey: normalizeRequiredText(input.toStageKey, "Stage key"),
    });
    const toStageKey = validation.toStageKey;
    const toStageLabel = validation.toStageLabel;

    const updatedOpportunity = await tx.opportunity.update({
      where: {
        id: existingOpportunity.id,
      },
      data: {
        currentStageKey: toStageKey,
        currentStageLabel: toStageLabel,
        currentStageChangedAt: transitionedAt,
      },
      select: opportunityAuditSelect,
    });

    const transition = await tx.opportunityStageTransition.create({
      data: {
        organizationId: updatedOpportunity.organizationId,
        opportunityId: updatedOpportunity.id,
        actorUserId:
          input.actor.type === AuditActorType.USER ? input.actor.userId ?? null : null,
        fromStageKey: existingOpportunity.currentStageKey,
        fromStageLabel: existingOpportunity.currentStageLabel,
        toStageKey,
        toStageLabel,
        rationale: validation.rationale,
        requiredFieldsSnapshot: validation.requiredFieldsSnapshot,
        metadata: toOptionalJson(input.metadata),
        transitionedAt,
      },
      select: stageTransitionAuditSelect,
    });

    await tx.opportunityActivityEvent.create({
      data: {
        actorIdentifier: input.actor.identifier ?? null,
        actorType: input.actor.type,
        actorUserId:
          input.actor.type === AuditActorType.USER ? input.actor.userId ?? null : null,
        description: validation.rationale,
        eventType: "stage_transition",
        metadata: {
          fromStageKey: validation.fromStageKey,
          fromStageLabel: validation.fromStageLabel,
          requiredFieldsSnapshot: validation.requiredFieldsSnapshot,
          toStageKey: transition.toStageKey,
          toStageLabel: transition.toStageLabel,
        },
        occurredAt: transitionedAt,
        opportunityId: updatedOpportunity.id,
        organizationId: updatedOpportunity.organizationId,
        relatedEntityId: transition.id,
        relatedEntityType: "stage_transition",
        title: `Moved to ${transition.toStageLabel ?? transition.toStageKey}`,
      },
      select: {
        id: true,
      },
    });

    await recordAuditEvent({
      db: tx,
      event: {
        organizationId: updatedOpportunity.organizationId,
        actor: input.actor,
        action: AUDIT_ACTIONS.opportunityStageTransition,
        target: {
          type: "opportunity",
          id: updatedOpportunity.id,
          display: updatedOpportunity.title,
        },
        summary: `Moved opportunity ${updatedOpportunity.title} to ${transition.toStageLabel ?? transition.toStageKey}.`,
        metadata: {
          transitionId: transition.id,
          fromStageKey: existingOpportunity.currentStageKey,
          fromStageLabel: existingOpportunity.currentStageLabel,
          toStageKey: transition.toStageKey,
          toStageLabel: transition.toStageLabel,
          rationale: validation.rationale,
          requiredFieldsSnapshot: validation.requiredFieldsSnapshot,
        },
        occurredAt: transitionedAt,
      },
    });

    return {
      opportunity: updatedOpportunity,
      transition,
    };
  });
}

export async function recordBidDecision({
  db,
  input,
}: {
  db: OpportunityWriteClient;
  input: RecordBidDecisionInput;
}) {
  return db.$transaction(async (tx) => {
    const opportunity = await tx.opportunity.findFirstOrThrow({
      where: {
        id: input.opportunityId,
        organizationId: input.actor.organizationId,
      },
      select: opportunityAuditSelect,
    });

    const recommendedAt = input.recommendedAt ?? input.occurredAt ?? new Date();
    const decidedAt =
      input.decidedAt ?? input.occurredAt ?? (input.finalOutcome ? new Date() : null);

    await tx.bidDecision.updateMany({
      where: {
        organizationId: opportunity.organizationId,
        opportunityId: opportunity.id,
        isCurrent: true,
      },
      data: {
        isCurrent: false,
      },
    });

    const bidDecision = await tx.bidDecision.create({
      data: {
        organizationId: opportunity.organizationId,
        opportunityId: opportunity.id,
        scorecardId: input.scorecardId ?? null,
        decisionTypeKey: normalizeOptionalText(input.decisionTypeKey),
        recommendationOutcome: input.recommendationOutcome ?? null,
        recommendationSummary: normalizeOptionalText(input.recommendationSummary),
        recommendationMetadata: toOptionalJson(input.recommendationMetadata),
        recommendedByActorType: input.actor.type,
        recommendedByUserId:
          input.actor.type === AuditActorType.USER ? input.actor.userId ?? null : null,
        recommendedByIdentifier: input.actor.identifier ?? null,
        recommendedAt,
        finalOutcome: input.finalOutcome ?? null,
        finalRationale: normalizeOptionalText(input.finalRationale),
        decisionMetadata: toOptionalJson(input.decisionMetadata),
        decidedAt,
        isCurrent: true,
      },
      select: bidDecisionAuditSelect,
    });

    await recordAuditEvent({
      db: tx,
      event: {
        organizationId: opportunity.organizationId,
        actor: input.actor,
        action: AUDIT_ACTIONS.opportunityDecisionRecord,
        target: {
          type: "opportunity",
          id: opportunity.id,
          display: opportunity.title,
        },
        summary: `Recorded bid decision for ${opportunity.title}.`,
        metadata: {
          decisionId: bidDecision.id,
          decisionTypeKey: bidDecision.decisionTypeKey,
          recommendationOutcome: bidDecision.recommendationOutcome,
          finalOutcome: bidDecision.finalOutcome,
          scorecardId: input.scorecardId ?? null,
        },
        occurredAt: bidDecision.decidedAt ?? recommendedAt,
      },
    });

    return bidDecision;
  });
}

export async function recordSourceImportDecision({
  db,
  input,
}: {
  db: OpportunityWriteClient;
  input: RecordSourceImportDecisionInput;
}) {
  return db.$transaction(async (tx) => {
    const sourceRecord = await tx.sourceRecord.findFirstOrThrow({
      where: {
        id: input.sourceRecordId,
        organizationId: input.actor.organizationId,
      },
      select: sourceRecordAuditSelect,
    });

    const importDecision = await tx.sourceImportDecision.create({
      data: {
        organizationId: sourceRecord.organizationId,
        sourceConnectorConfigId: input.sourceConnectorConfigId ?? null,
        sourceRecordId: sourceRecord.id,
        targetOpportunityId: input.targetOpportunityId ?? null,
        requestedByUserId:
          input.actor.type === AuditActorType.USER ? input.actor.userId ?? null : null,
        decidedByUserId:
          input.actor.type === AuditActorType.USER ? input.actor.userId ?? null : null,
        requestedByActorType: input.requestedByActorType ?? "USER",
        mode: input.mode,
        status: input.status,
        rationale: normalizeOptionalText(input.rationale),
        decisionMetadata: toOptionalJson(input.decisionMetadata),
        importPreviewPayload: toOptionalJson(input.importPreviewPayload),
        requestedAt: input.requestedAt ?? new Date(),
        decidedAt: input.decidedAt ?? null,
      },
      select: sourceImportDecisionAuditSelect,
    });

    await recordAuditEvent({
      db: tx,
      event: {
        organizationId: importDecision.organizationId,
        actor: input.actor,
        action: AUDIT_ACTIONS.sourceImportDecisionRecord,
        target: {
          type: "source_import_decision",
          id: importDecision.id,
          display: `${sourceRecord.sourceSystem}:${sourceRecord.sourceRecordId}`,
        },
        summary: `Recorded ${importDecision.mode.toLowerCase()} import decision for ${sourceRecord.sourceSystem}:${sourceRecord.sourceRecordId}.`,
        metadata: {
          sourceRecordId: sourceRecord.id,
          sourceExternalRecordId: sourceRecord.sourceRecordId,
          sourceSystem: sourceRecord.sourceSystem,
          targetOpportunityId: importDecision.targetOpportunityId,
          mode: importDecision.mode,
          status: importDecision.status,
        },
        occurredAt:
          importDecision.decidedAt ??
          input.occurredAt ??
          input.requestedAt ??
          new Date(),
      },
    });

    return importDecision;
  });
}

function normalizeRequiredText(value: string, fieldName: string) {
  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    throw new Error(`${fieldName} is required.`);
  }

  return normalizedValue;
}

function normalizeOptionalText(value: string | null | undefined) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalizedValue = value.trim();

  return normalizedValue.length === 0 ? null : normalizedValue;
}

function buildOpportunityStageValidationContext(
  opportunity: OpportunityStageValidationRecord,
): OpportunityStageValidationContext {
  return {
    bidDecisionCount: opportunity.bidDecisions.length,
    currentBidDecisionFinalOutcome:
      opportunity.bidDecisions[0]?.finalOutcome ?? null,
    currentStageKey: opportunity.currentStageKey,
    currentStageLabel: opportunity.currentStageLabel,
    documentCount: opportunity.documents.length,
    leadAgencyId: opportunity.leadAgencyId,
    milestoneCount: opportunity.milestones.length,
    naicsCode: opportunity.naicsCode,
    noteCount: opportunity.notes.length,
    responseDeadlineAt: opportunity.responseDeadlineAt?.toISOString() ?? null,
    scorecardCount: opportunity.scorecards.length,
    solicitationNumber: opportunity.solicitationNumber,
    taskCount: opportunity.tasks.length,
  };
}

function humanizeStageKey(stageKey: string | null) {
  if (!stageKey) {
    return null;
  }

  return stageKey
    .split("_")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function serializeAuditValue(value: string | Date | null) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

function buildFieldChange(
  previousValue: string | Date | null,
  nextValue: string | Date | null,
) {
  const serializedPreviousValue = serializeAuditValue(previousValue);
  const serializedNextValue = serializeAuditValue(nextValue);

  if (serializedPreviousValue === serializedNextValue) {
    return null;
  }

  return {
    from: serializedPreviousValue,
    to: serializedNextValue,
  };
}

function toOptionalJson(
  value: Prisma.InputJsonValue | null | undefined,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return Prisma.JsonNull;
  }

  return value;
}
