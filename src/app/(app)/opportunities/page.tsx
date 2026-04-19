import {
  OpportunityList,
  type OpportunityListViewState,
} from "@/components/opportunities/opportunity-list";
import { prisma } from "@/lib/prisma";
import {
  getOpportunityListSnapshot,
  parseOpportunityListSearchParams,
  type OpportunityRepositoryClient,
} from "@/modules/opportunities/opportunity.repository";

export const dynamic = "force-dynamic";

type OpportunitiesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OpportunitiesPage({
  searchParams,
}: OpportunitiesPageProps) {
  const resolvedSearchParams = await searchParams;
  const query = parseOpportunityListSearchParams(resolvedSearchParams);
  const viewState = parseOpportunityListViewState(resolvedSearchParams);
  const snapshot = await getOpportunityListSnapshot({
    db: prisma as unknown as OpportunityRepositoryClient,
    query,
  });

  return <OpportunityList snapshot={snapshot} viewState={viewState} />;
}

function parseOpportunityListViewState(
  searchParams: Record<string, string | string[] | undefined> | undefined,
): OpportunityListViewState {
  const density = getFirstSearchParamValue(searchParams?.density);
  const previewOpportunityId = getFirstSearchParamValue(searchParams?.preview);

  return {
    density: density === "compact" ? "compact" : "comfortable",
    previewOpportunityId,
  };
}

function getFirstSearchParamValue(
  value: string | string[] | undefined,
): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return null;
}
