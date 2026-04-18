"use server";

import { requireAppPermission } from "@/lib/auth/authorization";
import { prisma } from "@/lib/prisma";
import {
  INITIAL_OPPORTUNITY_FORM_ACTION_STATE,
  validateOpportunityFormSubmission,
  type OpportunityFormActionState,
} from "@/modules/opportunities/opportunity-form.schema";
import {
  createOpportunity,
  updateOpportunity,
  type OpportunityWriteClient,
} from "@/modules/opportunities/opportunity-write.service";
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
