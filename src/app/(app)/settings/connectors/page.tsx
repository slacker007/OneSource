import { queueSourceSyncRetryAction } from "../actions";

import { AdminConnectorSettings } from "@/components/admin/admin-console";
import { requireAppPermission } from "@/lib/auth/authorization";
import { prisma } from "@/lib/prisma";
import { getAdminConnectorSettingsSnapshot } from "@/modules/admin/admin.repository";

export const dynamic = "force-dynamic";

type SettingsConnectorsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SettingsConnectorsPage({
  searchParams,
}: SettingsConnectorsPageProps) {
  const { session } = await requireAppPermission("manage_workspace_settings");
  const resolvedSearchParams = await searchParams;
  const snapshot = await getAdminConnectorSettingsSnapshot({
    db: prisma,
    organizationId: session.user.organizationId,
  });
  const sourceSyncRetry = readSingleSearchParam(
    resolvedSearchParams?.sourceSyncRetry,
  );
  const sourceSyncRetryStatus = readSingleSearchParam(
    resolvedSearchParams?.sourceSyncRetryStatus,
  );
  const sourceSyncRetryMessage = readSingleSearchParam(
    resolvedSearchParams?.sourceSyncRetryMessage,
  );

  return (
    <AdminConnectorSettings
      retrySourceSyncAction={queueSourceSyncRetryAction}
      snapshot={snapshot}
      sourceSyncRetryNotice={
        sourceSyncRetry === "success"
          ? {
              message:
                sourceSyncRetryStatus === "queued"
                  ? "The saved search retry has been queued for the next sync sweep."
                  : "The saved search retry request was recorded. Review the sync table for details.",
              tone: sourceSyncRetryStatus === "queued" ? "accent" : "warning",
            }
          : sourceSyncRetry === "error"
            ? {
                message:
                  sourceSyncRetryMessage ??
                  "The saved search retry could not be completed.",
                tone: "danger",
              }
            : null
      }
    />
  );
}

function readSingleSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return typeof value === "string" ? value : null;
}
