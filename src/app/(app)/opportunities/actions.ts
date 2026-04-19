"use server";

import { AuditActorType } from "@prisma/client";
import { requireAppPermission } from "@/lib/auth/authorization";
import { prisma } from "@/lib/prisma";
import {
  INITIAL_OPPORTUNITY_BID_DECISION_ACTION_STATE,
  validateOpportunityBidDecisionFormSubmission,
  type OpportunityBidDecisionActionState,
} from "@/modules/opportunities/opportunity-bid-decision-form.schema";
import {
  INITIAL_OPPORTUNITY_CLOSEOUT_ACTION_STATE,
  validateOpportunityCloseoutFormSubmission,
  type OpportunityCloseoutActionState,
} from "@/modules/opportunities/opportunity-closeout-form.schema";
import {
  INITIAL_OPPORTUNITY_DOCUMENT_ACTION_STATE,
  validateOpportunityDocumentFormSubmission,
  type OpportunityDocumentActionState,
} from "@/modules/opportunities/opportunity-document-form.schema";
import {
  INITIAL_OPPORTUNITY_FORM_ACTION_STATE,
  validateOpportunityFormSubmission,
  type OpportunityFormActionState,
} from "@/modules/opportunities/opportunity-form.schema";
import {
  INITIAL_OPPORTUNITY_MILESTONE_ACTION_STATE,
  validateOpportunityMilestoneFormSubmission,
  type OpportunityMilestoneActionState,
} from "@/modules/opportunities/opportunity-milestone-form.schema";
import {
  INITIAL_OPPORTUNITY_NOTE_ACTION_STATE,
  validateOpportunityNoteFormSubmission,
  type OpportunityNoteActionState,
} from "@/modules/opportunities/opportunity-note-form.schema";
import {
  INITIAL_OPPORTUNITY_PROPOSAL_ACTION_STATE,
  validateOpportunityProposalFormSubmission,
  type OpportunityProposalActionState,
} from "@/modules/opportunities/opportunity-proposal-form.schema";
import {
  INITIAL_OPPORTUNITY_TASK_ACTION_STATE,
  validateOpportunityTaskFormSubmission,
  type OpportunityTaskActionState,
} from "@/modules/opportunities/opportunity-task-form.schema";
import {
  createOpportunityDocument,
  createOpportunity,
  createOpportunityMilestone,
  createOpportunityNote,
  deleteOpportunityProposal,
  createOpportunityTask,
  deleteOpportunityMilestone,
  deleteOpportunityTask,
  recordBidDecision,
  recordOpportunityCloseout,
  recordStageTransition,
  upsertOpportunityProposal,
  updateOpportunityMilestone,
  updateOpportunityTask,
  updateOpportunity,
  type OpportunityWriteClient,
} from "@/modules/opportunities/opportunity-write.service";
import { persistOpportunityDocumentUpload } from "@/modules/opportunities/opportunity-document-storage";
import {
  INITIAL_OPPORTUNITY_STAGE_TRANSITION_ACTION_STATE,
  OpportunityStageTransitionValidationError,
  type OpportunityStageTransitionActionState,
} from "@/modules/opportunities/opportunity-stage-policy";
import { redirect } from "next/navigation";

export async function createOpportunityAction(
  _previousState: OpportunityFormActionState,
  formData: FormData,
): Promise<OpportunityFormActionState> {
  const { session } = await requireAppPermission("manage_pipeline");
  const validation = validateOpportunityFormSubmission(formData);

  if (!validation.success) {
    return validation.state;
  }

  let createdOpportunityId: string;

  try {
    const opportunity = await createOpportunity({
      db: prisma as unknown as OpportunityWriteClient,
      input: {
        actor: buildOpportunityActor(session.user),
        title: validation.submission.title,
        description: validation.submission.description,
        leadAgencyId: validation.submission.leadAgencyId,
        responseDeadlineAt: validation.submission.responseDeadlineAt,
        solicitationNumber: validation.submission.solicitationNumber,
        naicsCode: validation.submission.naicsCode,
        currentStageKey: "identified",
      },
    });

    createdOpportunityId = opportunity.id;
  } catch (error) {
    return {
      ...INITIAL_OPPORTUNITY_FORM_ACTION_STATE,
      formError:
        error instanceof Error
          ? error.message
          : "The opportunity could not be created.",
    };
  }

  redirect(`/opportunities/${createdOpportunityId}/edit?created=1`);
}

