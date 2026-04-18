import { describe, expect, it, vi } from "vitest";

import {
  determineDeadlineReminderState,
  runDeadlineReminderSweep,
} from "../../../scripts/deadline-reminder-job.mjs";

describe("deadline-reminder-job", () => {
  it("classifies deadline reminder states from active status and due date windows", () => {
    const now = new Date("2026-04-18T12:00:00.000Z");

    expect(
      determineDeadlineReminderState({
        deadlineAt: "2026-04-19T12:00:00.000Z",
        isActive: true,
        lookaheadDays: 7,
        now,
      }),
    ).toBe("UPCOMING");
    expect(
      determineDeadlineReminderState({
        deadlineAt: "2026-04-17T12:00:00.000Z",
        isActive: true,
        lookaheadDays: 7,
        now,
      }),
    ).toBe("OVERDUE");
    expect(
      determineDeadlineReminderState({
        deadlineAt: "2026-05-18T12:00:00.000Z",
        isActive: true,
        lookaheadDays: 7,
        now,
      }),
    ).toBe("NONE");
    expect(
      determineDeadlineReminderState({
        deadlineAt: "2026-04-19T12:00:00.000Z",
        isActive: false,
        lookaheadDays: 7,
        now,
      }),
    ).toBe("NONE");
  });

  it("updates reminder state transitions and records activity plus audit evidence", async () => {
    const now = new Date("2026-04-18T12:00:00.000Z");
    const taskUpdates: Array<{ where: { id: string }; data: Record<string, unknown> }> =
      [];
    const milestoneUpdates: Array<{
      where: { id: string };
      data: Record<string, unknown>;
    }> = [];
    const activityEvents: Array<Record<string, unknown>> = [];
    const auditLogs: Array<Record<string, unknown>> = [];

    const db = {
      opportunityTask: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "task_upcoming",
            organizationId: "org_123",
            opportunityId: "opp_alpha",
            title: "Prepare color team brief",
            status: "IN_PROGRESS",
            dueAt: new Date("2026-04-20T15:00:00.000Z"),
            deadlineReminderState: "NONE",
            opportunity: {
              title: "Enterprise Knowledge Management Support Services",
            },
          },
          {
            id: "task_cleared",
            organizationId: "org_123",
            opportunityId: "opp_alpha",
            title: "Archive old capture packet",
            status: "COMPLETED",
            dueAt: new Date("2026-04-17T15:00:00.000Z"),
            deadlineReminderState: "OVERDUE",
            opportunity: {
              title: "Enterprise Knowledge Management Support Services",
            },
          },
        ]),
        update: vi.fn().mockImplementation((args) => {
          taskUpdates.push(args);
          return Promise.resolve({ id: args.where.id });
        }),
      },
      opportunityMilestone: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "milestone_overdue",
            organizationId: "org_123",
            opportunityId: "opp_alpha",
            title: "Go/No-Go Board",
            status: "AT_RISK",
            targetDate: new Date("2026-04-16T18:00:00.000Z"),
            deadlineReminderState: "NONE",
            opportunity: {
              title: "Enterprise Knowledge Management Support Services",
            },
          },
        ]),
        update: vi.fn().mockImplementation((args) => {
          milestoneUpdates.push(args);
          return Promise.resolve({ id: args.where.id });
        }),
      },
      opportunityActivityEvent: {
        create: vi.fn().mockImplementation((args) => {
          activityEvents.push(args.data);
          return Promise.resolve({ id: `activity_${activityEvents.length}` });
        }),
      },
      auditLog: {
        create: vi.fn().mockImplementation((args) => {
          auditLogs.push(args.data);
          return Promise.resolve({ id: `audit_${auditLogs.length}` });
        }),
      },
    };

    const result = await runDeadlineReminderSweep({
      db: db as never,
      lookaheadDays: 7,
      now,
      log: () => undefined,
    });

    expect(result).toMatchObject({
      scannedTaskCount: 2,
      scannedMilestoneCount: 1,
      taskReminderUpdates: 2,
      milestoneReminderUpdates: 1,
      upcomingTaskCount: 1,
      overdueTaskCount: 0,
      upcomingMilestoneCount: 0,
      overdueMilestoneCount: 1,
    });

    expect(taskUpdates).toEqual([
      {
        where: { id: "task_upcoming" },
        data: {
          deadlineReminderState: "UPCOMING",
          deadlineReminderUpdatedAt: now,
        },
      },
      {
        where: { id: "task_cleared" },
        data: {
          deadlineReminderState: "NONE",
          deadlineReminderUpdatedAt: now,
        },
      },
    ]);
    expect(milestoneUpdates).toEqual([
      {
        where: { id: "milestone_overdue" },
        data: {
          deadlineReminderState: "OVERDUE",
          deadlineReminderUpdatedAt: now,
        },
      },
    ]);

    expect(activityEvents.map((event) => event.title)).toEqual([
      "Task deadline upcoming: Prepare color team brief",
      "Task reminder cleared: Archive old capture packet",
      "Milestone deadline overdue: Go/No-Go Board",
    ]);
    expect(auditLogs.map((event) => event.action)).toEqual([
      "opportunity.task.deadline_reminder",
      "opportunity.task.deadline_reminder",
      "opportunity.milestone.deadline_reminder",
    ]);
  });
});
