import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ActiveFilterChipBar } from "@/components/ui/active-filter-chip-bar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PAGE_HEADER_SURFACE_SX } from "@/components/ui/page-header";
import { PreviewPanel } from "@/components/ui/preview-panel";
import { SavedViewControls } from "@/components/ui/saved-view-controls";
import { Surface } from "@/components/ui/surface";
import { onesourceTokens } from "@/theme/onesource-theme";
import type {
  TaskBoardItem,
  TaskBoardSnapshot,
  TaskBoardViewKey,
} from "@/modules/opportunities/opportunity.types";

type PersonalTaskBoardProps = {
  snapshot: TaskBoardSnapshot | null;
  viewState: {
    focusTaskId: string | null;
    view: TaskBoardViewKey;
  };
};

export function PersonalTaskBoard({
  snapshot,
  viewState,
}: PersonalTaskBoardProps) {
  if (!snapshot) {
    return (
      <section className="space-y-4">
        <p className="text-muted text-sm tracking-[0.26em] uppercase">Tasks</p>
        <h1 className="font-heading text-foreground text-4xl font-semibold tracking-[-0.04em]">
          Execution triage
        </h1>
        <ErrorState
          message="The task workspace could not be loaded for the current organization."
          title="Task workspace is unavailable"
        />
      </section>
    );
  }

  const activeViewTasks = getTasksForView({
    snapshot,
    view: viewState.view,
  });
  const focusedTask =
    activeViewTasks.find((task) => task.id === viewState.focusTaskId) ??
    activeViewTasks[0] ??
    snapshot.allTasks[0] ??
    null;

  const viewItems = [
    {
      active: viewState.view === "my_tasks",
      href: buildTaskHref({
        view: "my_tasks",
      }),
      label: "My Tasks",
      supportingText: `${snapshot.summary.assignedTaskCount} assigned`,
    },
    {
      active: viewState.view === "team_tasks",
      href: buildTaskHref({
        view: "team_tasks",
      }),
      label: "Team Tasks",
      supportingText: `${snapshot.summary.openTaskCount} open`,
    },
    {
      active: viewState.view === "calendar",
      href: buildTaskHref({
        view: "calendar",
      }),
      label: "Calendar",
      supportingText: `${snapshot.calendar.buckets.length} buckets`,
    },
    {
      active: viewState.view === "kanban",
      href: buildTaskHref({
        view: "kanban",
      }),
      label: "Kanban",
      supportingText: `${snapshot.kanban.columns.filter((column) => column.taskCount > 0).length} live columns`,
    },
  ];

  const signalChips = [
    {
      label: `${snapshot.summary.overdueTaskCount} overdue`,
    },
    {
      label: `${snapshot.summary.upcomingTaskCount} upcoming`,
    },
    {
      label: `${snapshot.summary.blockedTaskCount} blocked`,
    },
    {
      label: `${snapshot.summary.unassignedTaskCount} unassigned`,
    },
  ];

  return (
    <section className="space-y-6">
      <Surface component="header" sx={PAGE_HEADER_SURFACE_SX}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge>Tasks</Badge>
              <Badge tone="muted">{snapshot.organization.name}</Badge>
              <Badge tone="info">{snapshot.userDisplayName}</Badge>
            </div>
            <div className="space-y-2">
              <h1 className="font-heading text-foreground text-4xl font-semibold tracking-[-0.04em]">
                Execution triage
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-muted">
                Move between personal priorities, team ownership, due-date
                sequencing, and status lanes without losing reminder state or
                the linked opportunity context.
              </p>
            </div>
          </div>

          <Button href="/opportunities" tone="neutral" variant="outlined">
            Open pipeline
          </Button>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
          <SavedViewControls items={viewItems} label="Views" />
          <ActiveFilterChipBar
            chips={signalChips}
            className="xl:justify-end"
            emptyLabel="No active deadline signals"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="My queue"
            supportingText="Assigned work requiring personal follow-through."
            value={String(snapshot.summary.assignedTaskCount)}
          />
          <SummaryCard
            label="Open portfolio work"
            supportingText={`${snapshot.summary.linkedOpportunityCount} linked pursuits`}
            value={String(snapshot.summary.openTaskCount)}
          />
          <SummaryCard
            label="Overdue or blocked"
            supportingText="Priority work already outside the planned path."
            value={String(
              snapshot.summary.overdueTaskCount +
                snapshot.summary.blockedTaskCount,
            )}
          />
          <SummaryCard
            label="Unassigned"
            supportingText="Tasks that still need ownership before execution."
            value={String(snapshot.summary.unassignedTaskCount)}
          />
        </div>
      </Surface>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_380px] xl:items-start">
        <div className="space-y-4">
          {viewState.view === "my_tasks" ? (
            <MyTasksView
              focusedTaskId={focusedTask?.id ?? null}
              snapshot={snapshot}
            />
          ) : null}
          {viewState.view === "team_tasks" ? (
            <TeamTasksView
              focusedTaskId={focusedTask?.id ?? null}
              snapshot={snapshot}
            />
          ) : null}
          {viewState.view === "calendar" ? (
            <CalendarTasksView
              focusedTaskId={focusedTask?.id ?? null}
              snapshot={snapshot}
            />
          ) : null}
          {viewState.view === "kanban" ? (
            <KanbanTasksView
              focusedTaskId={focusedTask?.id ?? null}
              snapshot={snapshot}
            />
          ) : null}
        </div>

        <PreviewPanel
          actions={
            focusedTask ? (
              <Button
                href={`/opportunities/${focusedTask.opportunityId}?section=tasks`}
              >
                Open task in workspace
              </Button>
            ) : undefined
          }
          className="xl:sticky xl:top-24"
          description={
            focusedTask?.description ??
            "Choose a task from the active view to inspect ownership, due-date pressure, and the linked pursuit."
          }
          eyebrow="Task preview"
          label="Task preview"
          metadata={
            focusedTask
              ? [
                  {
                    label: "Opportunity",
                    value: focusedTask.opportunityTitle,
                  },
                  {
                    label: "Stage",
                    value: focusedTask.opportunityStageLabel,
                  },
                  {
                    label: "Owner",
                    value: focusedTask.assigneeName ?? "Unassigned",
                  },
                  {
                    label: "Due",
                    value: focusedTask.dueAt
                      ? formatDate(focusedTask.dueAt)
                      : "No due date",
                  },
                  {
                    label: "Reminder",
                    value: deadlineReminderLabel(
                      focusedTask.deadlineReminderState,
                    ),
                  },
                  {
                    label: "Created by",
                    value: focusedTask.createdByName ?? "Unknown",
                  },
                ]
              : []
          }
          title={focusedTask?.title ?? "Select a task"}
        >
          {focusedTask ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge tone={priorityTone(focusedTask.priority)}>
                  {humanizeEnum(focusedTask.priority)}
                </Badge>
                <Badge tone={statusTone(focusedTask.status)}>
                  {humanizeEnum(focusedTask.status)}
                </Badge>
                {focusedTask.deadlineReminderState !== "NONE" ? (
                  <Badge
                    tone={deadlineReminderTone(
                      focusedTask.deadlineReminderState,
                    )}
                  >
                    {deadlineReminderLabel(focusedTask.deadlineReminderState)}
                  </Badge>
                ) : null}
              </div>

              <dl className="space-y-3 text-sm leading-6 text-muted">
                <div>
                  <dt className="text-[0.68rem] font-semibold tracking-[0.18em] uppercase">
                    Started
                  </dt>
                  <dd>
                    {focusedTask.startedAt
                      ? formatDate(focusedTask.startedAt)
                      : "Not started yet"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.68rem] font-semibold tracking-[0.18em] uppercase">
                    Completed
                  </dt>
                  <dd>
                    {focusedTask.completedAt
                      ? formatDate(focusedTask.completedAt)
                      : "Still active"}
                  </dd>
                </div>
              </dl>
            </div>
          ) : (
            <EmptyState
              className="border-none bg-transparent px-0 py-0 shadow-none"
              eyebrow="No task selected"
              message="Pick a task from any queue to review its context and jump into the workspace."
              title="Task detail stays here"
            />
          )}
        </PreviewPanel>
      </div>
    </section>
  );
}