export async function recordOpportunityBidDecisionAction(
  _previousState: OpportunityBidDecisionActionState,
  formData: FormData,
): Promise<OpportunityBidDecisionActionState> {
  const { session } = await requireAppPermission("manage_pipeline");
  const opportunityId = readRequiredString(formData.get("opportunityId"));
  const validation = validateOpportunityBidDecisionFormSubmission(formData);

  if (!validation.success) {
    return validation.state;
  }

  try {
    await recordBidDecision({
      db: prisma as unknown as OpportunityWriteClient,
      input: {
        actor: buildOpportunityActor(session.user),
        opportunityId,
        decisionTypeKey: validation.submission.decisionTypeKey,
        recommendedByActorType: validation.submission.recommendationOutcome
          ? AuditActorType.SYSTEM
          : undefined,
        recommendedByIdentifier: validation.submission.recommendationSource,
        recommendationOutcome: validation.submission.recommendationOutcome,
        recommendationSummary: validation.submission.recommendationSummary,
        finalOutcome: validation.submission.finalOutcome,
        finalRationale: validation.submission.finalRationale,
        recommendedAt: validation.submission.recommendedAt,
      },
    });
  } catch (error) {
    return {
      ...INITIAL_OPPORTUNITY_BID_DECISION_ACTION_STATE,
      formError:
        error instanceof Error
          ? error.message
          : "The bid decision could not be recorded.",
    };
  }

  revalidateOpportunitySurfaces(opportunityId);

  return {
    ...INITIAL_OPPORTUNITY_BID_DECISION_ACTION_STATE,
    successMessage: "Bid decision recorded and added to workspace history.",
  };
}

export async function recordOpportunityCloseoutAction(
  _previousState: OpportunityCloseoutActionState,
  formData: FormData,
): Promise<OpportunityCloseoutActionState> {
  const { session } = await requireAppPermission("manage_pipeline");
  const opportunityId = readRequiredString(formData.get("opportunityId"));
  const validation = validateOpportunityCloseoutFormSubmission(formData);

  if (!validation.success) {
    return validation.state;
  }

  try {
    await recordOpportunityCloseout({
      db: prisma as unknown as OpportunityWriteClient,
      input: {
        actor: buildOpportunityActor(session.user),
        opportunityId,
        competitorId: validation.submission.competitorId,
        outcomeReason: validation.submission.outcomeReason,
        lessonsLearned: validation.submission.lessonsLearned,
      },
    });
  } catch (error) {
    return {
      ...INITIAL_OPPORTUNITY_CLOSEOUT_ACTION_STATE,
      formError:
        error instanceof Error
          ? error.message
          : "The opportunity closeout could not be recorded.",
    };
  }

  revalidateOpportunitySurfaces(opportunityId);

  return {
    ...INITIAL_OPPORTUNITY_CLOSEOUT_ACTION_STATE,
    successMessage: "Closeout notes recorded and added to workspace history.",
  };
}

export async function updateOpportunityAction(
  _previousState: OpportunityFormActionState,
  formData: FormData,
): Promise<OpportunityFormActionState> {
  const { session } = await requireAppPermission("manage_pipeline");
  const opportunityId = readRequiredString(formData.get("opportunityId"));
  const validation = validateOpportunityFormSubmission(formData);

  if (!validation.success) {
    return validation.state;
  }

  try {
    await updateOpportunity({
      db: prisma as unknown as OpportunityWriteClient,
      input: {
        actor: buildOpportunityActor(session.user),
        opportunityId,
        title: validation.submission.title,
        description: validation.submission.description,
        leadAgencyId: validation.submission.leadAgencyId,
        responseDeadlineAt: validation.submission.responseDeadlineAt,
        solicitationNumber: validation.submission.solicitationNumber,
        naicsCode: validation.submission.naicsCode,
      },
    });
  } catch (error) {
    return {
      ...INITIAL_OPPORTUNITY_FORM_ACTION_STATE,
      formError:
        error instanceof Error
          ? error.message
          : "The opportunity could not be updated.",
    };
  }

  redirect(`/opportunities/${opportunityId}/edit?updated=1`);
}

