import { DashboardLanding } from "@/components/home/dashboard-landing";
import { requireAuthenticatedAppSession } from "@/lib/auth/authorization";
import { prisma } from "@/lib/prisma";
import { getHomeDashboardSnapshot } from "@/modules/opportunities/opportunity.repository";
import type { OpportunityRepositoryClient } from "@/modules/opportunities/opportunity.repository";

export const dynamic = "force-dynamic";

export default async function AuthenticatedHomePage() {
  await requireAuthenticatedAppSession();
  const snapshot = await getHomeDashboardSnapshot({
    db: prisma as unknown as OpportunityRepositoryClient,
  });

  return <DashboardLanding snapshot={snapshot} />;
}
