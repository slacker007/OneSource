import { AccessOverview } from "@/components/auth/access-overview";
import { DashboardLanding } from "@/components/home/dashboard-landing";
import { requireAuthenticatedAppSession } from "@/lib/auth/authorization";
import { prisma } from "@/lib/prisma";
import { getHomeDashboardSnapshot } from "@/modules/opportunities/opportunity.repository";
import type { OpportunityRepositoryClient } from "@/modules/opportunities/opportunity.repository";

export const dynamic = "force-dynamic";

export default async function AuthenticatedHomePage() {
  const session = await requireAuthenticatedAppSession();
  const snapshot = await getHomeDashboardSnapshot({
    db: prisma as unknown as OpportunityRepositoryClient,
  });
  const roleKeys = session.user.roleKeys;
  const roleSummary =
    roleKeys.length > 0 ? roleKeys.join(", ") : "No roles assigned";

  return (
    <div className="space-y-6">
      <section className="border-border bg-surface rounded-[28px] border px-5 py-5 shadow-[0_16px_40px_rgba(20,37,34,0.08)] sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-muted text-xs tracking-[0.24em] uppercase">
              Dashboard
            </p>
            <h1 className="font-heading text-foreground text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Capture dashboard with live seeded pipeline queries.
            </h1>
            <p className="text-muted max-w-3xl text-sm leading-7 sm:text-base">
              The landing page now reads the persisted opportunity graph
              directly through the typed repository layer so stage distribution,
              deadline pressure, and ranked pursuits are visible on first load.
            </p>
          </div>

          <div className="border-border rounded-[24px] border bg-white px-4 py-4 text-sm shadow-[0_12px_30px_rgba(20,37,34,0.06)]">
            <p className="text-muted text-xs tracking-[0.2em] uppercase">
              Signed in as
            </p>
            <p className="text-foreground mt-2 font-semibold">
              {session.user.name ?? session.user.email}
            </p>
            <p className="text-muted mt-1">
              {session.user.email} · {roleSummary}
            </p>
          </div>
        </div>
      </section>

      <DashboardLanding snapshot={snapshot} />

      <AccessOverview roleKeys={roleKeys} />
    </div>
  );
}
