import { OpportunityForm } from "@/components/opportunities/opportunity-form";
import { ErrorState } from "@/components/ui/error-state";
import { requireAppPermission } from "@/lib/auth/authorization";
import { prisma } from "@/lib/prisma";
import {
  getCreateOpportunityFormSnapshot,
  type OpportunityFormRepositoryClient,
} from "@/modules/opportunities/opportunity-form.repository";

import { createOpportunityAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewOpportunityPage() {
  const { session } = await requireAppPermission("manage_pipeline");
  const snapshot = await getCreateOpportunityFormSnapshot({
    db: prisma as unknown as OpportunityFormRepositoryClient,
    organizationId: session.user.organizationId,
  });

  if (!snapshot) {
    return (
      <section className="space-y-4">
        <p className="text-muted text-sm tracking-[0.26em] uppercase">
          Opportunities
        </p>
        <h1 className="font-heading text-foreground text-4xl font-semibold tracking-[-0.04em]">
          Create a tracked opportunity
        </h1>
        <ErrorState
          message="The opportunity form could not load organization-scoped reference data. Re-seed the database or verify the authenticated user still belongs to an active workspace."
          title="Opportunity form data is unavailable"
        />
      </section>
    );
  }

  return (
    <OpportunityForm
      action={createOpportunityAction}
      feedback={null}
      snapshot={snapshot}
    />
  );
}
