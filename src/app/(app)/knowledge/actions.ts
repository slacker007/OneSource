"use server";

import { redirect } from "next/navigation";

import { requireAppPermission } from "@/lib/auth/authorization";
import { prisma } from "@/lib/prisma";
import {
  INITIAL_KNOWLEDGE_ASSET_FORM_ACTION_STATE,
  validateKnowledgeAssetFormSubmission,
  type KnowledgeAssetFormActionState,
} from "@/modules/knowledge/knowledge-form.schema";
import {
  buildKnowledgeActor,
  createKnowledgeAsset,
  deleteKnowledgeAsset,
  updateKnowledgeAsset,
  type KnowledgeAssetWriteClient,
} from "@/modules/knowledge/knowledge-write.service";

export async function createKnowledgeAssetAction(
  _previousState: KnowledgeAssetFormActionState,
  formData: FormData,
): Promise<KnowledgeAssetFormActionState> {
  const { session } = await requireAppPermission("manage_pipeline");
  const validation = validateKnowledgeAssetFormSubmission(formData);

  if (!validation.success) {
    return validation.state;
  }

  let knowledgeAssetId: string;

  try {
    const knowledgeAsset = await createKnowledgeAsset({
      db: prisma as unknown as KnowledgeAssetWriteClient,
      input: {
        actor: buildKnowledgeActor(session.user),
        ...validation.submission,
      },
    });

    knowledgeAssetId = knowledgeAsset.id;
  } catch (error) {
    return {
      ...INITIAL_KNOWLEDGE_ASSET_FORM_ACTION_STATE,
      formError:
        error instanceof Error
          ? error.message
          : "The knowledge asset could not be created.",
    };
  }

  redirect(`/knowledge/${knowledgeAssetId}/edit?created=1`);
}

export async function updateKnowledgeAssetAction(
  _previousState: KnowledgeAssetFormActionState,
  formData: FormData,
): Promise<KnowledgeAssetFormActionState> {
  const { session } = await requireAppPermission("manage_pipeline");
  const knowledgeAssetId = readRequiredString(formData.get("knowledgeAssetId"));
  const validation = validateKnowledgeAssetFormSubmission(formData);

  if (!validation.success) {
    return validation.state;
  }

  try {
    await updateKnowledgeAsset({
      db: prisma as unknown as KnowledgeAssetWriteClient,
      input: {
        actor: buildKnowledgeActor(session.user),
        knowledgeAssetId,
        ...validation.submission,
      },
    });
  } catch (error) {
    return {
      ...INITIAL_KNOWLEDGE_ASSET_FORM_ACTION_STATE,
      formError:
        error instanceof Error
          ? error.message
          : "The knowledge asset could not be updated.",
    };
  }

  redirect(`/knowledge/${knowledgeAssetId}/edit?updated=1`);
}

export async function deleteKnowledgeAssetAction(formData: FormData) {
  const { session } = await requireAppPermission("manage_pipeline");
  const knowledgeAssetId = readRequiredString(formData.get("knowledgeAssetId"));

  await deleteKnowledgeAsset({
    db: prisma as unknown as KnowledgeAssetWriteClient,
    input: {
      actor: buildKnowledgeActor(session.user),
      knowledgeAssetId,
    },
  });

  redirect("/knowledge?deleted=1");
}

function readRequiredString(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("A required knowledge asset value is missing.");
  }

  return value;
}