export async function transitionOpportunityStageAction(
  _previousState: OpportunityStageTransitionActionState,
  formData: FormData,
): Promise<OpportunityStageTransitionActionState> {
  const { session } = await requireAppPermission("manage_pipeline");
  const opportunityId = readRequiredString(formData.get("opportunityId"));
  const toStageKey = readRequiredString(formData.get("toStageKey"));
  const rationale = String(formData.get("rationale") ?? "");

  try {
    const result = await recordStageTransition({
      db: prisma as unknown as OpportunityWriteClient,
      input: {
        actor: buildOpportunityActor(session.user),
        opportunityId,
        rationale,
        toStageKey,
      },
    });

    return {
      ...INITIAL_OPPORTUNITY_STAGE_TRANSITION_ACTION_STATE,
      successMessage: `Stage updated to ${result.transition.toStageLabel ?? result.transition.toStageKey}.`,
    };
  } catch (error) {
    const formError =
      error instanceof OpportunityStageTransitionValidationError
        ? error.message
        : error instanceof Error
          ? error.message
          : "The opportunity stage could not be updated.";

    return {
      ...INITIAL_OPPORTUNITY_STAGE_TRANSITION_ACTION_STATE,
      formError,
    };
  }
}

export async function createOpportunityTaskAction(
  _previousState: OpportunityTaskActionState,
  formData: FormData,
): Promise<OpportunityTaskActionState> {
  const { session } = await requireAppPermission("manage_pipeline");
  const opportunityId = readRequiredString(formData.get("opportunityId"));
  const validation = validateOpportunityTaskFormSubmission(formData);

  if (!validation.success) {
    return validation.state;
  }

  try {
    await createOpportunityTask({
      db: prisma as unknown as OpportunityWriteClient,
      input: {
        actor: buildOpportunityActor(session.user),
        opportunityId,
        title: validation.submission.title,
        description: validation.submission.description,
        assigneeUserId: validation.submission.assigneeUserId,
        dueAt: validation.submission.dueAt,
        status: validation.submission.status,
        priority: validation.submission.priority,
      },
    });
  } catch (error) {
    return {
      ...INITIAL_OPPORTUNITY_TASK_ACTION_STATE,
      formError:
        error instanceof Error ? error.message : "The task could not be created.",
    };
  }

  revalidateOpportunitySurfaces(opportunityId);

  return {
    ...INITIAL_OPPORTUNITY_TASK_ACTION_STATE,
    successMessage: "Task created and added to the workspace.",
  };
}

export async function createOpportunityMilestoneAction(
  _previousState: OpportunityMilestoneActionState,
  formData: FormData,
): Promise<OpportunityMilestoneActionState> {
  const { session } = await requireAppPermission("manage_pipeline");
  const opportunityId = readRequiredString(formData.get("opportunityId"));
  const validation = validateOpportunityMilestoneFormSubmission(formData);

  if (!validation.success) {
    return validation.state;
  }

  try {
    await createOpportunityMilestone({
      db: prisma as unknown as OpportunityWriteClient,
      input: {
        actor: buildOpportunityActor(session.user),
        opportunityId,
        title: validation.submission.title,
        description: validation.submission.description,
        milestoneTypeKey: validation.submission.milestoneTypeKey,
        targetDate: validation.submission.targetDate,
        status: validation.submission.status,
      },
    });
  } catch (error) {
    return {
      ...INITIAL_OPPORTUNITY_MILESTONE_ACTION_STATE,
      formError:
        error instanceof Error
          ? error.message
          : "The milestone could not be created.",
    };
  }

  revalidateOpportunitySurfaces(opportunityId);

  return {
    ...INITIAL_OPPORTUNITY_MILESTONE_ACTION_STATE,
    successMessage: "Milestone created and added to the workspace.",
  };
}

export async function createOpportunityNoteAction(
  _previousState: OpportunityNoteActionState,
  formData: FormData,
): Promise<OpportunityNoteActionState> {
  const { session } = await requireAppPermission("manage_pipeline");
  const opportunityId = readRequiredString(formData.get("opportunityId"));
  const validation = validateOpportunityNoteFormSubmission(formData);

  if (!validation.success) {
    return validation.state;
  }

  try {
    await createOpportunityNote({
      db: prisma as unknown as OpportunityWriteClient,
      input: {
        actor: buildOpportunityActor(session.user),
        opportunityId,
        title: validation.submission.title,
        body: validation.submission.body,
        isPinned: validation.submission.isPinned,
      },
    });
  } catch (error) {
    return {
      ...INITIAL_OPPORTUNITY_NOTE_ACTION_STATE,
      formError:
        error instanceof Error ? error.message : "The note could not be created.",
    };
  }

  revalidateOpportunitySurfaces(opportunityId);

  return {
    ...INITIAL_OPPORTUNITY_NOTE_ACTION_STATE,
    successMessage: "Note saved to the workspace history.",
  };
}

