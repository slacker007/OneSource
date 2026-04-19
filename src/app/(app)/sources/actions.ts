"use server";

import { redirect } from "next/navigation";

import { requireAppPermission } from "@/lib/auth/authorization";
import { prisma } from "@/lib/prisma";
import { createOpportunity, type OpportunityWriteClient } from "@/modules/opportunities/opportunity-write.service";
import {
  buildCsvImportPreview,
  createCsvImportDraft,
  CSV_IMPORT_SOURCE_SYSTEM,
  parseCsvImportMapping,
  getCsvImportWorkspaceSnapshot,
  type CsvImportWorkspaceRepositoryClient,
} from "@/modules/source-integrations/csv-import.service";
import {
  applySourceImport,
  type SourceImportRepositoryClient,
} from "@/modules/source-integrations/source-import.service";

export async function applySourceImportAction(formData: FormData) {
  const { session } = await requireAppPermission("manage_source_searches");
  const returnPath = readRequiredString(formData.get("returnPath"));
  const sourceRecordId = readRequiredString(formData.get("sourceRecordId"));
  const mode = readRequiredString(formData.get("mode"));
  const targetOpportunityId = readOptionalString(formData.get("targetOpportunityId"));
  let redirectPath = buildReturnPath(returnPath, {
    importError: "Source import could not be applied.",
    preview: sourceRecordId,
  });

  try {
    const result = await applySourceImport({
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
        sourceRecordId,
        targetOpportunityId,
      },
    });

    redirectPath = buildReturnPath(returnPath, {
      importStatus: result.action,
      opportunityId: result.targetOpportunityId,
      preview: sourceRecordId,
    });
  } catch (error) {
    redirectPath = buildReturnPath(returnPath, {
      importError:
        error instanceof Error
          ? error.message
          : "Source import could not be applied.",
      preview: sourceRecordId,
    });
  }

  redirect(redirectPath);
}

export async function importCsvOpportunitiesAction(formData: FormData) {
  const { session } = await requireAppPermission("manage_source_searches");
  const fileName = readRequiredString(formData.get("fileName"));
  const csvText = readRequiredString(formData.get("csvText"));
  const returnPath = "/sources";
  const workspaceSnapshot = await getCsvImportWorkspaceSnapshot({
    db: prisma as unknown as CsvImportWorkspaceRepositoryClient,
    organizationId: session.user.organizationId,
  });

  if (!workspaceSnapshot) {
    redirect(
      buildReturnPath(returnPath, {
        csvImportError:
          "The CSV import workspace could not load organization context.",
      }),
    );
  }

  const draftResult = createCsvImportDraft({
    csvText,
    fileName,
    fileSize: Buffer.byteLength(csvText, "utf8"),
  });
  const mapping = parseCsvImportMapping(
    readRequiredString(formData.get("mapping")),
    draftResult.draft?.headers ?? [],
  );

  if (!draftResult.draft || !mapping) {
    redirect(
      buildReturnPath(returnPath, {
        csvImportError:
          "The CSV mapping payload could not be validated on the server.",
      }),
    );
  }

  const preview = buildCsvImportPreview({
    draft: draftResult.draft,
    errors: draftResult.errors,
    mapping,
    workspace: workspaceSnapshot,
  });

  if (preview.hasBlockingErrors) {
    redirect(
      buildReturnPath(returnPath, {
        csvImportError:
          "Resolve the CSV file and mapping errors before importing rows.",
      }),
    );
  }

  const readyRows = [...preview.importableRows];

  if (readyRows.length === 0) {
    redirect(
      buildReturnPath(returnPath, {
        csvImportError: "No clean CSV rows were available to import.",
      }),
    );
  }

  const actor = {
    identifier: session.user.email,
    organizationId: session.user.organizationId,
    type: "USER" as const,
    userId: session.user.id,
  };
  let importedCount = 0;
  let skippedCount = preview.rows.length - readyRows.length;
  const workingOpportunitySnapshot = [...workspaceSnapshot.opportunities];

  for (const row of readyRows) {
    const currentPreview = buildCsvImportPreview({
      draft: {
        ...draftResult.draft,
        rows: [
          {
            rawValues: mapPreviewRowBackToRawValues({
              headers: draftResult.draft.headers,
              mapping,
              row,
            }),
            rowNumber: row.rowNumber,
          },
        ],
      },
      mapping,
      workspace: {
        ...workspaceSnapshot,
        opportunities: workingOpportunitySnapshot,
      },
    });

    if (
      currentPreview.hasBlockingErrors ||
      currentPreview.summary.readyRows !== 1 ||
      currentPreview.rows[0]?.status !== "ready"
    ) {
      skippedCount += 1;
      continue;
    }

    const importedOpportunity = await createOpportunity({
      db: prisma as unknown as OpportunityWriteClient,
      input: {
        actor,
        currentStageKey: "identified",
        description: row.mappedValues.description,
        leadAgencyId: row.mappedValues.leadAgencyId,
        naicsCode: row.mappedValues.naicsCode,
        originSourceSystem: CSV_IMPORT_SOURCE_SYSTEM,
        responseDeadlineAt: row.mappedValues.responseDeadlineAt
          ? new Date(`${row.mappedValues.responseDeadlineAt}T12:00:00.000Z`)
          : null,
        solicitationNumber: row.mappedValues.solicitationNumber,
        title: row.mappedValues.title ?? "Untitled CSV import",
      },
    });

    workingOpportunitySnapshot.push({
      currentStageLabel: importedOpportunity.currentStageLabel,
      externalNoticeId: null,
      id: importedOpportunity.id,
      leadAgencyName:
        workspaceSnapshot.agencies.find(
          (agency) => agency.id === row.mappedValues.leadAgencyId,
        )?.name ?? null,
      leadAgencyOrganizationCode:
        workspaceSnapshot.agencies.find(
          (agency) => agency.id === row.mappedValues.leadAgencyId,
        )?.organizationCode ?? null,
      naicsCode: importedOpportunity.naicsCode,
      responseDeadlineAt: importedOpportunity.responseDeadlineAt?.toISOString() ?? null,
      solicitationNumber: importedOpportunity.solicitationNumber,
      title: importedOpportunity.title,
    });
    importedCount += 1;
  }

  redirect(
    buildReturnPath(returnPath, {
      csvImportStatus: "imported",
      csvImportedCount: String(importedCount),
      csvSkippedCount: String(skippedCount),
    }),
  );
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

function mapPreviewRowBackToRawValues({
  headers,
  mapping,
  row,
}: {
  headers: string[];
  mapping: Record<string, string | null>;
  row: Awaited<
    ReturnType<typeof buildCsvImportPreview>
  >["rows"][number];
}) {
  const rawValues = Object.fromEntries(headers.map((header) => [header, ""]));

  for (const [fieldKey, header] of Object.entries(mapping)) {
    if (!header) {
      continue;
    }

    switch (fieldKey) {
      case "title":
        rawValues[header] = row.mappedValues.title ?? "";
        break;
      case "description":
        rawValues[header] = row.mappedValues.description ?? "";
        break;
      case "agency":
        rawValues[header] =
          row.mappedValues.csvAgencyValue ?? row.mappedValues.agencyLabel ?? "";
        break;
      case "responseDeadlineAt":
        rawValues[header] = row.mappedValues.responseDeadlineAt ?? "";
        break;
      case "solicitationNumber":
        rawValues[header] = row.mappedValues.solicitationNumber ?? "";
        break;
      case "naicsCode":
        rawValues[header] = row.mappedValues.naicsCode ?? "";
        break;
      default:
        break;
    }
  }

  return rawValues;
}
