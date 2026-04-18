import { SourceSearch } from "@/components/sources/source-search";
import { prisma } from "@/lib/prisma";
import {
  getSourceSearchSnapshot,
  type SourceSearchRepositoryClient,
} from "@/modules/source-integrations/source-search.service";

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

  return <SourceSearch snapshot={snapshot} />;
}
