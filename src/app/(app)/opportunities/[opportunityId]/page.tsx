import { OpportunityWorkspace } from "@/components/opportunities/opportunity-workspace";
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
  deleteOpportunityMilestoneAction,
  deleteOpportunityTaskAction,
  recordOpportunityBidDecisionAction,
  recordOpportunityCloseoutAction,
  transitionOpportunityStageAction,
  updateOpportunityMilestoneAction,
  updateOpportunityTaskAction,
} from "../actions";

export const dynamic = "force-dynamic";

type OpportunityWorkspacePageProps = {
  params: Promise<{
    opportunityId: string;
  }>;
};

export default async function OpportunityWorkspacePage({
  params,
}: OpportunityWorkspacePageProps) {
  const { session } = await requireAppPermission("view_dashboard");
  const resolvedParams = await params;
  const snapshot = await getOpportunityWorkspaceSnapshot({
    db: prisma as unknown as OpportunityWorkspaceRepositoryClient,
    opportunityId: resolvedParams.opportunityId,
  });

  return (
    <OpportunityWorkspace
      allowManagePipeline={hasAppPermission(
        session.user.roleKeys,
        "manage_pipeline",
      )}
      createDocumentAction={createOpportunityDocumentAction}
      createMilestoneAction={createOpportunityMilestoneAction}
      createNoteAction={createOpportunityNoteAction}
      createTaskAction={createOpportunityTaskAction}
      deleteMilestoneAction={deleteOpportunityMilestoneAction}
      deleteTaskAction={deleteOpportunityTaskAction}
      recordBidDecisionAction={recordOpportunityBidDecisionAction}
      recordCloseoutAction={recordOpportunityCloseoutAction}
      stageTransitionAction={transitionOpportunityStageAction}
      snapshot={snapshot}
      updateMilestoneAction={updateOpportunityMilestoneAction}
      updateTaskAction={updateOpportunityTaskAction}
    />
  );
}
