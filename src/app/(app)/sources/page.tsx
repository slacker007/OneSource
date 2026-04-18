import {
  applySourceImportAction,
  importCsvOpportunitiesAction,
} from "./actions";

import { SourceSearch } from "@/components/sources/source-search";
import { requireAuthenticatedAppSession } from "@/lib/auth/authorization";
import { prisma } from "@/lib/prisma";
import {
  getCsvImportWorkspaceSnapshot,
  type CsvImportWorkspaceRepositoryClient,
} from "@/modules/source-integrations/csv-import.service";
import {
  getSourceSearchSnapshot,
  type SourceSearchRepositoryClient,
} from "@/modules/source-integrations/source-search.service";
import {
  getSourceImportPreviewSnapshot,
  type SourceImportRepositoryClient,
} from "@/modules/source-integrations/source-import.service";

export const dynamic = "force-dynamic";

type SourcesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SourcesPage({ searchParams }: SourcesPageProps) {
  const session = await requireAuthenticatedAppSession();
  const resolvedSearchParams = await searchParams;
  const [snapshot, csvImportSnapshot] = await Promise.all([
    getSourceSearchSnapshot({
      actor: {
        email: session.user.email ?? null,
        organizationId: session.user.organizationId,
        userId: session.user.id ?? null,
      },
      db: prisma as unknown as SourceSearchRepositoryClient,
      searchParams: resolvedSearchParams,
    }),
    getCsvImportWorkspaceSnapshot({
      db: prisma as unknown as CsvImportWorkspaceRepositoryClient,
      organizationId: session.user.organizationId,
    }),
  ]);
  const previewId = getFirstSearchParamValue(resolvedSearchParams?.preview);
  const previewSnapshot = previewId
    ? await getSourceImportPreviewSnapshot({
        db: prisma as unknown as SourceImportRepositoryClient,
        sourceRecordId: previewId,
      })
    : null;
  const returnPath = buildReturnPath(resolvedSearchParams);

  return (
    <SourceSearch
      csvImportAction={importCsvOpportunitiesAction}
      csvImportFeedback={{
        error: getFirstSearchParamValue(resolvedSearchParams?.csvImportError),
        importedCount: readNumericSearchParam(
          getFirstSearchParamValue(resolvedSearchParams?.csvImportedCount),
        ),
        skippedCount: readNumericSearchParam(
          getFirstSearchParamValue(resolvedSearchParams?.csvSkippedCount),
        ),
        status: getFirstSearchParamValue(resolvedSearchParams?.csvImportStatus),
      }}
      csvImportSnapshot={csvImportSnapshot}
      importAction={applySourceImportAction}
      importFeedback={{
        error: getFirstSearchParamValue(resolvedSearchParams?.importError),
        opportunityId: getFirstSearchParamValue(resolvedSearchParams?.opportunityId),
        status: getFirstSearchParamValue(resolvedSearchParams?.importStatus),
      }}
      previewSnapshot={previewSnapshot}
      returnPath={returnPath}
      snapshot={snapshot}
    />
  );
}

function buildReturnPath(searchParams: Record<string, string | string[] | undefined> | undefined) {
  const params = new URLSearchParams();

  for (const [key, rawValue] of Object.entries(searchParams ?? {})) {
    if (rawValue === undefined) {
      continue;
    }

    const values = Array.isArray(rawValue) ? rawValue : [rawValue];

    for (const value of values) {
      params.append(key, value);
    }
  }

  const queryString = params.toString();
  return queryString ? `/sources?${queryString}` : "/sources";
}

function getFirstSearchParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value ?? null;
}

function readNumericSearchParam(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}