export async function createOpportunityDocumentAction(
  _previousState: OpportunityDocumentActionState,
  formData: FormData,
): Promise<OpportunityDocumentActionState> {
  const { session } = await requireAppPermission("manage_pipeline");
  const opportunityId = readRequiredString(formData.get("opportunityId"));
  const validation = validateOpportunityDocumentFormSubmission(formData);

  if (!validation.success) {
    return validation.state;
  }

  try {
    const upload = await persistOpportunityDocumentUpload({
      file: validation.submission.file,
      opportunityId,
    });

    await createOpportunityDocument({
      db: prisma as unknown as OpportunityWriteClient,
      input: {
        actor: buildOpportunityActor(session.user),
        opportunityId,
        title: validation.submission.title,
        documentType: validation.submission.documentType,
        originalFileName: upload.originalFileName,
        storageProvider: "local_disk",
        storagePath: upload.storagePath,
        mimeType: upload.mimeType,
        fileSizeBytes: upload.fileSizeBytes,
        checksumSha256: upload.checksumSha256,
        extractedText: upload.extractedText,
        extractionStatus: upload.extractionStatus,
        extractedAt: upload.extractedAt,
        metadata: upload.metadata,
      },
    });
  } catch (error) {
    return {
      ...INITIAL_OPPORTUNITY_DOCUMENT_ACTION_STATE,
      formError:
        error instanceof Error
          ? error.message
          : "The document could not be uploaded.",
    };
  }

  revalidateOpportunitySurfaces(opportunityId);

  return {
    ...INITIAL_OPPORTUNITY_DOCUMENT_ACTION_STATE,
    successMessage:
      "Document uploaded. The workspace now shows the stored metadata and queued extraction status.",
  };
}

export async function saveOpportunityProposalAction(
  _previousState: OpportunityProposalActionState,
  formData: FormData,
): Promise<OpportunityProposalActionState> {
  const { session } = await requireAppPermission("manage_pipeline");
  const opportunityId = readRequiredString(formData.get("opportunityId"));
  const validation = validateOpportunityProposalFormSubmission(formData);

  if (!validation.success) {
    return validation.state;
  }

  try {
    await upsertOpportunityProposal({
      db: prisma as unknown as OpportunityWriteClient,
      input: {
        actor: buildOpportunityActor(session.user),
        opportunityId,
        status: validation.submission.status,
        ownerUserId: validation.submission.ownerUserId,
        completedChecklistKeys: validation.submission.completedChecklistKeys,
        linkedDocumentIds: validation.submission.linkedDocumentIds,
      },
    });
  } catch (error) {
    return {
      ...INITIAL_OPPORTUNITY_PROPOSAL_ACTION_STATE,
      formError:
        error instanceof Error
          ? error.message
          : "The proposal record could not be saved.",
    };
  }

  revalidateOpportunitySurfaces(opportunityId);

  return {
    ...INITIAL_OPPORTUNITY_PROPOSAL_ACTION_STATE,
    successMessage: "Proposal tracking saved to the workspace.",
  };
}

export async function deleteOpportunityProposalAction(
  _previousState: OpportunityProposalActionState,
  formData: FormData,
): Promise<OpportunityProposalActionState> {
  const { session } = await requireAppPermission("manage_pipeline");
  const opportunityId = readRequiredString(formData.get("opportunityId"));
  const proposalId = readRequiredString(formData.get("proposalId"));

  try {
    await deleteOpportunityProposal({
      db: prisma as unknown as OpportunityWriteClient,
      input: {
        actor: buildOpportunityActor(session.user),
        proposalId,
      },
    });
  } catch (error) {
    return {
      ...INITIAL_OPPORTUNITY_PROPOSAL_ACTION_STATE,
      formError:
        error instanceof Error
          ? error.message
          : "The proposal record could not be deleted.",
    };
  }

  revalidateOpportunitySurfaces(opportunityId);

  return {
    ...INITIAL_OPPORTUNITY_PROPOSAL_ACTION_STATE,
    successMessage: "Proposal record removed from the workspace.",
  };
}

export async function updateOpportunityTaskAction(
  _previousState: OpportunityTaskActionState,
  formData: FormData,
): Promise<OpportunityTaskActionState> {
  const { session } = await requireAppPermission("manage_pipeline");
  const opportunityId = readRequiredString(formData.get("opportunityId"));
  const taskId = readRequiredString(formData.get("taskId"));
  const validation = validateOpportunityTaskFormSubmission(formData);

  if (!validation.success) {
    return validation.state;
  }

  try {
    await updateOpportunityTask({
      db: prisma as unknown as OpportunityWriteClient,
      input: {
        actor: buildOpportunityActor(session.user),
        taskId,
        title: validation.submission.title,
        description: validation.submission.description,
        assigneeUserId: validation.submission.assigneeUserId,
        dueAt: validation.submission.dueAt,
        status: validation.submission.status,
        priority: validation.submission.priority,
      },
    });
  } catch (error) {
    return {
      ...INITIAL_OPPORTUNITY_TASK_ACTION_STATE,
      formError:
        error instanceof Error ? error.message : "The task could not be updated.",
    };
  }

  revalidateOpportunitySurfaces(opportunityId);

  return {
    ...INITIAL_OPPORTUNITY_TASK_ACTION_STATE,
    successMessage: "Task changes saved.",
  };
}

