"use server";

import { redirect } from "next/navigation";

import { requireAppPermission } from "@/lib/auth/authorization";
import { prisma } from "@/lib/prisma";
import {
  parseRequiredDecimal,
  parseScoringWeightMap,
  persistScoringRecalibration,
} from "@/modules/admin/scoring-recalibration.service";
import {
  queueSourceSyncRetry,
  type SourceSyncJobClient,
} from "@/modules/source-integrations/source-sync-job";

export async function queueSourceSyncRetryAction(formData: FormData) {
  const { session } = await requireAppPermission("manage_workspace_settings");
  const savedSearchId = readRequiredString(formData.get("savedSearchId"));

  let redirectPath = "/settings";

  try {
    const result = await queueSourceSyncRetry({
      db: prisma as unknown as SourceSyncJobClient,
      organizationId: session.user.organizationId,
      savedSearchId,
    });

    redirectPath = `/settings?sourceSyncRetry=success&sourceSyncRetryStatus=${result.status.toLowerCase()}`;
  } catch (error) {
    redirectPath = `/settings?sourceSyncRetry=error&sourceSyncRetryMessage=${encodeURIComponent(
      error instanceof Error
        ? error.message
        : "The saved search retry could not be completed.",
    )}`;
  }

  redirect(redirectPath);
}

export async function recalibrateScoringProfileAction(formData: FormData) {
  const { session } = await requireAppPermission("manage_workspace_settings");
  const recalibrationMode = readRequiredString(formData.get("recalibrationMode"));
  let redirectPath = "/settings";

  try {
    const weightPrefix =
      recalibrationMode === "suggested" ? "suggestedWeight" : "weight";
    const result = await persistScoringRecalibration({
      db: prisma as never,
      input: {
        organizationId: session.user.organizationId,
        performedByUserId: session.user.id,
        mode:
          recalibrationMode === "suggested" ? "suggested" : "manual",
        note: readOptionalString(formData.get("recalibrationNote")),
        goRecommendationThreshold: parseRequiredDecimal(
          formData.get("goRecommendationThreshold"),
          "go recommendation threshold",
        ),
        deferRecommendationThreshold: parseRequiredDecimal(
          formData.get("deferRecommendationThreshold"),
          "defer recommendation threshold",
        ),
        minimumRiskScorePercent: parseRequiredDecimal(
          formData.get("minimumRiskScorePercent"),
          "minimum risk score percent",
        ),
        weightByFactorKey: parseScoringWeightMap(
          Object.fromEntries(formData.entries()),
          weightPrefix,
        ),
      },
    });

    redirectPath = `/settings?scoringRecalibration=success&scoringRecalibrationMode=${encodeURIComponent(
      recalibrationMode,
    )}&scoringRecalibrationRecalculated=${result.sweepResult.recalculatedOpportunities}&scoringRecalibrationVersion=${encodeURIComponent(
      result.scoringModelVersion,
    )}`;
  } catch (error) {
    redirectPath = `/settings?scoringRecalibration=error&scoringRecalibrationMessage=${encodeURIComponent(
      error instanceof Error
        ? error.message
        : "The scoring recalibration could not be completed.",
    )}`;
  }

  redirect(redirectPath);
}

function readRequiredString(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("A required settings form value is missing.");
  }

  return value;
}

function readOptionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}
