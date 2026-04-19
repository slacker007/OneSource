import { PersonalTaskBoard } from "@/components/tasks/personal-task-board";
import { requireAppPermission } from "@/lib/auth/authorization";
import { prisma } from "@/lib/prisma";
import {
  getTaskBoardSnapshot,
  type TaskBoardRepositoryClient,
} from "@/modules/opportunities/opportunity.repository";
import type { TaskBoardViewKey } from "@/modules/opportunities/opportunity.types";

export const dynamic = "force-dynamic";

type TasksPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const { session } = await requireAppPermission("view_dashboard");
  const resolvedSearchParams = await searchParams;
  const snapshot = await getTaskBoardSnapshot({
    db: prisma as unknown as TaskBoardRepositoryClient,
    userDisplayName: session.user.name ?? session.user.email ?? "Assigned user",
    userId: session.user.id,
  });

  return (
    <PersonalTaskBoard
      snapshot={snapshot}
      viewState={parseTaskBoardViewState(resolvedSearchParams)}
    />
  );
}

function parseTaskBoardViewState(
  searchParams: Record<string, string | string[] | undefined> | undefined,
) {
  const rawView = getFirstSearchParamValue(searchParams?.view);
  const view: TaskBoardViewKey =
    rawView === "team_tasks" ||
    rawView === "calendar" ||
    rawView === "kanban"
      ? rawView
      : "my_tasks";

  return {
    focusTaskId: getFirstSearchParamValue(searchParams?.focus),
    view,
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
