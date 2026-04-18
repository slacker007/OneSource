import { DecisionConsole } from "@/components/analytics/decision-console";
import { requireAppPermission } from "@/lib/auth/authorization";
import { prisma } from "@/lib/prisma";
import {
  getDecisionConsoleSnapshot,
  parseDecisionConsoleSearchParams,
  type OpportunityRepositoryClient,
} from "@/modules/opportunities/opportunity.repository";

export const dynamic = "force-dynamic";

type AnalyticsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AnalyticsPage({
  searchParams,
}: AnalyticsPageProps) {
  await requireAppPermission("view_decision_support");

  const resolvedSearchParams = await searchParams;
  const query = parseDecisionConsoleSearchParams(resolvedSearchParams);
  const snapshot = await getDecisionConsoleSnapshot({
    db: prisma as unknown as OpportunityRepositoryClient,
    query,
  });

  return <DecisionConsole snapshot={snapshot} />;
}