function MyTasksView({
  focusedTaskId,
  snapshot,
}: {
  focusedTaskId: string | null;
  snapshot: TaskBoardSnapshot;
}) {
  if (snapshot.myTasks.tasks.length === 0) {
    return (
      <EmptyState
        message="Assigned work will appear here once opportunity owners delegate execution tasks."
        title="No personal tasks"
      />
    );
  }

  const sections = snapshot.myTasks.sections.filter(
    (section) => section.taskCount > 0,
  );

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <Surface
          component="section"
          key={section.key}
          sx={{ px: 2.5, py: 2.5 }}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap gap-2">
                <Badge tone="muted">{section.label}</Badge>
                <Badge
                  tone={section.key === "needs_attention" ? "warning" : "info"}
                >
                  {section.taskCount} tasks
                </Badge>
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                {section.label}
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-muted">
                {section.description}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {section.tasks.map((task) => (
              <TaskListItem
                active={focusedTaskId === task.id}
                key={task.id}
                task={task}
                view="my_tasks"
              />
            ))}
          </div>
        </Surface>
      ))}
    </div>
  );
}

function TeamTasksView({
  focusedTaskId,
  snapshot,
}: {
  focusedTaskId: string | null;
  snapshot: TaskBoardSnapshot;
}) {
  if (snapshot.teamTasks.lanes.length === 0) {
    return (
      <EmptyState
        message="Open team work will appear here once tasks are created on live pursuits."
        title="No team tasks"
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {snapshot.teamTasks.lanes.map((lane) => (
        <Surface component="section" key={lane.key} sx={{ px: 2.5, py: 2.5 }}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground">
                {lane.label}
              </h2>
              <p className="text-sm leading-6 text-muted">
                {lane.supportingText}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="info">{lane.taskCount} open</Badge>
              {lane.overdueTaskCount > 0 ? (
                <Badge tone="warning">{lane.overdueTaskCount} overdue</Badge>
              ) : null}
            </div>
          </div>
          <div className="space-y-3">
            {lane.tasks.map((task) => (
              <TaskListItem
                active={focusedTaskId === task.id}
                key={task.id}
                task={task}
                view="team_tasks"
              />
            ))}
          </div>
        </Surface>
      ))}
    </div>
  );
}

function CalendarTasksView({
  focusedTaskId,
  snapshot,
}: {
  focusedTaskId: string | null;
  snapshot: TaskBoardSnapshot;
}) {
  if (snapshot.calendar.buckets.length === 0) {
    return (
      <EmptyState
        message="Due-date sequencing will appear here once the portfolio has task records."
        title="No calendar tasks"
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {snapshot.calendar.buckets.map((bucket) => (
        <Surface component="section" key={bucket.key} sx={{ px: 2.5, py: 2.5 }}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap gap-2">
                <Badge tone="muted">{bucket.label}</Badge>
                {bucket.overdueTaskCount > 0 ? (
                  <Badge tone="warning">
                    {bucket.overdueTaskCount} overdue
                  </Badge>
                ) : null}
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                {bucket.label}
              </h2>
              <p className="text-sm leading-6 text-muted">
                {bucket.supportingText}
              </p>
            </div>
            <Badge tone="info">{bucket.taskCount} tasks</Badge>
          </div>
          <div className="space-y-3">
            {bucket.tasks.map((task) => (
              <TaskListItem
                active={focusedTaskId === task.id}
                key={task.id}
                task={task}
                view="calendar"
              />
            ))}
          </div>
        </Surface>
      ))}
    </div>
  );
}

function KanbanTasksView({
  focusedTaskId,
  snapshot,
}: {
  focusedTaskId: string | null;
  snapshot: TaskBoardSnapshot;
}) {
  if (snapshot.allTasks.length === 0) {
    return (
      <EmptyState
        message="Status lanes will populate after the first execution tasks are created."
        title="No task lanes"
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[960px] gap-4 xl:min-w-0 xl:grid-cols-5">
        {snapshot.kanban.columns.map((column) => (
          <Surface component="section" key={column.key} sx={{ px: 2, py: 2 }}>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Badge tone={statusTone(column.key)}>{column.label}</Badge>
                <Badge tone="muted">{column.taskCount}</Badge>
                {column.overdueTaskCount > 0 ? (
                  <Badge tone="warning">
                    {column.overdueTaskCount} overdue
                  </Badge>
                ) : null}
              </div>
              <p className="text-sm leading-6 text-muted">
                Tasks currently sitting in the {column.label.toLowerCase()}{" "}
                lane.
              </p>
            </div>

            {column.tasks.length > 0 ? (
              <div className="space-y-3">
                {column.tasks.map((task) => (
                  <TaskListItem
                    active={focusedTaskId === task.id}
                    key={task.id}
                    task={task}
                    view="kanban"
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                className="px-4 py-5"
                eyebrow="No tasks in lane"
                message="This lane is currently clear."
                title={`No ${column.label.toLowerCase()} tasks`}
              />
            )}
          </Surface>
        ))}
      </div>
    </div>
  );
}

function TaskListItem({
  active,
  task,
  view,
}: {
  active: boolean;
  task: TaskBoardItem;
  view: TaskBoardViewKey;
}) {
  return (
    <Link
      aria-current={active ? "true" : undefined}
      className="block"
      href={buildTaskHref({
        focusTaskId: task.id,
        view,
      })}
    >
      <Surface
        sx={{
          bgcolor: active ? "rgba(30, 93, 102, 0.12)" : "background.paper",
          borderColor: active ? "primary.main" : "divider",
          boxShadow: active ? "0 14px 28px rgba(19, 78, 68, 0.12)" : undefined,
          px: 2,
          py: 2,
          transition: "background-color 180ms ease, border-color 180ms ease",
          "&:hover": {
            bgcolor: active
              ? "rgba(30, 93, 102, 0.16)"
              : "rgba(18, 33, 40, 0.035)",
            borderColor: active ? "primary.main" : "text.secondary",
          },
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge tone={priorityTone(task.priority)}>
                {humanizeEnum(task.priority)}
              </Badge>
              <Badge tone={statusTone(task.status)}>
                {humanizeEnum(task.status)}
              </Badge>
              {task.deadlineReminderState !== "NONE" ? (
                <Badge tone={deadlineReminderTone(task.deadlineReminderState)}>
                  {deadlineReminderLabel(task.deadlineReminderState)}
                </Badge>
              ) : null}
            </div>
            <h3 className="text-base font-semibold text-foreground">
              {task.title}
            </h3>
          </div>
          <p className="text-sm text-muted">
            {task.dueAt ? `Due ${formatDate(task.dueAt)}` : "No due date"}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
          <span>{task.opportunityTitle}</span>
          <span>{task.opportunityStageLabel}</span>
          <span>{task.assigneeName ?? "Unassigned"}</span>
        </div>
      </Surface>
    </Link>
  );
}

function SummaryCard({
  label,
  supportingText,
  value,
}: {
  label: string;
  supportingText: string;
  value: string;
}) {
  return (
    <Surface
      sx={{
        borderRadius: `${onesourceTokens.radius.panel}px`,
        px: 2.5,
        py: 2.5,
      }}
    >
      <p className="text-xs tracking-[0.22em] text-muted uppercase">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-foreground">{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{supportingText}</p>
    </Surface>
  );
}

function getTasksForView({
  snapshot,
  view,
}: {
  snapshot: TaskBoardSnapshot;
  view: TaskBoardViewKey;
}) {
  switch (view) {
    case "team_tasks":
      return snapshot.teamTasks.lanes.flatMap((lane) => lane.tasks);
    case "calendar":
      return snapshot.calendar.buckets.flatMap((bucket) => bucket.tasks);
    case "kanban":
      return snapshot.kanban.columns.flatMap((column) => column.tasks);
    case "my_tasks":
    default:
      return snapshot.myTasks.tasks;
  }
}

function buildTaskHref({
  focusTaskId,
  view,
}: {
  focusTaskId?: string | null;
  view: TaskBoardViewKey;
}) {
  const params = new URLSearchParams();
  if (view !== "my_tasks") {
    params.set("view", view);
  }

  if (focusTaskId) {
    params.set("focus", focusTaskId);
  }

  const query = params.toString();
  return query ? `/tasks?${query}` : "/tasks";
}

function humanizeEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function priorityTone(taskPriority: TaskBoardItem["priority"]) {
  switch (taskPriority) {
    case "CRITICAL":
      return "warning" as const;
    case "HIGH":
      return "accent" as const;
    case "LOW":
      return "muted" as const;
    default:
      return "info" as const;
  }
}

function statusTone(status: TaskBoardItem["status"]) {
  switch (status) {
    case "BLOCKED":
      return "warning" as const;
    case "COMPLETED":
      return "success" as const;
    case "IN_PROGRESS":
      return "info" as const;
    case "CANCELLED":
      return "danger" as const;
    default:
      return "muted" as const;
  }
}

function deadlineReminderTone(state: TaskBoardItem["deadlineReminderState"]) {
  if (state === "OVERDUE") {
    return "warning" as const;
  }

  if (state === "UPCOMING") {
    return "info" as const;
  }

  return "muted" as const;
}

function deadlineReminderLabel(state: TaskBoardItem["deadlineReminderState"]) {
  switch (state) {
    case "OVERDUE":
      return "Overdue";
    case "UPCOMING":
      return "Upcoming";
    default:
      return "On track";
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
