import {
  OpportunityWorkspace,
  readOpportunityWorkspaceSection,
} from "@/components/opportunities/opportunity-workspace";
import { requireAppPermission } from "@/lib/auth/authorization";
import { hasAppPermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import {
  getOpportunityWorkspaceSnapshot,
  type OpportunityWorkspaceRepositoryClient,
} from "@/modules/opportunities/opportunity.repository";
import {
  createOpportunityDocumentAction,
  createOpportunityMilestoneAction,
  createOpportunityNoteAction,
  createOpportunityTaskAction,
  deleteOpportunityProposalAction,
  deleteOpportunityMilestoneAction,
  deleteOpportunityTaskAction,
  recordOpportunityBidDecisionAction,
  recordOpportunityCloseoutAction,
  saveOpportunityProposalAction,
  transitionOpportunityStageAction,
  updateOpportunityMilestoneAction,
  updateOpportunityTaskAction,
} from "../actions";

export const dynamic = "force-dynamic";

type OpportunityWorkspacePageProps = {
  params: Promise<{
    opportunityId: string;
  }>;
  searchParams?: Promise<{
    section?: string | string[];
  }>;
};

export default async function OpportunityWorkspacePage({
  params,
  searchParams,
}: OpportunityWorkspacePageProps) {
  const { session } = await requireAppPermission("view_dashboard");
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const snapshot = await getOpportunityWorkspaceSnapshot({
    db: prisma as unknown as OpportunityWorkspaceRepositoryClient,
    opportunityId: resolvedParams.opportunityId,
  });

  return (
    <OpportunityWorkspace
      activeSection={readOpportunityWorkspaceSection(
        resolvedSearchParams?.section,
      )}
      allowManagePipeline={hasAppPermission(
        session.user.roleKeys,
        "manage_pipeline",
      )}
      createDocumentAction={createOpportunityDocumentAction}
      createMilestoneAction={createOpportunityMilestoneAction}
      createNoteAction={createOpportunityNoteAction}
      createTaskAction={createOpportunityTaskAction}
      deleteProposalAction={deleteOpportunityProposalAction}
      deleteMilestoneAction={deleteOpportunityMilestoneAction}
      deleteTaskAction={deleteOpportunityTaskAction}
      recordBidDecisionAction={recordOpportunityBidDecisionAction}
      recordCloseoutAction={recordOpportunityCloseoutAction}
      saveProposalAction={saveOpportunityProposalAction}
      stageTransitionAction={transitionOpportunityStageAction}
      snapshot={snapshot}
      updateMilestoneAction={updateOpportunityMilestoneAction}
      updateTaskAction={updateOpportunityTaskAction}
    />
  );
}