export async function updateOpportunityMilestoneAction(
  _previousState: OpportunityMilestoneActionState,
  formData: FormData,
): Promise<OpportunityMilestoneActionState> {
  const { session } = await requireAppPermission("manage_pipeline");
  const opportunityId = readRequiredString(formData.get("opportunityId"));
  const milestoneId = readRequiredString(formData.get("milestoneId"));
  const validation = validateOpportunityMilestoneFormSubmission(formData);

  if (!validation.success) {
    return validation.state;
  }

  try {
    await updateOpportunityMilestone({
      db: prisma as unknown as OpportunityWriteClient,
      input: {
        actor: buildOpportunityActor(session.user),
        milestoneId,
        title: validation.submission.title,
        description: validation.submission.description,
        milestoneTypeKey: validation.submission.milestoneTypeKey,
        targetDate: validation.submission.targetDate,
        status: validation.submission.status,
      },
    });
  } catch (error) {
    return {
      ...INITIAL_OPPORTUNITY_MILESTONE_ACTION_STATE,
      formError:
        error instanceof Error
          ? error.message
          : "The milestone could not be updated.",
    };
  }

  revalidateOpportunitySurfaces(opportunityId);

  return {
    ...INITIAL_OPPORTUNITY_MILESTONE_ACTION_STATE,
    successMessage: "Milestone changes saved.",
  };
}

export async function deleteOpportunityTaskAction(
  _previousState: OpportunityTaskActionState,
  formData: FormData,
): Promise<OpportunityTaskActionState> {
  const { session } = await requireAppPermission("manage_pipeline");
  const opportunityId = readRequiredString(formData.get("opportunityId"));
  const taskId = readRequiredString(formData.get("taskId"));

  try {
    await deleteOpportunityTask({
      db: prisma as unknown as OpportunityWriteClient,
      input: {
        actor: buildOpportunityActor(session.user),
        taskId,
      },
    });
  } catch (error) {
    return {
      ...INITIAL_OPPORTUNITY_TASK_ACTION_STATE,
      formError:
        error instanceof Error ? error.message : "The task could not be deleted.",
    };
  }

  revalidateOpportunitySurfaces(opportunityId);

  return {
    ...INITIAL_OPPORTUNITY_TASK_ACTION_STATE,
    successMessage: "Task deleted.",
  };
}

export async function deleteOpportunityMilestoneAction(
  _previousState: OpportunityMilestoneActionState,
  formData: FormData,
): Promise<OpportunityMilestoneActionState> {
  const { session } = await requireAppPermission("manage_pipeline");
  const opportunityId = readRequiredString(formData.get("opportunityId"));
  const milestoneId = readRequiredString(formData.get("milestoneId"));

  try {
    await deleteOpportunityMilestone({
      db: prisma as unknown as OpportunityWriteClient,
      input: {
        actor: buildOpportunityActor(session.user),
        milestoneId,
      },
    });
  } catch (error) {
    return {
      ...INITIAL_OPPORTUNITY_MILESTONE_ACTION_STATE,
      formError:
        error instanceof Error
          ? error.message
          : "The milestone could not be deleted.",
    };
  }

  revalidateOpportunitySurfaces(opportunityId);

  return {
    ...INITIAL_OPPORTUNITY_MILESTONE_ACTION_STATE,
    successMessage: "Milestone deleted.",
  };
}

function buildOpportunityActor(user: {
  email?: string | null;
  id: string;
  organizationId: string;
}) {
  return {
    identifier: user.email ?? null,
    organizationId: user.organizationId,
    type: "USER" as const,
    userId: user.id,
  };
}

function readRequiredString(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("A required opportunity form value is missing.");
  }

  return value;
}

function revalidateOpportunitySurfaces(opportunityId: string) {
  void opportunityId;
  // The workspace, task board, dashboard, and pipeline routes are force-dynamic,
  // and the client explicitly calls router.refresh() after each successful mutation.
  // Avoid blocking the server action response on redundant invalidation work.
}
