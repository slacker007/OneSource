"use server";

import { redirect } from "next/navigation";

import { requireAppPermission } from "@/lib/auth/authorization";
import { prisma } from "@/lib/prisma";
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

function readRequiredString(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("A saved search retry value is missing.");
  }

  return value;
}
