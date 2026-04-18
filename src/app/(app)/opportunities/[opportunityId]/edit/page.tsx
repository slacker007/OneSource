import { OpportunityForm } from "@/components/opportunities/opportunity-form";
import { ErrorState } from "@/components/ui/error-state";
import { requireAppPermission } from "@/lib/auth/authorization";
import { prisma } from "@/lib/prisma";
import {
  getEditOpportunityFormSnapshot,
  type OpportunityFormRepositoryClient,
} from "@/modules/opportunities/opportunity-form.repository";

import { updateOpportunityAction } from "../../actions";

export const dynamic = "force-dynamic";

type EditOpportunityPageProps = {
  params: Promise<{
    opportunityId: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditOpportunityPage({
  params,
  searchParams,
}: EditOpportunityPageProps) {
  const { session } = await requireAppPermission("manage_pipeline");
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const snapshot = await getEditOpportunityFormSnapshot({
    db: prisma as unknown as OpportunityFormRepositoryClient,
    opportunityId: resolvedParams.opportunityId,
    organizationId: session.user.organizationId,
  });

  if (!snapshot) {
    return (
      <section className="space-y-4">
        <p className="text-muted text-sm tracking-[0.26em] uppercase">
          Opportunities
        </p>
        <h1 className="font-heading text-foreground text-4xl font-semibold tracking-[-0.04em]">
          Edit tracked opportunity
        </h1>
        <ErrorState
          message="The requested opportunity could not be loaded for the current workspace. It may have been deleted, moved to another organization, or the local seed data may be stale."
          title="Opportunity record is unavailable"
        />
      </section>
    );
  }

  const created = getFirstSearchParamValue(resolvedSearchParams?.created);
  const updated = getFirstSearchParamValue(resolvedSearchParams?.updated);
  const feedback =
    created === "1"
      ? {
          tone: "success" as const,
          title: "Opportunity created",
          message:
            "The new tracked opportunity is now persisted and ready for follow-on workspace work.",
        }
      : updated === "1"
        ? {
            tone: "success" as const,
            title: "Opportunity updated",
            message:
              "Changes were saved through the guarded application flow and are now visible to the workspace.",
          }
        : null;

  return (
    <OpportunityForm
      action={updateOpportunityAction}
      feedback={feedback}
      snapshot={snapshot}
    />
  );
}

function getFirstSearchParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}
