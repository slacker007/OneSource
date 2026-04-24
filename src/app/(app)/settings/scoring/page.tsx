import { recalibrateScoringProfileAction } from "../actions";

import { AdminScoringSettings } from "@/components/admin/admin-console";
import { requireAppPermission } from "@/lib/auth/authorization";
import { prisma } from "@/lib/prisma";
import { getAdminScoringSettingsSnapshot } from "@/modules/admin/admin.repository";

export const dynamic = "force-dynamic";

type SettingsScoringPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SettingsScoringPage({
  searchParams,
}: SettingsScoringPageProps) {
  const { session } = await requireAppPermission("manage_workspace_settings");
  const resolvedSearchParams = await searchParams;
  const snapshot = await getAdminScoringSettingsSnapshot({
    db: prisma,
    organizationId: session.user.organizationId,
  });
  const scoringRecalibration = readSingleSearchParam(
    resolvedSearchParams?.scoringRecalibration,
  );
  const scoringRecalibrationMode = readSingleSearchParam(
    resolvedSearchParams?.scoringRecalibrationMode,
  );
  const scoringRecalibrationMessage = readSingleSearchParam(
    resolvedSearchParams?.scoringRecalibrationMessage,
  );
  const scoringRecalibrationRecalculated = readSingleSearchParam(
    resolvedSearchParams?.scoringRecalibrationRecalculated,
  );
  const scoringRecalibrationVersion = readSingleSearchParam(
    resolvedSearchParams?.scoringRecalibrationVersion,
  );

  return (
    <AdminScoringSettings
      recalibrateScoringProfileAction={recalibrateScoringProfileAction}
      scoringRecalibrationNotice={
        scoringRecalibration === "success"
          ? {
              message: `${
                scoringRecalibrationMode === "suggested"
                  ? "Observed-outcome suggestions were applied."
                  : "Manual scoring recalibration was saved."
              } ${
                scoringRecalibrationRecalculated
                  ? `${scoringRecalibrationRecalculated} scorecards were recalculated`
                  : "Scorecards were recalculated"
              } under model version ${
                scoringRecalibrationVersion ?? "the new configuration"
              }.`,
              tone: "accent",
            }
          : scoringRecalibration === "error"
            ? {
                message:
                  scoringRecalibrationMessage ??
                  "The scoring recalibration could not be completed.",
                tone: "danger",
              }
            : null
      }
      snapshot={snapshot}
    />
  );
}

function readSingleSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return typeof value === "string" ? value : null;
}
