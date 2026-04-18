import { PersonalTaskBoard } from "@/components/tasks/personal-task-board";
import { requireAppPermission } from "@/lib/auth/authorization";
import { prisma } from "@/lib/prisma";
import {
  getPersonalTaskBoardSnapshot,
  type PersonalTaskBoardRepositoryClient,
} from "@/modules/opportunities/opportunity.repository";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const { session } = await requireAppPermission("view_dashboard");
  const snapshot = await getPersonalTaskBoardSnapshot({
    db: prisma as unknown as PersonalTaskBoardRepositoryClient,
    userId: session.user.id,
  });

  return <PersonalTaskBoard snapshot={snapshot} />;
}
