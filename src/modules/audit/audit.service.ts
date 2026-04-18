import { AuditActorType, Prisma } from "@prisma/client";

export const AUDIT_ACTIONS = {
  opportunityCreate: "opportunity.create",
  opportunityUpdate: "opportunity.update",
  opportunityDelete: "opportunity.delete",
  opportunityTaskCreate: "opportunity.task.create",
  opportunityTaskUpdate: "opportunity.task.update",
  opportunityTaskDelete: "opportunity.task.delete",
  opportunityMilestoneCreate: "opportunity.milestone.create",
  opportunityMilestoneUpdate: "opportunity.milestone.update",
  opportunityMilestoneDelete: "opportunity.milestone.delete",
  opportunityDocumentCreate: "opportunity.document.create",
  opportunityDocumentExtraction: "opportunity.document.extraction",
  opportunityNoteCreate: "opportunity.note.create",
  opportunityScorecardRecalculate: "opportunity.scorecard.recalculate",
  opportunityStageTransition: "opportunity.stage_transition",
  opportunityDecisionRecord: "opportunity.decision.record",
  opportunityCloseoutRecord: "opportunity.closeout.record",
  organizationScoringRecalibrate: "organization.scoring.recalibrate",
  sourceImportDecisionRecord: "source_import_decision.record",
  knowledgeAssetCreate: "knowledge_asset.create",
  knowledgeAssetUpdate: "knowledge_asset.update",
  knowledgeAssetDelete: "knowledge_asset.delete",
} as const;

export type AuditAction =
  (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export type AuditActorContext = {
  type: AuditActorType;
  userId?: string | null;
  identifier?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type AuditEventInput = {
  organizationId?: string | null;
  actor: AuditActorContext;
  action: AuditAction | string;
  target: {
    type: string;
    id?: string | null;
    display?: string | null;
  };
  summary?: string | null;
  metadata?: Prisma.InputJsonValue | null;
  occurredAt?: Date;
};

export type AuditLogWriter = {
  auditLog: {
    create(args: {
      data: Prisma.AuditLogUncheckedCreateInput;
    }): Promise<unknown>;
  };
};

export function buildAuditLogCreateInput(
  event: AuditEventInput,
): Prisma.AuditLogUncheckedCreateInput {
  return {
    organizationId: event.organizationId ?? null,
    actorUserId: event.actor.userId ?? null,
    actorType: event.actor.type,
    actorIdentifier: event.actor.identifier ?? null,
    action: event.action,
    targetType: event.target.type,
    targetId: event.target.id ?? null,
    targetDisplay: event.target.display ?? null,
    summary: event.summary ?? null,
    metadata: toAuditJson(event.metadata),
    ipAddress: event.actor.ipAddress ?? null,
    userAgent: event.actor.userAgent ?? null,
    occurredAt: event.occurredAt ?? new Date(),
  };
}

export async function recordAuditEvent({
  db,
  event,
}: {
  db: AuditLogWriter;
  event: AuditEventInput;
}) {
  return db.auditLog.create({
    data: buildAuditLogCreateInput(event),
  });
}

function toAuditJson(
  metadata: Prisma.InputJsonValue | null | undefined,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (metadata === undefined) {
    return undefined;
  }

  if (metadata === null) {
    return Prisma.JsonNull;
  }

  return metadata;
}
