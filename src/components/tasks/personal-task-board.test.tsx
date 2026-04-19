import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PersonalTaskBoard } from "./personal-task-board";
import type { TaskBoardSnapshot } from "@/modules/opportunities/opportunity.types";

const snapshot: TaskBoardSnapshot = {
  organization: {
    id: "org_123",
    name: "Default Organization",
    slug: "default-org",
  },
  currentUserId: "user_taylor",
  summary: {
    assignedTaskCount: 2,
    openTaskCount: 3,
    overdueTaskCount: 1,
    upcomingTaskCount: 1,
    blockedTaskCount: 1,
    unassignedTaskCount: 1,
    linkedOpportunityCount: 3,
  },
  userDisplayName: "Taylor Reed",
  allTasks: [
    {
      id: "task_1",
      title: "Complete incumbent analysis brief",
      description: "Summarize incumbent strengths before capture stand-up.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      dueAt: "2026-04-16T17:00:00.000Z",
      deadlineReminderState: "OVERDUE",
      deadlineReminderUpdatedAt: "2026-04-18T08:00:00.000Z",
      startedAt: "2026-04-16T14:00:00.000Z",
      completedAt: null,
      assigneeUserId: "user_taylor",
      assigneeName: "Taylor Reed",
      createdByName: "OneSource Admin",
      opportunityId: "opp_alpha",
      opportunityTitle: "Enterprise Knowledge Management Support Services",
      opportunityStageLabel: "Capture Active",
    },
    {
      id: "task_2",
      title: "Prepare customer questions draft",
      description: null,
      status: "COMPLETED",
      priority: "MEDIUM",
      dueAt: "2026-04-18T16:00:00.000Z",
      deadlineReminderState: "NONE",
      deadlineReminderUpdatedAt: null,
      startedAt: "2026-04-17T16:00:00.000Z",
      completedAt: "2026-04-18T15:30:00.000Z",
      assigneeUserId: "user_taylor",
      assigneeName: "Taylor Reed",
      createdByName: "OneSource Admin",
      opportunityId: "opp_beta",
      opportunityTitle: "Army Cloud Operations Recompete",
      opportunityStageLabel: "Qualified",
    },
    {
      id: "task_3",
      title: "Confirm draft pricing assumptions",
      description: "Finance needs an updated burn-rate check before the bid review.",
      status: "BLOCKED",
      priority: "CRITICAL",
      dueAt: "2026-04-20T12:00:00.000Z",
      deadlineReminderState: "UPCOMING",
      deadlineReminderUpdatedAt: "2026-04-18T08:00:00.000Z",
      startedAt: null,
      completedAt: null,
      assigneeUserId: null,
      assigneeName: null,
      createdByName: "Alex Morgan",
      opportunityId: "opp_gamma",
      opportunityTitle: "Navy Data Platform Modernization",
      opportunityStageLabel: "Proposal in Development",
    },
  ],
  myTasks: {
    tasks: [],
    sections: [],
  },
  teamTasks: {
    lanes: [],
  },
  calendar: {
    buckets: [],
  },
  kanban: {
    columns: [],
  },
};

