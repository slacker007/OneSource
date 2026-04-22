import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { OpportunityCloseoutManager } from "./opportunity-closeout-manager";
import { OpportunityMilestoneManager } from "./opportunity-milestone-manager";
import { OpportunityTaskManager } from "./opportunity-task-manager";
import {
  INITIAL_OPPORTUNITY_CLOSEOUT_ACTION_STATE,
  type OpportunityCloseoutActionState,
} from "@/modules/opportunities/opportunity-closeout-form.schema";
import {
  INITIAL_OPPORTUNITY_MILESTONE_ACTION_STATE,
  type OpportunityMilestoneActionState,
} from "@/modules/opportunities/opportunity-milestone-form.schema";
import {
  INITIAL_OPPORTUNITY_TASK_ACTION_STATE,
  type OpportunityTaskActionState,
} from "@/modules/opportunities/opportunity-task-form.schema";
import type {
  OpportunityCompetitorOption,
  OpportunityTaskAssigneeOption,
  OpportunityWorkspaceMilestone,
  OpportunityWorkspaceTask,
} from "@/modules/opportunities/opportunity.types";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

const competitorOptions: OpportunityCompetitorOption[] = [
  {
    label: "Harbor Mission Technologies",
    value: "competitor_harbor",
  },
];

const assigneeOptions: OpportunityTaskAssigneeOption[] = [
  {
    label: "Taylor Reed",
    value: "user_taylor",
  },
];

const milestones: OpportunityWorkspaceMilestone[] = [
  {
    id: "milestone_existing",
    title: "Go/No-Go Board",
    status: "PLANNED",
    targetDate: "2026-05-01T00:00:00.000Z",
    deadlineReminderState: "NONE",
    deadlineReminderUpdatedAt: null,
    description: "Baseline milestone for the workspace snapshot.",
    milestoneTypeKey: "bid_decision",
    completedAt: null,
  },
];

const tasks: OpportunityWorkspaceTask[] = [
  {
    assigneeName: "Taylor Reed",
    assigneeUserId: "user_taylor",
    createdAt: "2026-04-18T12:00:00.000Z",
    createdByName: "Alex Morgan",
    deadlineReminderState: "NONE",
    deadlineReminderUpdatedAt: null,
    description: "Existing workspace task.",
    dueAt: "2026-05-01T00:00:00.000Z",
    id: "task_existing",
    priority: "MEDIUM",
    startedAt: null,
    status: "NOT_STARTED",
    title: "Existing task",
    updatedAt: "2026-04-18T12:00:00.000Z",
    completedAt: null,
  },
];

describe("opportunity action refresh behavior", () => {
  beforeEach(() => {
    refreshMock.mockReset();
  });

  it(
    "refreshes the workspace after a milestone create succeeds",
    async () => {
      const user = userEvent.setup();
      const deferred = createDeferred<OpportunityMilestoneActionState>();
      const createAction = vi.fn(() => deferred.promise);

    render(
      <OpportunityMilestoneManager
        createAction={createAction}
        deleteAction={async () => INITIAL_OPPORTUNITY_MILESTONE_ACTION_STATE}
        milestones={milestones}
        opportunityId="opp_123"
        updateAction={async () => INITIAL_OPPORTUNITY_MILESTONE_ACTION_STATE}
      />,
    );

    const createFormQueries = within(
      screen.getByRole("form", { name: /add milestone/i }),
    );

    fireEvent.change(createFormQueries.getByLabelText(/milestone title/i), {
      target: { value: "Executive checkpoint" },
    });
    fireEvent.change(createFormQueries.getByLabelText(/target date/i), {
      target: { value: "2026-05-15" },
    });
    await user.click(createFormQueries.getByRole("combobox", { name: /^status$/i }));
    await user.click(screen.getByRole("option", { name: /planned/i }));
    await user.click(
      createFormQueries.getByRole("button", { name: /create milestone/i }),
    );

    expect(createAction).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("heading", { name: /executive checkpoint/i }),
    ).toBeVisible();
    expect(refreshMock).not.toHaveBeenCalled();

    deferred.resolve({
      ...INITIAL_OPPORTUNITY_MILESTONE_ACTION_STATE,
      successMessage: "Milestone created and added to the workspace.",
    });

    await waitFor(() => {
      expect(refreshMock).toHaveBeenCalledTimes(1);
    }, { timeout: 5_000 });
      expect(screen.getByRole("status")).toHaveTextContent(
        /milestone created and added to the workspace/i,
      );
    },
    10_000,
  );

  it("refreshes the workspace after a task create succeeds", async () => {
    const user = userEvent.setup();
    const deferred = createDeferred<OpportunityTaskActionState>();
    const createAction = vi.fn(() => deferred.promise);

    render(
      <OpportunityTaskManager
        assigneeOptions={assigneeOptions}
        createAction={createAction}
        deleteAction={async () => INITIAL_OPPORTUNITY_TASK_ACTION_STATE}
        opportunityId="opp_123"
        tasks={tasks}
        updateAction={async () => INITIAL_OPPORTUNITY_TASK_ACTION_STATE}
      />,
    );

    const createFormQueries = within(
      screen.getByRole("form", { name: /add execution task/i }),
    );

    fireEvent.change(createFormQueries.getByLabelText(/task title/i), {
      target: { value: "Capture kickoff" },
    });
    await user.click(createFormQueries.getByRole("combobox", { name: /assignee/i }));
    await user.click(screen.getByRole("option", { name: /taylor/i }));
    await user.click(
      createFormQueries.getByRole("button", { name: /create task/i }),
    );

    expect(createAction).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("heading", { name: /capture kickoff/i }),
    ).toBeVisible();
    expect(refreshMock).not.toHaveBeenCalled();

    deferred.resolve({
      ...INITIAL_OPPORTUNITY_TASK_ACTION_STATE,
      successMessage: "Task created and added to the workspace.",
    });

    await waitFor(() => {
      expect(refreshMock).toHaveBeenCalledTimes(1);
    }, { timeout: 5_000 });
    expect(screen.getByRole("status")).toHaveTextContent(
      /task created and added to the workspace/i,
    );
  });

  it("keeps closeout success feedback visible while refreshing the workspace", async () => {
    const user = userEvent.setup();
    const action = vi.fn(
      async (): Promise<OpportunityCloseoutActionState> => ({
        ...INITIAL_OPPORTUNITY_CLOSEOUT_ACTION_STATE,
        successMessage: "Closeout notes recorded and added to workspace history.",
      }),
    );

    render(
      <OpportunityCloseoutManager
        action={action}
        competitorOptions={competitorOptions}
        currentCloseout={null}
        currentStageKey="no_bid"
        currentStageLabel="No Bid"
        opportunityId="opp_closed"
      />,
    );

    fireEvent.change(screen.getByLabelText(/outcome reason/i), {
      target: {
        value: "Vehicle access did not align with the final pursuit posture.",
      },
    });
    fireEvent.change(screen.getByLabelText(/lessons learned/i), {
      target: {
        value: "Qualify schedule-based access earlier so the team can down-select sooner.",
      },
    });
    await user.click(screen.getByRole("button", { name: /record closeout/i }));

    await waitFor(() => {
      expect(action).toHaveBeenCalledTimes(1);
      expect(refreshMock).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      /closeout notes recorded and added to workspace history/i,
    );
  });
});

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve;
    reject = innerReject;
  });

  return {
    promise,
    resolve,
    reject,
  };
}
