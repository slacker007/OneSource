"use server";

import { revalidatePath } from "next/cache";
import { requireAppPermission } from "@/lib/auth/authorization";
import { prisma } from "@/lib/prisma";
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
  INITIAL_OPPORTUNITY_TASK_ACTION_STATE,
  validateOpportunityTaskFormSubmission,
  type OpportunityTaskActionState,
} from "@/modules/opportunities/opportunity-task-form.schema";
import {
  createOpportunity,
  createOpportunityMilestone,
  createOpportunityNote,
  createOpportunityTask,
  deleteOpportunityMilestone,
  deleteOpportunityTask,
  recordStageTransition,
  updateOpportunityMilestone,
  updateOpportunityTask,
  updateOpportunity,
  type OpportunityWriteClient,
} from "@/modules/opportunities/opportunity-write.service";
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

    revalidatePath(`/opportunities/${opportunityId}`);

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
  revalidatePath("/");
  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${opportunityId}`);
  revalidatePath("/tasks");
}
