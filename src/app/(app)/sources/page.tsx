import { applySourceImportAction } from "./actions";

import { SourceSearch } from "@/components/sources/source-search";
import { prisma } from "@/lib/prisma";
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
  const resolvedSearchParams = await searchParams;
  const snapshot = await getSourceSearchSnapshot({
    db: prisma as unknown as SourceSearchRepositoryClient,
    searchParams: resolvedSearchParams,
  });
  const previewId = getFirstSearchParamValue(resolvedSearchParams?.preview);
  const previewSnapshot = previewId
    ? await getSourceImportPreviewSnapshot({
        db: prisma as unknown as SourceImportRepositoryClient,
        resultId: previewId,
      })
    : null;
  const returnPath = buildReturnPath(resolvedSearchParams);

  return (
    <SourceSearch
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
