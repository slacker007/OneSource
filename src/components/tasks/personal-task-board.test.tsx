import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PersonalTaskBoard } from "./personal-task-board";
import type { PersonalTaskBoardSnapshot } from "@/modules/opportunities/opportunity.types";

const snapshot: PersonalTaskBoardSnapshot = {
  organization: {
    id: "org_123",
    name: "Default Organization",
    slug: "default-org",
  },
  assignedTaskCount: 2,
  completedTaskCount: 1,
  overdueTaskCount: 1,
  userDisplayName: "Taylor Reed",
  tasks: [
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
  ],
};

describe("PersonalTaskBoard", () => {
  it("renders assigned tasks with linked opportunity context", () => {
    render(<PersonalTaskBoard snapshot={snapshot} />);

    expect(
      screen.getByRole("heading", { name: /personal execution queue/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/taylor reed/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/enterprise knowledge management support services/i)).toBeInTheDocument();
    expect(screen.getByText(/army cloud operations recompete/i)).toBeInTheDocument();
    expect(screen.getAllByText(/^overdue$/i).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /open workspace/i })).toHaveLength(2);
  });
});
