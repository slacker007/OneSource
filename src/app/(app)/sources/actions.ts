"use server";

import { redirect } from "next/navigation";

import { requireAppPermission } from "@/lib/auth/authorization";
import { prisma } from "@/lib/prisma";
import {
  applyMockSourceImport,
  type SourceImportRepositoryClient,
} from "@/modules/source-integrations/source-import.service";

export async function applySourceImportAction(formData: FormData) {
  const { session } = await requireAppPermission("manage_source_searches");
  const returnPath = readRequiredString(formData.get("returnPath"));
  const resultId = readRequiredString(formData.get("resultId"));
  const mode = readRequiredString(formData.get("mode"));
  const targetOpportunityId = readOptionalString(formData.get("targetOpportunityId"));
  const searchExecutedAt = readOptionalString(formData.get("searchExecutedAt"));
  const searchQuery = parseOptionalJson(formData.get("searchQuery"));

  try {
    const result = await applyMockSourceImport({
      db: prisma as unknown as SourceImportRepositoryClient,
      input: {
        actor: {
          identifier: session.user.email,
          organizationId: session.user.organizationId,
          type: "USER",
          userId: session.user.id,
        },
        mode:
          mode === "LINK_TO_EXISTING" ? "LINK_TO_EXISTING" : "CREATE_OPPORTUNITY",
        resultId,
        searchExecutedAt,
        searchQuery,
        targetOpportunityId,
      },
    });

    redirect(
      buildReturnPath(returnPath, {
        importStatus: result.action,
        opportunityId: result.targetOpportunityId,
        preview: resultId,
      }),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Source import could not be applied.";

    redirect(
      buildReturnPath(returnPath, {
        importError: message,
        preview: resultId,
      }),
    );
  }
}

function buildReturnPath(
  returnPath: string,
  params: Record<string, string>,
) {
  const [pathname, existingQuery = ""] = returnPath.split("?");
  const searchParams = new URLSearchParams(existingQuery);

  for (const [key, value] of Object.entries(params)) {
    searchParams.set(key, value);
  }

  const queryString = searchParams.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

function readRequiredString(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("A required import form value is missing.");
  }

  return value;
}

function readOptionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseOptionalJson(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
