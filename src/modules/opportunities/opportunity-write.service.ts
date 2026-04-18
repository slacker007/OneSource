import {
  AuditActorType,
  Prisma,
  type BidDecisionOutcome,
  type OpportunityMilestoneStatus,
  type OpportunityTaskPriority,
  type OpportunityTaskStatus,
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
import {
  OPPORTUNITY_PROPOSAL_CHECKLIST_ITEMS,
  canTrackProposalForStage,
  type OpportunityProposalChecklistKey,
  type OpportunityProposalStatus,
} from "@/modules/opportunities/opportunity-proposal";

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

type OpportunityCloseoutRecord = {
  id: string;
  outcomeStageKey: string;
  outcomeStageLabel: string | null;
  recordedAt: Date;
  competitor: {
    id: string;
    name: string;
  } | null;
};

type OpportunityTaskAuditRecord = {
  id: string;
  organizationId: string;
  opportunityId: string;
  title: string;
  description: string | null;
  status: OpportunityTaskStatus;
  priority: OpportunityTaskPriority;
  dueAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  sortOrder: number;
  assigneeUserId: string | null;
  opportunity: {
    id: string;
    title: string;
  };
};

type OpportunityMilestoneAuditRecord = {
  id: string;
  organizationId: string;
  opportunityId: string;
  title: string;
  description: string | null;
  milestoneTypeKey: string | null;
  status: OpportunityMilestoneStatus;
  targetDate: Date;
  completedAt: Date | null;
  sortOrder: number;
  opportunity: {
    id: string;
    title: string;
  };
};

type OpportunityNoteAuditRecord = {
  id: string;
  organizationId: string;
  opportunityId: string;
  title: string | null;
  body: string;
  contentFormat: string;
  isPinned: boolean;
  opportunity: {
    id: string;
    title: string;
  };
};

type OpportunityDocumentAuditRecord = {
  id: string;
  organizationId: string;
  opportunityId: string;
  title: string;
  documentType: string | null;
  sourceType: string;
  sourceUrl: string | null;
  originalFileName: string | null;
  storageProvider: string | null;
  storagePath: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  checksumSha256: string | null;
  extractionStatus: string;
  extractedAt: Date | null;
  extractedText: string | null;
  metadata: Prisma.JsonValue | null;
  opportunity: {
    id: string;
    title: string;
  };
};

type OpportunityProposalAuditRecord = {
  id: string;
  organizationId: string;
  opportunityId: string;
  status: OpportunityProposalStatus;
  ownerUserId: string | null;
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  opportunity: {
    id: string;
    title: string;
    currentStageKey: string | null;
    currentStageLabel: string | null;
  };
  ownerUser: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  checklistItems: Array<{
    id: string;
    checklistKey: string;
    checklistLabel: string;
    isComplete: boolean;
    completedAt: Date | null;
    sortOrder: number;
  }>;
  linkedDocuments: Array<{
    document: {
      id: string;
      title: string;
    };
  }>;
};

type TaskAssigneeLookupRecord = {
  id: string;
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

const opportunityCloseoutAuditSelect = {
  id: true,
  outcomeStageKey: true,
  outcomeStageLabel: true,
  recordedAt: true,
  competitor: {
    select: {
      id: true,
      name: true,
    },
  },
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

const opportunityTaskAuditSelect = {
  id: true,
  organizationId: true,
  opportunityId: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  dueAt: true,
  startedAt: true,
  completedAt: true,
  sortOrder: true,
  assigneeUserId: true,
  opportunity: {
    select: {
      id: true,
      title: true,
    },
  },
} as const;

const opportunityMilestoneAuditSelect = {
  id: true,
  organizationId: true,
  opportunityId: true,
  title: true,
  description: true,
  milestoneTypeKey: true,
  status: true,
  targetDate: true,
  completedAt: true,
  sortOrder: true,
  opportunity: {
    select: {
      id: true,
      title: true,
    },
  },
} as const;

const opportunityNoteAuditSelect = {
  id: true,
  organizationId: true,
  opportunityId: true,
  title: true,
  body: true,
  contentFormat: true,
  isPinned: true,
  opportunity: {
    select: {
      id: true,
      title: true,
    },
  },
} as const;

const opportunityDocumentAuditSelect = {
  id: true,
  organizationId: true,
  opportunityId: true,
  title: true,
  documentType: true,
  sourceType: true,
  sourceUrl: true,
  originalFileName: true,
  storageProvider: true,
  storagePath: true,
  mimeType: true,
  fileSizeBytes: true,
  checksumSha256: true,
  extractionStatus: true,
  extractedAt: true,
  extractedText: true,
  metadata: true,
  opportunity: {
    select: {
      id: true,
      title: true,
    },
  },
} as const;

const opportunityProposalAuditSelect = {
  id: true,
  organizationId: true,
  opportunityId: true,
  status: true,
  ownerUserId: true,
  submittedAt: true,
  createdAt: true,
  updatedAt: true,
  opportunity: {
    select: {
      id: true,
      title: true,
      currentStageKey: true,
      currentStageLabel: true,
    },
  },
  ownerUser: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  checklistItems: {
    orderBy: [{ sortOrder: "asc" }, { checklistLabel: "asc" }],
    select: {
      id: true,
      checklistKey: true,
      checklistLabel: true,
      isComplete: true,
      completedAt: true,
      sortOrder: true,
    },
  },
  linkedDocuments: {
    orderBy: {
      document: {
        title: "asc",
      },
    },
    select: {
      document: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  },
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
  opportunityTask: {
    count(args: {
      where: {
        opportunityId: string;
        organizationId: string;
      };
    }): Promise<number>;
    create(args: {
      data: Prisma.OpportunityTaskUncheckedCreateInput;
      select: typeof opportunityTaskAuditSelect;
    }): Promise<OpportunityTaskAuditRecord>;
    findFirstOrThrow(args: {
      where: {
        id: string;
        organizationId: string;
      };
      select: typeof opportunityTaskAuditSelect;
    }): Promise<OpportunityTaskAuditRecord>;
    update(args: {
      where: {
        id: string;
      };
      data: Prisma.OpportunityTaskUncheckedUpdateInput;
      select: typeof opportunityTaskAuditSelect;
    }): Promise<OpportunityTaskAuditRecord>;
    delete(args: {
      where: {
        id: string;
      };
      select: typeof opportunityTaskAuditSelect;
    }): Promise<OpportunityTaskAuditRecord>;
  };
  opportunityMilestone: {
    count(args: {
      where: {
        opportunityId: string;
        organizationId: string;
      };
    }): Promise<number>;
    create(args: {
      data: Prisma.OpportunityMilestoneUncheckedCreateInput;
      select: typeof opportunityMilestoneAuditSelect;
    }): Promise<OpportunityMilestoneAuditRecord>;
    findFirstOrThrow(args: {
      where: {
        id: string;
        organizationId: string;
      };
      select: typeof opportunityMilestoneAuditSelect;
    }): Promise<OpportunityMilestoneAuditRecord>;
    update(args: {
      where: {
        id: string;
      };
      data: Prisma.OpportunityMilestoneUncheckedUpdateInput;
      select: typeof opportunityMilestoneAuditSelect;
    }): Promise<OpportunityMilestoneAuditRecord>;
    delete(args: {
      where: {
        id: string;
      };
      select: typeof opportunityMilestoneAuditSelect;
    }): Promise<OpportunityMilestoneAuditRecord>;
  };
  opportunityNote: {
    create(args: {
      data: Prisma.OpportunityNoteUncheckedCreateInput;
      select: typeof opportunityNoteAuditSelect;
    }): Promise<OpportunityNoteAuditRecord>;
  };
  opportunityDocument: {
    create(args: {
      data: Prisma.OpportunityDocumentUncheckedCreateInput;
      select: typeof opportunityDocumentAuditSelect;
    }): Promise<OpportunityDocumentAuditRecord>;
    findMany(args: {
      where: {
        id?: {
          in: string[];
        };
        opportunityId: string;
        organizationId: string;
      };
      select: {
        id: true;
        title: true;
      };
    }): Promise<Array<{ id: string; title: string }>>;
  };
  opportunityProposal: {
    create(args: {
      data: Prisma.OpportunityProposalUncheckedCreateInput;
      select: typeof opportunityProposalAuditSelect;
    }): Promise<OpportunityProposalAuditRecord>;
    findFirst(args: {
      where: {
        opportunityId: string;
        organizationId: string;
      };
      select: typeof opportunityProposalAuditSelect;
    }): Promise<OpportunityProposalAuditRecord | null>;
    findFirstOrThrow(args: {
      where: {
        id: string;
        organizationId: string;
      };
      select: typeof opportunityProposalAuditSelect;
    }): Promise<OpportunityProposalAuditRecord>;
    update(args: {
      where: {
        id: string;
      };
      data: Prisma.OpportunityProposalUncheckedUpdateInput;
      select: typeof opportunityProposalAuditSelect;
    }): Promise<OpportunityProposalAuditRecord>;
    delete(args: {
      where: {
        id: string;
      };
      select: typeof opportunityProposalAuditSelect;
    }): Promise<OpportunityProposalAuditRecord>;
  };
  opportunityProposalChecklistItem: {
    deleteMany(args: {
      where: {
        proposalId: string;
      };
    }): Promise<{ count: number }>;
    createMany(args: {
      data: Prisma.OpportunityProposalChecklistItemUncheckedCreateInput[];
    }): Promise<{ count: number }>;
  };
  opportunityProposalDocument: {
    deleteMany(args: {
      where: {
        proposalId: string;
      };
    }): Promise<{ count: number }>;
    createMany(args: {
      data: Prisma.OpportunityProposalDocumentUncheckedCreateInput[];
    }): Promise<{ count: number }>;
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
  opportunityCloseout: {
    updateMany(args: {
      where: {
        organizationId: string;
        opportunityId: string;
        isCurrent: boolean;
      };
      data: Prisma.OpportunityCloseoutUncheckedUpdateManyInput;
    }): Promise<{ count: number }>;
    create(args: {
      data: Prisma.OpportunityCloseoutUncheckedCreateInput;
      select: typeof opportunityCloseoutAuditSelect;
    }): Promise<OpportunityCloseoutRecord>;
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
  user: {
    findFirst(args: {
      where: {
        id: string;
        organizationId: string;
      };
      select: {
        id: true;
      };
    }): Promise<TaskAssigneeLookupRecord | null>;
  };
  competitor: {
    findFirst(args: {
      where: {
        id: string;
        organizationId: string;
      };
      select: {
        id: true;
      };
    }): Promise<TaskAssigneeLookupRecord | null>;
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

export type CreateOpportunityTaskInput = {
  actor: OpportunityWriteActor;
  opportunityId: string;
  title: string;
  description?: string | null;
  assigneeUserId?: string | null;
  dueAt?: Date | null;
  status?: OpportunityTaskStatus;
  priority?: OpportunityTaskPriority;
  metadata?: Prisma.InputJsonValue | null;
  occurredAt?: Date;
};

export type UpdateOpportunityTaskInput = {
  actor: OpportunityWriteActor;
  taskId: string;
  title?: string;
  description?: string | null;
  assigneeUserId?: string | null;
  dueAt?: Date | null;
  status?: OpportunityTaskStatus;
  priority?: OpportunityTaskPriority;
  metadata?: Prisma.InputJsonValue | null;
  occurredAt?: Date;
};

export type DeleteOpportunityTaskInput = {
  actor: OpportunityWriteActor;
  taskId: string;
  occurredAt?: Date;
};

export type CreateOpportunityMilestoneInput = {
  actor: OpportunityWriteActor;
  opportunityId: string;
  title: string;
  description?: string | null;
  milestoneTypeKey?: string | null;
  targetDate: Date;
  status?: OpportunityMilestoneStatus;
  metadata?: Prisma.InputJsonValue | null;
  occurredAt?: Date;
};

export type UpdateOpportunityMilestoneInput = {
  actor: OpportunityWriteActor;
  milestoneId: string;
  title?: string;
  description?: string | null;
  milestoneTypeKey?: string | null;
  targetDate?: Date;
  status?: OpportunityMilestoneStatus;
  metadata?: Prisma.InputJsonValue | null;
  occurredAt?: Date;
};

export type DeleteOpportunityMilestoneInput = {
  actor: OpportunityWriteActor;
  milestoneId: string;
  occurredAt?: Date;
};

export type CreateOpportunityNoteInput = {
  actor: OpportunityWriteActor;
  opportunityId: string;
  title?: string | null;
  body: string;
  isPinned?: boolean;
  contentFormat?: string | null;
  occurredAt?: Date;
};

export type CreateOpportunityDocumentInput = {
  actor: OpportunityWriteActor;
  opportunityId: string;
  title?: string | null;
  documentType?: string | null;
  sourceType?: "MANUAL_UPLOAD" | "SOURCE_ATTACHMENT" | "GENERATED" | "EXTERNAL_LINK";
  sourceUrl?: string | null;
  sourceRecordId?: string | null;
  originalFileName?: string | null;
  storageProvider?: string | null;
  storagePath?: string | null;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  checksumSha256?: string | null;
  extractedText?: string | null;
  extractionStatus?: "NOT_REQUESTED" | "PENDING" | "SUCCEEDED" | "FAILED";
  extractedAt?: Date | null;
  metadata?: Prisma.InputJsonValue | null;
  occurredAt?: Date;
};

export type UpsertOpportunityProposalInput = {
  actor: OpportunityWriteActor;
  opportunityId: string;
  status: OpportunityProposalStatus;
  ownerUserId?: string | null;
  completedChecklistKeys: OpportunityProposalChecklistKey[];
  linkedDocumentIds: string[];
  occurredAt?: Date;
};

export type DeleteOpportunityProposalInput = {
  actor: OpportunityWriteActor;
  proposalId: string;
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
  recommendedByActorType?: AuditActorType;
  recommendedByIdentifier?: string | null;
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

export type RecordOpportunityCloseoutInput = {
  actor: OpportunityWriteActor;
  opportunityId: string;
  competitorId?: string | null;
  outcomeReason: string;
  lessonsLearned: string;
  recordedAt?: Date;
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

export async function createOpportunityTask({
  db,
  input,
}: {
  db: OpportunityWriteClient;
  input: CreateOpportunityTaskInput;
}) {
  return db.$transaction(async (tx) => {
    const opportunity = await tx.opportunity.findFirstOrThrow({
      where: {
        id: input.opportunityId,
        organizationId: input.actor.organizationId,
      },
      select: opportunityAuditSelect,
    });
    const occurredAt = input.occurredAt ?? new Date();
    const status = input.status ?? "NOT_STARTED";
    const priority = input.priority ?? "MEDIUM";
    const assigneeUserId = await resolveTaskAssigneeUserId({
      tx,
      organizationId: input.actor.organizationId,
      userId: input.assigneeUserId,
    });
    const sortOrder = await tx.opportunityTask.count({
      where: {
        opportunityId: opportunity.id,
        organizationId: opportunity.organizationId,
      },
    });
    const lifecycleDates = buildTaskLifecycleDates({
      status,
      occurredAt,
      existingStartedAt: null,
      existingCompletedAt: null,
    });

    const task = await tx.opportunityTask.create({
      data: {
        organizationId: opportunity.organizationId,
        opportunityId: opportunity.id,
        createdByUserId:
          input.actor.type === AuditActorType.USER ? input.actor.userId ?? null : null,
        assigneeUserId,
        title: normalizeRequiredText(input.title, "Task title"),
        description: normalizeOptionalText(input.description),
        status,
        priority,
        dueAt: input.dueAt ?? null,
        startedAt: lifecycleDates.startedAt,
        completedAt: lifecycleDates.completedAt,
        sortOrder,
        metadata: toOptionalJson(input.metadata),
      },
      select: opportunityTaskAuditSelect,
    });

    await tx.opportunityActivityEvent.create({
      data: {
        actorIdentifier: input.actor.identifier ?? null,
        actorType: input.actor.type,
        actorUserId:
          input.actor.type === AuditActorType.USER ? input.actor.userId ?? null : null,
        description: task.description,
        eventType: "task_created",
        metadata: {
          assigneeUserId: task.assigneeUserId,
          dueAt: serializeAuditValue(task.dueAt),
          priority: task.priority,
          status: task.status,
        },
        occurredAt,
        opportunityId: opportunity.id,
        organizationId: opportunity.organizationId,
        relatedEntityId: task.id,
        relatedEntityType: "task",
        title: `Task created: ${task.title}`,
      },
      select: {
        id: true,
      },
    });

    await recordAuditEvent({
      db: tx,
      event: {
        organizationId: opportunity.organizationId,
        actor: input.actor,
        action: AUDIT_ACTIONS.opportunityTaskCreate,
        target: {
          type: "opportunity_task",
          id: task.id,
          display: task.title,
        },
        summary: `Created task ${task.title} on ${opportunity.title}.`,
        metadata: {
          opportunityId: opportunity.id,
          opportunityTitle: opportunity.title,
          assigneeUserId: task.assigneeUserId,
          dueAt: serializeAuditValue(task.dueAt),
          priority: task.priority,
          status: task.status,
        },
        occurredAt,
      },
    });

    return task;
  });
}

export async function updateOpportunityTask({
  db,
  input,
}: {
  db: OpportunityWriteClient;
  input: UpdateOpportunityTaskInput;
}) {
  return db.$transaction(async (tx) => {
    const existingTask = await tx.opportunityTask.findFirstOrThrow({
      where: {
        id: input.taskId,
        organizationId: input.actor.organizationId,
      },
      select: opportunityTaskAuditSelect,
    });

    const nextStatus = input.status ?? existingTask.status;
    const assigneeUserId =
      input.assigneeUserId === undefined
        ? existingTask.assigneeUserId
        : await resolveTaskAssigneeUserId({
            tx,
            organizationId: input.actor.organizationId,
            userId: input.assigneeUserId,
          });
    const occurredAt = input.occurredAt ?? new Date();
    const lifecycleDates = buildTaskLifecycleDates({
      status: nextStatus,
      occurredAt,
      existingStartedAt: existingTask.startedAt,
      existingCompletedAt: existingTask.completedAt,
    });
    const nextValues = {
      title:
        input.title === undefined
          ? existingTask.title
          : normalizeRequiredText(input.title, "Task title"),
      description:
        input.description === undefined
          ? existingTask.description
          : normalizeOptionalText(input.description),
      assigneeUserId,
      dueAt: input.dueAt === undefined ? existingTask.dueAt : input.dueAt,
      status: nextStatus,
      priority: input.priority ?? existingTask.priority,
      startedAt: lifecycleDates.startedAt,
      completedAt: lifecycleDates.completedAt,
      metadata: toOptionalJson(input.metadata),
    };
    const changedFields = {
      title: buildFieldChange(existingTask.title, nextValues.title),
      description: buildFieldChange(
        existingTask.description,
        nextValues.description,
      ),
      assigneeUserId: buildFieldChange(
        existingTask.assigneeUserId,
        nextValues.assigneeUserId,
      ),
      dueAt: buildFieldChange(existingTask.dueAt, nextValues.dueAt),
      status: buildFieldChange(existingTask.status, nextValues.status),
      priority: buildFieldChange(existingTask.priority, nextValues.priority),
      startedAt: buildFieldChange(existingTask.startedAt, nextValues.startedAt),
      completedAt: buildFieldChange(
        existingTask.completedAt,
        nextValues.completedAt,
      ),
    };
    const auditChanges = Object.fromEntries(
      Object.entries(changedFields).filter(([, value]) => value !== null),
    );

    const task = await tx.opportunityTask.update({
      where: {
        id: existingTask.id,
      },
      data: nextValues,
      select: opportunityTaskAuditSelect,
    });

    if (Object.keys(auditChanges).length > 0) {
      await tx.opportunityActivityEvent.create({
        data: {
          actorIdentifier: input.actor.identifier ?? null,
          actorType: input.actor.type,
          actorUserId:
            input.actor.type === AuditActorType.USER
              ? input.actor.userId ?? null
              : null,
          description: `Status ${existingTask.status} -> ${task.status}.`,
          eventType: "task_updated",
          metadata: {
            changedFields: auditChanges,
          },
          occurredAt,
          opportunityId: task.opportunity.id,
          organizationId: task.organizationId,
          relatedEntityId: task.id,
          relatedEntityType: "task",
          title: `Task updated: ${task.title}`,
        },
        select: {
          id: true,
        },
      });

      await recordAuditEvent({
        db: tx,
        event: {
          organizationId: task.organizationId,
          actor: input.actor,
          action: AUDIT_ACTIONS.opportunityTaskUpdate,
          target: {
            type: "opportunity_task",
            id: task.id,
            display: task.title,
          },
          summary: `Updated task ${task.title} on ${task.opportunity.title}.`,
          metadata: {
            changedFields: auditChanges,
            opportunityId: task.opportunity.id,
            opportunityTitle: task.opportunity.title,
          },
          occurredAt,
        },
      });
    }

    return task;
  });
}

export async function deleteOpportunityTask({
  db,
  input,
}: {
  db: OpportunityWriteClient;
  input: DeleteOpportunityTaskInput;
}) {
  return db.$transaction(async (tx) => {
    const existingTask = await tx.opportunityTask.findFirstOrThrow({
      where: {
        id: input.taskId,
        organizationId: input.actor.organizationId,
      },
      select: opportunityTaskAuditSelect,
    });
    const occurredAt = input.occurredAt ?? new Date();
    const deletedTask = await tx.opportunityTask.delete({
      where: {
        id: existingTask.id,
      },
      select: opportunityTaskAuditSelect,
    });

    await tx.opportunityActivityEvent.create({
      data: {
        actorIdentifier: input.actor.identifier ?? null,
        actorType: input.actor.type,
        actorUserId:
          input.actor.type === AuditActorType.USER ? input.actor.userId ?? null : null,
        description: deletedTask.description,
        eventType: "task_deleted",
        metadata: {
          assigneeUserId: deletedTask.assigneeUserId,
          dueAt: serializeAuditValue(deletedTask.dueAt),
          priority: deletedTask.priority,
          status: deletedTask.status,
        },
        occurredAt,
        opportunityId: deletedTask.opportunity.id,
        organizationId: deletedTask.organizationId,
        relatedEntityId: deletedTask.id,
        relatedEntityType: "task",
        title: `Task deleted: ${deletedTask.title}`,
      },
      select: {
        id: true,
      },
    });

    await recordAuditEvent({
      db: tx,
      event: {
        organizationId: deletedTask.organizationId,
        actor: input.actor,
        action: AUDIT_ACTIONS.opportunityTaskDelete,
        target: {
          type: "opportunity_task",
          id: deletedTask.id,
          display: deletedTask.title,
        },
        summary: `Deleted task ${deletedTask.title} from ${deletedTask.opportunity.title}.`,
        metadata: {
          opportunityId: deletedTask.opportunity.id,
          opportunityTitle: deletedTask.opportunity.title,
          assigneeUserId: deletedTask.assigneeUserId,
        },
        occurredAt,
      },
    });

    return deletedTask;
  });
}

export async function createOpportunityMilestone({
  db,
  input,
}: {
  db: OpportunityWriteClient;
  input: CreateOpportunityMilestoneInput;
}) {
  return db.$transaction(async (tx) => {
    const opportunity = await tx.opportunity.findFirstOrThrow({
      where: {
        id: input.opportunityId,
        organizationId: input.actor.organizationId,
      },
      select: opportunityAuditSelect,
    });
    const occurredAt = input.occurredAt ?? new Date();
    const status = input.status ?? "PLANNED";
    const lifecycleDates = buildMilestoneLifecycleDates({
      status,
      occurredAt,
      existingCompletedAt: null,
    });
    const sortOrder = await tx.opportunityMilestone.count({
      where: {
        opportunityId: opportunity.id,
        organizationId: opportunity.organizationId,
      },
    });

    const milestone = await tx.opportunityMilestone.create({
      data: {
        organizationId: opportunity.organizationId,
        opportunityId: opportunity.id,
        createdByUserId:
          input.actor.type === AuditActorType.USER ? input.actor.userId ?? null : null,
        title: normalizeRequiredText(input.title, "Milestone title"),
        description: normalizeOptionalText(input.description),
        milestoneTypeKey: normalizeOptionalText(input.milestoneTypeKey),
        status,
        targetDate: input.targetDate,
        completedAt: lifecycleDates.completedAt,
        sortOrder,
        metadata: toOptionalJson(input.metadata),
      },
      select: opportunityMilestoneAuditSelect,
    });

    await tx.opportunityActivityEvent.create({
      data: {
        actorIdentifier: input.actor.identifier ?? null,
        actorType: input.actor.type,
        actorUserId:
          input.actor.type === AuditActorType.USER ? input.actor.userId ?? null : null,
        description: milestone.description,
        eventType: "milestone_created",
        metadata: {
          completedAt: serializeAuditValue(milestone.completedAt),
          milestoneTypeKey: milestone.milestoneTypeKey,
          status: milestone.status,
          targetDate: serializeAuditValue(milestone.targetDate),
        },
        occurredAt,
        opportunityId: opportunity.id,
        organizationId: opportunity.organizationId,
        relatedEntityId: milestone.id,
        relatedEntityType: "milestone",
        title: `Milestone created: ${milestone.title}`,
      },
      select: {
        id: true,
      },
    });

    await recordAuditEvent({
      db: tx,
      event: {
        organizationId: opportunity.organizationId,
        actor: input.actor,
        action: AUDIT_ACTIONS.opportunityMilestoneCreate,
        target: {
          type: "opportunity_milestone",
          id: milestone.id,
          display: milestone.title,
        },
        summary: `Created milestone ${milestone.title} on ${opportunity.title}.`,
        metadata: {
          completedAt: serializeAuditValue(milestone.completedAt),
          milestoneTypeKey: milestone.milestoneTypeKey,
          opportunityId: opportunity.id,
          opportunityTitle: opportunity.title,
          status: milestone.status,
          targetDate: serializeAuditValue(milestone.targetDate),
        },
        occurredAt,
      },
    });

    return milestone;
  });
}

export async function createOpportunityNote({
  db,
  input,
}: {
  db: OpportunityWriteClient;
  input: CreateOpportunityNoteInput;
}) {
  return db.$transaction(async (tx) => {
    const opportunity = await tx.opportunity.findFirstOrThrow({
      where: {
        id: input.opportunityId,
        organizationId: input.actor.organizationId,
      },
      select: opportunityAuditSelect,
    });
    const occurredAt = input.occurredAt ?? new Date();
    const title = normalizeOptionalText(input.title);
    const note = await tx.opportunityNote.create({
      data: {
        organizationId: opportunity.organizationId,
        opportunityId: opportunity.id,
        authorUserId:
          input.actor.type === AuditActorType.USER ? input.actor.userId ?? null : null,
        title,
        body: normalizeRequiredText(input.body, "Note details"),
        contentFormat: normalizeOptionalText(input.contentFormat) ?? "markdown",
        isPinned: input.isPinned ?? false,
      },
      select: opportunityNoteAuditSelect,
    });

    await tx.opportunityActivityEvent.create({
      data: {
        actorIdentifier: input.actor.identifier ?? null,
        actorType: input.actor.type,
        actorUserId:
          input.actor.type === AuditActorType.USER ? input.actor.userId ?? null : null,
        description: note.body,
        eventType: "note_added",
        metadata: {
          contentFormat: note.contentFormat,
          isPinned: note.isPinned,
          noteTitle: note.title,
        },
        occurredAt,
        opportunityId: opportunity.id,
        organizationId: opportunity.organizationId,
        relatedEntityId: note.id,
        relatedEntityType: "note",
        title: `Note added: ${note.title ?? "Untitled note"}`,
      },
      select: {
        id: true,
      },
    });

    await recordAuditEvent({
      db: tx,
      event: {
        organizationId: opportunity.organizationId,
        actor: input.actor,
        action: AUDIT_ACTIONS.opportunityNoteCreate,
        target: {
          type: "opportunity_note",
          id: note.id,
          display: note.title ?? "Untitled note",
        },
        summary: `Added note ${note.title ?? "Untitled note"} to ${opportunity.title}.`,
        metadata: {
          contentFormat: note.contentFormat,
          isPinned: note.isPinned,
          opportunityId: opportunity.id,
          opportunityTitle: opportunity.title,
        },
        occurredAt,
      },
    });

    return note;
  });
}

export async function createOpportunityDocument({
  db,
  input,
}: {
  db: OpportunityWriteClient;
  input: CreateOpportunityDocumentInput;
}) {
  return db.$transaction(async (tx) => {
    const opportunity = await tx.opportunity.findFirstOrThrow({
      where: {
        id: input.opportunityId,
        organizationId: input.actor.organizationId,
      },
      select: opportunityAuditSelect,
    });
    const occurredAt = input.occurredAt ?? new Date();
    const title =
      normalizeOptionalText(input.title) ??
      normalizeOptionalText(input.originalFileName) ??
      "Uploaded document";
    const document = await tx.opportunityDocument.create({
      data: {
        organizationId: opportunity.organizationId,
        opportunityId: opportunity.id,
        uploadedByUserId:
          input.actor.type === AuditActorType.USER ? input.actor.userId ?? null : null,
        sourceRecordId: input.sourceRecordId ?? null,
        title,
        documentType: normalizeOptionalText(input.documentType),
        sourceType: input.sourceType ?? "MANUAL_UPLOAD",
        sourceUrl: normalizeOptionalText(input.sourceUrl),
        originalFileName: normalizeOptionalText(input.originalFileName),
        storageProvider: normalizeOptionalText(input.storageProvider),
        storagePath: normalizeOptionalText(input.storagePath),
        mimeType: normalizeOptionalText(input.mimeType),
        fileSizeBytes: input.fileSizeBytes ?? null,
        checksumSha256: normalizeOptionalText(input.checksumSha256),
        extractedText: normalizeOptionalText(input.extractedText),
        extractionStatus: input.extractionStatus ?? "NOT_REQUESTED",
        extractedAt: input.extractedAt ?? null,
        metadata: toOptionalJson(input.metadata),
      },
      select: opportunityDocumentAuditSelect,
    });

    await tx.opportunityActivityEvent.create({
      data: {
        actorIdentifier: input.actor.identifier ?? null,
        actorType: input.actor.type,
        actorUserId:
          input.actor.type === AuditActorType.USER ? input.actor.userId ?? null : null,
        description:
          document.extractedText ??
          `Stored ${document.originalFileName ?? document.title} in the workspace document library.`,
        eventType: "document_uploaded",
        metadata: {
          checksumSha256: document.checksumSha256,
          documentType: document.documentType,
          extractionStatus: document.extractionStatus,
          fileSizeBytes: document.fileSizeBytes,
          mimeType: document.mimeType,
          originalFileName: document.originalFileName,
          sourceType: document.sourceType,
          storageProvider: document.storageProvider,
        },
        occurredAt,
        opportunityId: opportunity.id,
        organizationId: opportunity.organizationId,
        relatedEntityId: document.id,
        relatedEntityType: "document",
        title: `Document uploaded: ${document.title}`,
      },
      select: {
        id: true,
      },
    });

    await recordAuditEvent({
      db: tx,
      event: {
        organizationId: opportunity.organizationId,
        actor: input.actor,
        action: AUDIT_ACTIONS.opportunityDocumentCreate,
        target: {
          type: "opportunity_document",
          id: document.id,
          display: document.title,
        },
        summary: `Uploaded document ${document.title} to ${opportunity.title}.`,
        metadata: {
          checksumSha256: document.checksumSha256,
          documentType: document.documentType,
          extractionStatus: document.extractionStatus,
          opportunityId: opportunity.id,
          opportunityTitle: opportunity.title,
          originalFileName: document.originalFileName,
          sourceType: document.sourceType,
          storagePath: document.storagePath,
        },
        occurredAt,
      },
    });

    return document;
  });
}

export async function upsertOpportunityProposal({
  db,
  input,
}: {
  db: OpportunityWriteClient;
  input: UpsertOpportunityProposalInput;
}) {
  return db.$transaction(async (tx) => {
    const opportunity = await tx.opportunity.findFirstOrThrow({
      where: {
        id: input.opportunityId,
        organizationId: input.actor.organizationId,
      },
      select: opportunityAuditSelect,
    });

    if (!canTrackProposalForStage(opportunity.currentStageKey)) {
      throw new Error(
        "Proposal tracking can only start after the pursuit is approved.",
      );
    }

    const occurredAt = input.occurredAt ?? new Date();
    const ownerUserId = await resolveProposalOwnerUserId({
      tx,
      organizationId: input.actor.organizationId,
      userId: input.ownerUserId,
    });
    const linkedDocuments = await resolveProposalLinkedDocuments({
      tx,
      organizationId: input.actor.organizationId,
      opportunityId: opportunity.id,
      documentIds: input.linkedDocumentIds,
    });
    const linkedDocumentIds = linkedDocuments.map((document) => document.id);
    const existingProposal = await tx.opportunityProposal.findFirst({
      where: {
        opportunityId: opportunity.id,
        organizationId: input.actor.organizationId,
      },
      select: opportunityProposalAuditSelect,
    });

    if (!existingProposal) {
      const createdProposal = await tx.opportunityProposal.create({
        data: {
          organizationId: opportunity.organizationId,
          opportunityId: opportunity.id,
          ownerUserId,
          createdByUserId:
            input.actor.type === AuditActorType.USER
              ? input.actor.userId ?? null
              : null,
          updatedByUserId:
            input.actor.type === AuditActorType.USER
              ? input.actor.userId ?? null
              : null,
          status: input.status,
          submittedAt: input.status === "SUBMITTED" ? occurredAt : null,
        },
        select: opportunityProposalAuditSelect,
      });

      await syncProposalChecklistItems({
        tx,
        completedChecklistKeys: input.completedChecklistKeys,
        existingItems: [],
        occurredAt,
        organizationId: opportunity.organizationId,
        proposalId: createdProposal.id,
      });
      await syncProposalDocumentLinks({
        tx,
        documentIds: linkedDocumentIds,
        proposalId: createdProposal.id,
      });

      const proposal = await tx.opportunityProposal.findFirstOrThrow({
        where: {
          id: createdProposal.id,
          organizationId: opportunity.organizationId,
        },
        select: opportunityProposalAuditSelect,
      });

      await tx.opportunityActivityEvent.create({
        data: {
          actorIdentifier: input.actor.identifier ?? null,
          actorType: input.actor.type,
          actorUserId:
            input.actor.type === AuditActorType.USER
              ? input.actor.userId ?? null
              : null,
          description: `Proposal tracking started with ${proposal.checklistItems.filter((item) => item.isComplete).length} of ${proposal.checklistItems.length} compliance checkpoints complete.`,
          eventType: "proposal_record_created",
          metadata: {
            linkedDocumentIds,
            ownerUserId: proposal.ownerUserId,
            status: proposal.status,
          },
          occurredAt,
          opportunityId: opportunity.id,
          organizationId: opportunity.organizationId,
          relatedEntityId: proposal.id,
          relatedEntityType: "proposal_record",
          title: `Proposal record started: ${humanizeProposalStatus(proposal.status)}`,
        },
        select: {
          id: true,
        },
      });

      await recordAuditEvent({
        db: tx,
        event: {
          organizationId: opportunity.organizationId,
          actor: input.actor,
          action: AUDIT_ACTIONS.opportunityProposalCreate,
          target: {
            type: "opportunity_proposal",
            id: proposal.id,
            display: opportunity.title,
          },
          summary: `Started proposal tracking on ${opportunity.title}.`,
          metadata: {
            completedChecklistKeys: proposal.checklistItems
              .filter((item) => item.isComplete)
              .map((item) => item.checklistKey),
            linkedDocumentIds,
            ownerUserId: proposal.ownerUserId,
            status: proposal.status,
          },
          occurredAt,
        },
      });

      return proposal;
    }

    const submittedAt =
      input.status === "SUBMITTED"
        ? existingProposal.submittedAt ?? occurredAt
        : null;
    const updatedProposal = await tx.opportunityProposal.update({
      where: {
        id: existingProposal.id,
      },
      data: {
        ownerUserId,
        updatedByUserId:
          input.actor.type === AuditActorType.USER
            ? input.actor.userId ?? null
            : null,
        status: input.status,
        submittedAt,
      },
      select: opportunityProposalAuditSelect,
    });

    await syncProposalChecklistItems({
      tx,
      completedChecklistKeys: input.completedChecklistKeys,
      existingItems: existingProposal.checklistItems,
      occurredAt,
      organizationId: opportunity.organizationId,
      proposalId: updatedProposal.id,
    });
    await syncProposalDocumentLinks({
      tx,
      documentIds: linkedDocumentIds,
      proposalId: updatedProposal.id,
    });

    const proposal = await tx.opportunityProposal.findFirstOrThrow({
      where: {
        id: updatedProposal.id,
        organizationId: opportunity.organizationId,
      },
      select: opportunityProposalAuditSelect,
    });

    const changedFields = {
      status: buildFieldChange(existingProposal.status, proposal.status),
      ownerUserId: buildFieldChange(
        existingProposal.ownerUserId,
        proposal.ownerUserId,
      ),
      submittedAt: buildFieldChange(
        existingProposal.submittedAt,
        proposal.submittedAt,
      ),
      completedChecklistKeys: buildStringArrayFieldChange(
        existingProposal.checklistItems
          .filter((item) => item.isComplete)
          .map((item) => item.checklistKey),
        proposal.checklistItems
          .filter((item) => item.isComplete)
          .map((item) => item.checklistKey),
      ),
      linkedDocumentIds: buildStringArrayFieldChange(
        existingProposal.linkedDocuments.map((link) => link.document.id),
        proposal.linkedDocuments.map((link) => link.document.id),
      ),
    };

    const auditChanges = Object.fromEntries(
      Object.entries(changedFields).filter(([, value]) => value !== null),
    );

    if (Object.keys(auditChanges).length > 0) {
      await tx.opportunityActivityEvent.create({
        data: {
          actorIdentifier: input.actor.identifier ?? null,
          actorType: input.actor.type,
          actorUserId:
            input.actor.type === AuditActorType.USER
              ? input.actor.userId ?? null
              : null,
          description: `Proposal tracking now shows ${proposal.checklistItems.filter((item) => item.isComplete).length} of ${proposal.checklistItems.length} compliance checkpoints complete.`,
          eventType: "proposal_record_updated",
          metadata: {
            changedFields: auditChanges,
          },
          occurredAt,
          opportunityId: opportunity.id,
          organizationId: opportunity.organizationId,
          relatedEntityId: proposal.id,
          relatedEntityType: "proposal_record",
          title: `Proposal record updated: ${humanizeProposalStatus(proposal.status)}`,
        },
        select: {
          id: true,
        },
      });

      await recordAuditEvent({
        db: tx,
        event: {
          organizationId: opportunity.organizationId,
          actor: input.actor,
          action: AUDIT_ACTIONS.opportunityProposalUpdate,
          target: {
            type: "opportunity_proposal",
            id: proposal.id,
            display: opportunity.title,
          },
          summary: `Updated proposal tracking on ${opportunity.title}.`,
          metadata: {
            changedFields: auditChanges,
          },
          occurredAt,
        },
      });
    }

    return proposal;
  });
}

export async function deleteOpportunityProposal({
  db,
  input,
}: {
  db: OpportunityWriteClient;
  input: DeleteOpportunityProposalInput;
}) {
  return db.$transaction(async (tx) => {
    const existingProposal = await tx.opportunityProposal.findFirstOrThrow({
      where: {
        id: input.proposalId,
        organizationId: input.actor.organizationId,
      },
      select: opportunityProposalAuditSelect,
    });
    const occurredAt = input.occurredAt ?? new Date();
    const deletedProposal = await tx.opportunityProposal.delete({
      where: {
        id: existingProposal.id,
      },
      select: opportunityProposalAuditSelect,
    });

    await tx.opportunityActivityEvent.create({
      data: {
        actorIdentifier: input.actor.identifier ?? null,
        actorType: input.actor.type,
        actorUserId:
          input.actor.type === AuditActorType.USER ? input.actor.userId ?? null : null,
        description:
          "Proposal tracking was removed from the workspace record.",
        eventType: "proposal_record_deleted",
        metadata: {
          ownerUserId: deletedProposal.ownerUserId,
          status: deletedProposal.status,
        },
        occurredAt,
        opportunityId: deletedProposal.opportunity.id,
        organizationId: deletedProposal.organizationId,
        relatedEntityId: deletedProposal.id,
        relatedEntityType: "proposal_record",
        title: "Proposal record removed",
      },
      select: {
        id: true,
      },
    });

    await recordAuditEvent({
      db: tx,
      event: {
        organizationId: deletedProposal.organizationId,
        actor: input.actor,
        action: AUDIT_ACTIONS.opportunityProposalDelete,
        target: {
          type: "opportunity_proposal",
          id: deletedProposal.id,
          display: deletedProposal.opportunity.title,
        },
        summary: `Removed proposal tracking from ${deletedProposal.opportunity.title}.`,
        metadata: {
          ownerUserId: deletedProposal.ownerUserId,
          status: deletedProposal.status,
        },
        occurredAt,
      },
    });

    return deletedProposal;
  });
}

export async function updateOpportunityMilestone({
  db,
  input,
}: {
  db: OpportunityWriteClient;
  input: UpdateOpportunityMilestoneInput;
}) {
  return db.$transaction(async (tx) => {
    const existingMilestone = await tx.opportunityMilestone.findFirstOrThrow({
      where: {
        id: input.milestoneId,
        organizationId: input.actor.organizationId,
      },
      select: opportunityMilestoneAuditSelect,
    });
    const nextStatus = input.status ?? existingMilestone.status;
    const occurredAt = input.occurredAt ?? new Date();
    const lifecycleDates = buildMilestoneLifecycleDates({
      status: nextStatus,
      occurredAt,
      existingCompletedAt: existingMilestone.completedAt,
    });
    const nextValues = {
      title:
        input.title === undefined
          ? existingMilestone.title
          : normalizeRequiredText(input.title, "Milestone title"),
      description:
        input.description === undefined
          ? existingMilestone.description
          : normalizeOptionalText(input.description),
      milestoneTypeKey:
        input.milestoneTypeKey === undefined
          ? existingMilestone.milestoneTypeKey
          : normalizeOptionalText(input.milestoneTypeKey),
      status: nextStatus,
      targetDate:
        input.targetDate === undefined
          ? existingMilestone.targetDate
          : input.targetDate,
      completedAt: lifecycleDates.completedAt,
      metadata: toOptionalJson(input.metadata),
    };
    const changedFields = {
      title: buildFieldChange(existingMilestone.title, nextValues.title),
      description: buildFieldChange(
        existingMilestone.description,
        nextValues.description,
      ),
      milestoneTypeKey: buildFieldChange(
        existingMilestone.milestoneTypeKey,
        nextValues.milestoneTypeKey,
      ),
      status: buildFieldChange(existingMilestone.status, nextValues.status),
      targetDate: buildFieldChange(
        existingMilestone.targetDate,
        nextValues.targetDate,
      ),
      completedAt: buildFieldChange(
        existingMilestone.completedAt,
        nextValues.completedAt,
      ),
    };
    const auditChanges = Object.fromEntries(
      Object.entries(changedFields).filter(([, value]) => value !== null),
    );

    const milestone = await tx.opportunityMilestone.update({
      where: {
        id: existingMilestone.id,
      },
      data: nextValues,
      select: opportunityMilestoneAuditSelect,
    });

    if (Object.keys(auditChanges).length > 0) {
      await tx.opportunityActivityEvent.create({
        data: {
          actorIdentifier: input.actor.identifier ?? null,
          actorType: input.actor.type,
          actorUserId:
            input.actor.type === AuditActorType.USER
              ? input.actor.userId ?? null
              : null,
          description: `Status ${existingMilestone.status} -> ${milestone.status}.`,
          eventType: "milestone_updated",
          metadata: {
            changedFields: auditChanges,
          },
          occurredAt,
          opportunityId: milestone.opportunity.id,
          organizationId: milestone.organizationId,
          relatedEntityId: milestone.id,
          relatedEntityType: "milestone",
          title: `Milestone updated: ${milestone.title}`,
        },
        select: {
          id: true,
        },
      });

      await recordAuditEvent({
        db: tx,
        event: {
          organizationId: milestone.organizationId,
          actor: input.actor,
          action: AUDIT_ACTIONS.opportunityMilestoneUpdate,
          target: {
            type: "opportunity_milestone",
            id: milestone.id,
            display: milestone.title,
          },
          summary: `Updated milestone ${milestone.title} on ${milestone.opportunity.title}.`,
          metadata: {
            changedFields: auditChanges,
            opportunityId: milestone.opportunity.id,
            opportunityTitle: milestone.opportunity.title,
          },
          occurredAt,
        },
      });
    }

    return milestone;
  });
}

export async function deleteOpportunityMilestone({
  db,
  input,
}: {
  db: OpportunityWriteClient;
  input: DeleteOpportunityMilestoneInput;
}) {
  return db.$transaction(async (tx) => {
    const existingMilestone = await tx.opportunityMilestone.findFirstOrThrow({
      where: {
        id: input.milestoneId,
        organizationId: input.actor.organizationId,
      },
      select: opportunityMilestoneAuditSelect,
    });
    const occurredAt = input.occurredAt ?? new Date();
    const deletedMilestone = await tx.opportunityMilestone.delete({
      where: {
        id: existingMilestone.id,
      },
      select: opportunityMilestoneAuditSelect,
    });

    await tx.opportunityActivityEvent.create({
      data: {
        actorIdentifier: input.actor.identifier ?? null,
        actorType: input.actor.type,
        actorUserId:
          input.actor.type === AuditActorType.USER ? input.actor.userId ?? null : null,
        description: deletedMilestone.description,
        eventType: "milestone_deleted",
        metadata: {
          completedAt: serializeAuditValue(deletedMilestone.completedAt),
          milestoneTypeKey: deletedMilestone.milestoneTypeKey,
          status: deletedMilestone.status,
          targetDate: serializeAuditValue(deletedMilestone.targetDate),
        },
        occurredAt,
        opportunityId: deletedMilestone.opportunity.id,
        organizationId: deletedMilestone.organizationId,
        relatedEntityId: deletedMilestone.id,
        relatedEntityType: "milestone",
        title: `Milestone deleted: ${deletedMilestone.title}`,
      },
      select: {
        id: true,
      },
    });

    await recordAuditEvent({
      db: tx,
      event: {
        organizationId: deletedMilestone.organizationId,
        actor: input.actor,
        action: AUDIT_ACTIONS.opportunityMilestoneDelete,
        target: {
          type: "opportunity_milestone",
          id: deletedMilestone.id,
          display: deletedMilestone.title,
        },
        summary: `Deleted milestone ${deletedMilestone.title} from ${deletedMilestone.opportunity.title}.`,
        metadata: {
          opportunityId: deletedMilestone.opportunity.id,
          opportunityTitle: deletedMilestone.opportunity.title,
          targetDate: serializeAuditValue(deletedMilestone.targetDate),
        },
        occurredAt,
      },
    });

    return deletedMilestone;
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
    const recommendedByActorType =
      input.recommendedByActorType ?? input.actor.type;
    const recommendedByUserId =
      recommendedByActorType === AuditActorType.USER
        ? input.actor.userId ?? null
        : null;
    const recommendedByIdentifier =
      normalizeOptionalText(input.recommendedByIdentifier) ??
      input.actor.identifier ??
      null;
    const decidedByUserId =
      input.finalOutcome && input.actor.type === AuditActorType.USER
        ? input.actor.userId ?? null
        : null;

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
        recommendedByActorType,
        recommendedByUserId,
        recommendedByIdentifier,
        recommendedAt,
        finalOutcome: input.finalOutcome ?? null,
        finalRationale: normalizeOptionalText(input.finalRationale),
        decisionMetadata: toOptionalJson(input.decisionMetadata),
        decidedByUserId,
        decidedAt,
        isCurrent: true,
      },
      select: bidDecisionAuditSelect,
    });

    await tx.opportunityActivityEvent.create({
      data: {
        actorIdentifier: input.actor.identifier ?? null,
        actorType: input.actor.type,
        actorUserId:
          input.actor.type === AuditActorType.USER ? input.actor.userId ?? null : null,
        description:
          normalizeOptionalText(input.finalRationale) ??
          normalizeOptionalText(input.recommendationSummary),
        eventType: "bid_decision_recorded",
        metadata: {
          decisionId: bidDecision.id,
          decisionTypeKey: bidDecision.decisionTypeKey,
          recommendationOutcome: bidDecision.recommendationOutcome,
          finalOutcome: bidDecision.finalOutcome,
          scorecardId: input.scorecardId ?? null,
        },
        occurredAt: bidDecision.decidedAt ?? recommendedAt,
        opportunityId: opportunity.id,
        organizationId: opportunity.organizationId,
        relatedEntityId: bidDecision.id,
        relatedEntityType: "bid_decision",
        title: bidDecision.finalOutcome
          ? `Bid decision recorded as ${bidDecision.finalOutcome}`
          : "Bid recommendation recorded",
      },
      select: {
        id: true,
      },
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

export async function recordOpportunityCloseout({
  db,
  input,
}: {
  db: OpportunityWriteClient;
  input: RecordOpportunityCloseoutInput;
}) {
  return db.$transaction(async (tx) => {
    const opportunity = await tx.opportunity.findFirstOrThrow({
      where: {
        id: input.opportunityId,
        organizationId: input.actor.organizationId,
      },
      select: opportunityAuditSelect,
    });

    const stageKey = normalizeRequiredText(
      opportunity.currentStageKey ?? "",
      "Opportunity stage",
    );
    const stageLabel =
      normalizeOptionalText(opportunity.currentStageLabel) ??
      humanizeStageKey(stageKey) ??
      stageKey;

    if (!isClosedStageKey(stageKey)) {
      throw new Error(
        "Closeout details can only be recorded after the opportunity is moved to a closed stage.",
      );
    }

    const competitorId = await resolveOpportunityCompetitorId({
      tx,
      organizationId: opportunity.organizationId,
      competitorId: input.competitorId,
      required: stageKey !== "no_bid",
    });
    const recordedAt = input.recordedAt ?? input.occurredAt ?? new Date();

    await tx.opportunityCloseout.updateMany({
      where: {
        organizationId: opportunity.organizationId,
        opportunityId: opportunity.id,
        isCurrent: true,
      },
      data: {
        isCurrent: false,
      },
    });

    const closeout = await tx.opportunityCloseout.create({
      data: {
        organizationId: opportunity.organizationId,
        opportunityId: opportunity.id,
        competitorId,
        recordedByUserId:
          input.actor.type === AuditActorType.USER ? input.actor.userId ?? null : null,
        outcomeStageKey: stageKey,
        outcomeStageLabel: stageLabel,
        outcomeReason: normalizeRequiredText(
          input.outcomeReason,
          "Outcome reason",
        ),
        lessonsLearned: normalizeRequiredText(
          input.lessonsLearned,
          "Lessons learned",
        ),
        recordedAt,
        isCurrent: true,
      },
      select: opportunityCloseoutAuditSelect,
    });

    await tx.opportunityActivityEvent.create({
      data: {
        actorIdentifier: input.actor.identifier ?? null,
        actorType: input.actor.type,
        actorUserId:
          input.actor.type === AuditActorType.USER ? input.actor.userId ?? null : null,
        description: normalizeOptionalText(input.outcomeReason),
        eventType: "opportunity_closeout_recorded",
        metadata: {
          closeoutId: closeout.id,
          outcomeStageKey: closeout.outcomeStageKey,
          outcomeStageLabel: closeout.outcomeStageLabel,
          competitorId: closeout.competitor?.id ?? null,
          competitorName: closeout.competitor?.name ?? null,
        },
        occurredAt: closeout.recordedAt,
        opportunityId: opportunity.id,
        organizationId: opportunity.organizationId,
        relatedEntityId: closeout.id,
        relatedEntityType: "opportunity_closeout",
        title: `Closeout recorded for ${stageLabel}`,
      },
      select: {
        id: true,
      },
    });

    await recordAuditEvent({
      db: tx,
      event: {
        organizationId: opportunity.organizationId,
        actor: input.actor,
        action: AUDIT_ACTIONS.opportunityCloseoutRecord,
        target: {
          type: "opportunity",
          id: opportunity.id,
          display: opportunity.title,
        },
        summary: `Recorded closeout notes for ${opportunity.title}.`,
        metadata: {
          closeoutId: closeout.id,
          outcomeStageKey: closeout.outcomeStageKey,
          outcomeStageLabel: closeout.outcomeStageLabel,
          competitorId: closeout.competitor?.id ?? null,
          competitorName: closeout.competitor?.name ?? null,
        },
        occurredAt: closeout.recordedAt,
      },
    });

    return closeout;
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

async function resolveTaskAssigneeUserId({
  tx,
  organizationId,
  userId,
}: {
  tx: OpportunityWriteTransactionClient;
  organizationId: string;
  userId: string | null | undefined;
}) {
  const normalizedUserId = normalizeOptionalText(userId);

  if (!normalizedUserId) {
    return null;
  }

  const assignee = await tx.user.findFirst({
    where: {
      id: normalizedUserId,
      organizationId,
    },
    select: {
      id: true,
    },
  });

  if (!assignee) {
    throw new Error("The selected task assignee is not available in this workspace.");
  }

  return assignee.id;
}

async function resolveProposalOwnerUserId({
  tx,
  organizationId,
  userId,
}: {
  tx: OpportunityWriteTransactionClient;
  organizationId: string;
  userId: string | null | undefined;
}) {
  const normalizedUserId = normalizeOptionalText(userId);

  if (!normalizedUserId) {
    return null;
  }

  const owner = await tx.user.findFirst({
    where: {
      id: normalizedUserId,
      organizationId,
    },
    select: {
      id: true,
    },
  });

  if (!owner) {
    throw new Error("The selected proposal owner is not available in this workspace.");
  }

  return owner.id;
}

async function resolveOpportunityCompetitorId({
  tx,
  organizationId,
  competitorId,
  required,
}: {
  tx: OpportunityWriteTransactionClient;
  organizationId: string;
  competitorId: string | null | undefined;
  required: boolean;
}) {
  const normalizedCompetitorId = normalizeOptionalText(competitorId);

  if (!normalizedCompetitorId) {
    if (required) {
      throw new Error(
        "Select a recorded competitor before saving closeout notes for awarded or lost pursuits.",
      );
    }

    return null;
  }

  const competitor = await tx.competitor.findFirst({
    where: {
      id: normalizedCompetitorId,
      organizationId,
    },
    select: {
      id: true,
    },
  });

  if (!competitor) {
    throw new Error("The selected competitor is not available in this workspace.");
  }

  return competitor.id;
}

function buildTaskLifecycleDates({
  status,
  occurredAt,
  existingStartedAt,
  existingCompletedAt,
}: {
  status: OpportunityTaskStatus;
  occurredAt: Date;
  existingStartedAt: Date | null;
  existingCompletedAt: Date | null;
}) {
  const shouldRetainStartedAt =
    status === "IN_PROGRESS" || status === "BLOCKED" || status === "COMPLETED";

  return {
    startedAt: shouldRetainStartedAt ? existingStartedAt ?? occurredAt : null,
    completedAt:
      status === "COMPLETED" ? existingCompletedAt ?? occurredAt : null,
  };
}

function buildMilestoneLifecycleDates({
  status,
  occurredAt,
  existingCompletedAt,
}: {
  status: OpportunityMilestoneStatus;
  occurredAt: Date;
  existingCompletedAt: Date | null;
}) {
  return {
    completedAt:
      status === "COMPLETED" ? existingCompletedAt ?? occurredAt : null,
  };
}

async function resolveProposalLinkedDocuments({
  tx,
  organizationId,
  opportunityId,
  documentIds,
}: {
  tx: OpportunityWriteTransactionClient;
  organizationId: string;
  opportunityId: string;
  documentIds: string[];
}) {
  const normalizedDocumentIds = [
    ...new Set(documentIds.map((documentId) => documentId.trim()).filter(Boolean)),
  ];

  if (normalizedDocumentIds.length === 0) {
    return [];
  }

  const documents = await tx.opportunityDocument.findMany({
    where: {
      id: {
        in: normalizedDocumentIds,
      },
      opportunityId,
      organizationId,
    },
    select: {
      id: true,
      title: true,
    },
  });

  if (documents.length !== normalizedDocumentIds.length) {
    throw new Error(
      "One or more linked proposal documents are no longer available in this workspace.",
    );
  }

  const documentsById = new Map(documents.map((document) => [document.id, document]));

  return normalizedDocumentIds.map((documentId) => {
    const document = documentsById.get(documentId);

    if (!document) {
      throw new Error(
        "One or more linked proposal documents are no longer available in this workspace.",
      );
    }

    return document;
  });
}

async function syncProposalChecklistItems({
  tx,
  proposalId,
  organizationId,
  occurredAt,
  completedChecklistKeys,
  existingItems,
}: {
  tx: OpportunityWriteTransactionClient;
  proposalId: string;
  organizationId: string;
  occurredAt: Date;
  completedChecklistKeys: OpportunityProposalChecklistKey[];
  existingItems: OpportunityProposalAuditRecord["checklistItems"];
}) {
  const completedKeySet = new Set(completedChecklistKeys);
  const existingItemsByKey = new Map(
    existingItems.map((item) => [item.checklistKey, item]),
  );

  await tx.opportunityProposalChecklistItem.deleteMany({
    where: {
      proposalId,
    },
  });

  await tx.opportunityProposalChecklistItem.createMany({
    data: OPPORTUNITY_PROPOSAL_CHECKLIST_ITEMS.map((item, index) => {
      const existingItem = existingItemsByKey.get(item.key);
      const isComplete = completedKeySet.has(item.key);

      return {
        organizationId,
        proposalId,
        checklistKey: item.key,
        checklistLabel: item.label,
        isComplete,
        completedAt: isComplete
          ? existingItem?.completedAt ?? occurredAt
          : null,
        sortOrder: index,
      };
    }),
  });
}

async function syncProposalDocumentLinks({
  tx,
  proposalId,
  documentIds,
}: {
  tx: OpportunityWriteTransactionClient;
  proposalId: string;
  documentIds: string[];
}) {
  await tx.opportunityProposalDocument.deleteMany({
    where: {
      proposalId,
    },
  });

  if (documentIds.length === 0) {
    return;
  }

  await tx.opportunityProposalDocument.createMany({
    data: documentIds.map((documentId) => ({
      proposalId,
      documentId,
    })),
  });
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

function humanizeProposalStatus(status: OpportunityProposalStatus) {
  return status
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function isClosedStageKey(stageKey: string) {
  return stageKey === "awarded" || stageKey === "lost" || stageKey === "no_bid";
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

function buildStringArrayFieldChange(previousValue: string[], nextValue: string[]) {
  const sortedPreviousValue = [...previousValue].sort();
  const sortedNextValue = [...nextValue].sort();

  if (JSON.stringify(sortedPreviousValue) === JSON.stringify(sortedNextValue)) {
    return null;
  }

  return {
    from: sortedPreviousValue,
    to: sortedNextValue,
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