const populatedSnapshot: TaskBoardSnapshot = {
  ...snapshot,
  myTasks: {
    tasks: [snapshot.allTasks[0], snapshot.allTasks[1]],
    sections: [
      {
        key: "needs_attention",
        label: "Needs attention",
        description:
          "Overdue, blocked, and critical work stays at the top of the queue.",
        taskCount: 1,
        tasks: [snapshot.allTasks[0]],
      },
      {
        key: "closed_loop",
        label: "Closed loop",
        description:
          "Completed or cancelled work stays visible for context without crowding the active queue.",
        taskCount: 1,
        tasks: [snapshot.allTasks[1]],
      },
    ],
  },
  teamTasks: {
    lanes: [
      {
        key: "unassigned",
        label: "Unassigned",
        supportingText: "Tasks that still need an owner before execution can move.",
        taskCount: 1,
        overdueTaskCount: 0,
        tasks: [snapshot.allTasks[2]],
      },
      {
        key: "user_taylor",
        label: "Taylor Reed",
        supportingText: "Live work assigned across the portfolio.",
        taskCount: 1,
        overdueTaskCount: 1,
        tasks: [snapshot.allTasks[0]],
      },
    ],
  },
  calendar: {
    buckets: [
      {
        key: "2026-04-16",
        label: "Apr 16",
        supportingText: "Wed, Apr 16, 2026",
        taskCount: 1,
        overdueTaskCount: 1,
        tasks: [snapshot.allTasks[0]],
      },
      {
        key: "2026-04-20",
        label: "Apr 20",
        supportingText: "Mon, Apr 20, 2026",
        taskCount: 1,
        overdueTaskCount: 0,
        tasks: [snapshot.allTasks[2]],
      },
      {
        key: "no_due_date",
        label: "No due date",
        supportingText:
          "Tasks without a committed due date stay visible here until planning catches up.",
        taskCount: 0,
        overdueTaskCount: 0,
        tasks: [],
      },
    ],
  },
  kanban: {
    columns: [
      {
        key: "BLOCKED",
        label: "Blocked",
        taskCount: 1,
        overdueTaskCount: 0,
        tasks: [snapshot.allTasks[2]],
      },
      {
        key: "IN_PROGRESS",
        label: "In progress",
        taskCount: 1,
        overdueTaskCount: 1,
        tasks: [snapshot.allTasks[0]],
      },
      {
        key: "NOT_STARTED",
        label: "Not started",
        taskCount: 0,
        overdueTaskCount: 0,
        tasks: [],
      },
      {
        key: "COMPLETED",
        label: "Completed",
        taskCount: 1,
        overdueTaskCount: 0,
        tasks: [snapshot.allTasks[1]],
      },
      {
        key: "CANCELLED",
        label: "Cancelled",
        taskCount: 0,
        overdueTaskCount: 0,
        tasks: [],
      },
    ],
  },
};

describe("PersonalTaskBoard", () => {
  it("renders my-tasks triage sections with preview context", () => {
    render(
      <PersonalTaskBoard
        snapshot={populatedSnapshot}
        viewState={{ focusTaskId: "task_1", view: "my_tasks" }}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /execution triage/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /my tasks/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("heading", { name: /^needs attention$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/enterprise knowledge management support services/i).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/task preview/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open task in workspace/i })).toHaveAttribute(
      "href",
      "/opportunities/opp_alpha?section=tasks",
    );
  });

  it("renders the team-task view with assignee lanes and unassigned work", () => {
    render(
      <PersonalTaskBoard
        snapshot={populatedSnapshot}
        viewState={{ focusTaskId: "task_3", view: "team_tasks" }}
      />,
    );

    expect(screen.getByRole("link", { name: /team tasks/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("heading", { name: /^unassigned$/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/taylor reed/i).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/confirm draft pricing assumptions/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/navy data platform modernization/i).length,
    ).toBeGreaterThan(0);
  });

  it("renders the calendar and kanban secondary views", () => {
    const { rerender } = render(
      <PersonalTaskBoard
        snapshot={populatedSnapshot}
        viewState={{ focusTaskId: "task_1", view: "calendar" }}
      />,
    );

    expect(screen.getByRole("link", { name: /calendar/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("heading", { name: /^apr 16$/i })).toBeInTheDocument();
    expect(screen.getAllByText(/apr 16, 2026/i).length).toBeGreaterThan(0);

    rerender(
      <PersonalTaskBoard
        snapshot={populatedSnapshot}
        viewState={{ focusTaskId: "task_2", view: "kanban" }}
      />,
    );

    expect(screen.getByRole("link", { name: /kanban/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getAllByText(/^blocked$/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^completed$/i).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/prepare customer questions draft/i).length,
    ).toBeGreaterThan(0);
  });

  it("renders a truthful empty state when no personal tasks remain", () => {
    render(
      <PersonalTaskBoard
        snapshot={{
          ...populatedSnapshot,
          summary: {
            ...populatedSnapshot.summary,
            assignedTaskCount: 0,
          },
          myTasks: {
            tasks: [],
            sections: [],
          },
        }}
        viewState={{ focusTaskId: null, view: "my_tasks" }}
      />,
    );

    expect(screen.getByText(/no personal tasks/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /assigned work will appear here once opportunity owners delegate execution tasks/i,
      ),
    ).toBeInTheDocument();
  });

  it("renders an error state when the task snapshot is unavailable", () => {
    render(
      <PersonalTaskBoard
        snapshot={null}
        viewState={{ focusTaskId: null, view: "my_tasks" }}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /execution triage/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/task workspace is unavailable/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /the task workspace could not be loaded for the current organization/i,
      ),
    ).toBeInTheDocument();
  });
});
