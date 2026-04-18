import { OpportunityList } from "@/components/opportunities/opportunity-list";
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
  const snapshot = await getOpportunityListSnapshot({
    db: prisma as unknown as OpportunityRepositoryClient,
    query,
  });

  return <OpportunityList snapshot={snapshot} />;
}
