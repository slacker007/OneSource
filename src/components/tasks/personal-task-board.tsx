import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import type { PersonalTaskBoardSnapshot } from "@/modules/opportunities/opportunity.types";

type PersonalTaskBoardProps = {
  snapshot: PersonalTaskBoardSnapshot | null;
};

export function PersonalTaskBoard({ snapshot }: PersonalTaskBoardProps) {
  if (!snapshot) {
    return (
      <section className="space-y-4">
        <p className="text-muted text-sm tracking-[0.26em] uppercase">Tasks</p>
        <h1 className="font-heading text-foreground text-4xl font-semibold tracking-[-0.04em]">
          Execution queue
        </h1>
        <ErrorState
          message="The assigned-task view could not be loaded for the current workspace."
          title="Task board is unavailable"
        />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="rounded-[28px] border border-border bg-white px-6 py-6 shadow-[0_16px_40px_rgba(20,37,34,0.08)] sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge>Tasks</Badge>
              <Badge tone="muted">{snapshot.userDisplayName}</Badge>
            </div>
            <h1 className="font-heading text-foreground text-4xl font-semibold tracking-[-0.04em]">
              Personal execution queue
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-muted">
              Assigned tasks surface here across opportunities so contributors can
              work from one personal view and jump back into the linked workspace.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <SummaryCard
            label="Assigned tasks"
            value={String(snapshot.assignedTaskCount)}
          />
          <SummaryCard
            label="Overdue"
            value={String(snapshot.overdueTaskCount)}
          />
          <SummaryCard
            label="Completed"
            value={String(snapshot.completedTaskCount)}
          />
        </div>
      </header>

      {snapshot.tasks.length > 0 ? (
        <div className="space-y-4">
          {snapshot.tasks.map((task) => (
            <article
              className="rounded-[24px] border border-border bg-white px-5 py-5 shadow-[0_16px_40px_rgba(20,37,34,0.08)]"
              key={task.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={priorityTone(task.priority)}>
                      {humanizeEnum(task.priority)}
                    </Badge>
                    <Badge tone="muted">{humanizeEnum(task.status)}</Badge>
                    <Badge tone="warning">{task.opportunityStageLabel}</Badge>
                    {task.deadlineReminderState !== "NONE" ? (
                      <Badge tone={deadlineReminderTone(task.deadlineReminderState)}>
                        {deadlineReminderLabel(task.deadlineReminderState)}
                      </Badge>
                    ) : null}
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">{task.title}</h2>
                  <p className="text-sm text-muted">
                    {task.opportunityTitle}
                    {task.assigneeName ? ` · Assigned to ${task.assigneeName}` : ""}
                  </p>
                </div>
                <p className="text-sm text-muted">
                  {task.dueAt ? `Due ${formatDate(task.dueAt)}` : "No due date"}
                </p>
              </div>

              {task.description ? (
                <p className="mt-3 text-sm leading-6 text-muted">{task.description}</p>
              ) : null}

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted">
                  {task.completedAt
                    ? `Completed ${formatDate(task.completedAt)}`
                    : task.startedAt
                      ? `Started ${formatDate(task.startedAt)}`
                      : "Not started yet"}
                </p>
                <Link
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-[rgb(19,78,68)] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_30px_rgba(19,78,68,0.22)] transition hover:bg-[rgb(16,66,57)]"
                  href={`/opportunities/${task.opportunityId}`}
                >
                  Open workspace
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          message="Assigned tasks will appear here once work is delegated from opportunity workspaces."
          title="No assigned tasks"
        />
      )}
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[rgba(15,28,31,0.08)] bg-[rgba(255,249,239,0.72)] px-5 py-5">
      <p className="text-xs tracking-[0.24em] text-muted uppercase">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function humanizeEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function priorityTone(priority: PersonalTaskBoardSnapshot["tasks"][number]["priority"]) {
  switch (priority) {
    case "CRITICAL":
      return "warning" as const;
    case "HIGH":
      return "accent" as const;
    default:
      return "muted" as const;
  }
}

function deadlineReminderTone(
  state: PersonalTaskBoardSnapshot["tasks"][number]["deadlineReminderState"],
) {
  return state === "OVERDUE" ? ("warning" as const) : ("accent" as const);
}

function deadlineReminderLabel(
  state: PersonalTaskBoardSnapshot["tasks"][number]["deadlineReminderState"],
) {
  return state === "OVERDUE" ? "Overdue" : "Upcoming deadline";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
