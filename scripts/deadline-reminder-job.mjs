import {
  AuditActorType,
  DeadlineReminderState,
  PrismaClient,
} from "@prisma/client";

const ACTIVE_TASK_STATUSES = new Set(["NOT_STARTED", "IN_PROGRESS", "BLOCKED"]);
const ACTIVE_MILESTONE_STATUSES = new Set(["PLANNED", "AT_RISK"]);

export const DEADLINE_REMINDER_WORKER_IDENTIFIER = "deadline-reminder-worker";
export const DEFAULT_DEADLINE_REMINDER_LOOKAHEAD_DAYS = 7;

/**
 * @param {{
 *   deadlineAt: Date | string | null | undefined;
 *   isActive: boolean;
 *   lookaheadDays?: number;
 *   now?: Date;
 * }} input
 */
export function determineDeadlineReminderState({
  deadlineAt,
  isActive,
  lookaheadDays = DEFAULT_DEADLINE_REMINDER_LOOKAHEAD_DAYS,
  now = new Date(),
}) {
  if (!isActive || !deadlineAt) {
    return DeadlineReminderState.NONE;
  }

  const targetDate = deadlineAt instanceof Date ? deadlineAt : new Date(deadlineAt);
  const targetTime = targetDate.getTime();

  if (Number.isNaN(targetTime)) {
    return DeadlineReminderState.NONE;
  }

  if (targetTime < now.getTime()) {
    return DeadlineReminderState.OVERDUE;
  }

  const windowEnd =
    now.getTime() + lookaheadDays * 24 * 60 * 60 * 1000;

  if (targetTime <= windowEnd) {
    return DeadlineReminderState.UPCOMING;
  }

  return DeadlineReminderState.NONE;
}

/**
 * @param {Date | null | undefined} value
 */
function serializeDate(value) {
  return value instanceof Date ? value.toISOString() : null;
}

/**
 * @param {DeadlineReminderState} state
 */
function humanizeReminderState(state) {
  switch (state) {
    case DeadlineReminderState.UPCOMING:
      return "upcoming";
    case DeadlineReminderState.OVERDUE:
      return "overdue";
    default:
      return "cleared";
  }
}

/**
 * @param {{
 *   entityLabel: string;
 *   title: string;
 *   deadlineAt: Date | null | undefined;
 *   previousState: DeadlineReminderState;
 *   nextState: DeadlineReminderState;
 * }} input
 */
function buildReminderContent({
  entityLabel,
  title,
  deadlineAt,
  nextState,
}) {
  const deadlineLabel = deadlineAt
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(deadlineAt)
    : "an unknown date";

  if (nextState === DeadlineReminderState.NONE) {
    return {
      title: `${entityLabel} reminder cleared: ${title}`,
      description: `The background worker cleared the ${entityLabel.toLowerCase()} deadline reminder after the record moved out of the active reminder window.`,
    };
  }

  return {
    title: `${entityLabel} deadline ${humanizeReminderState(nextState)}: ${title}`,
    description: `The background worker marked this ${entityLabel.toLowerCase()} as ${humanizeReminderState(nextState)} against the ${deadlineLabel} deadline.`,
  };
}

/**
 * @param {{
 *   db: PrismaClient;
 *   task: {
 *     id: string;
 *     organizationId: string;
 *     opportunityId: string;
 *     title: string;
 *     dueAt: Date | null;
 *     deadlineReminderState: DeadlineReminderState;
 *     opportunity: { title: string };
 *   };
 *   nextState: DeadlineReminderState;
 *   occurredAt: Date;
 *   lookaheadDays: number;
 * }} input
 */
async function persistTaskReminderTransition({
  db,
  task,
  nextState,
  occurredAt,
  lookaheadDays,
}) {
  const content = buildReminderContent({
    entityLabel: "Task",
    title: task.title,
    deadlineAt: task.dueAt,
    previousState: task.deadlineReminderState,
    nextState,
  });

  await db.opportunityTask.update({
    where: {
      id: task.id,
    },
    data: {
      deadlineReminderState: nextState,
      deadlineReminderUpdatedAt: occurredAt,
    },
  });

  await db.opportunityActivityEvent.create({
    data: {
      organizationId: task.organizationId,
      opportunityId: task.opportunityId,
      actorType: AuditActorType.SYSTEM,
      actorIdentifier: DEADLINE_REMINDER_WORKER_IDENTIFIER,
      eventType: "task_deadline_reminder_updated",
      title: content.title,
      description: content.description,
      relatedEntityType: "task",
      relatedEntityId: task.id,
      metadata: {
        deadlineAt: serializeDate(task.dueAt),
        lookaheadDays,
        nextReminderState: nextState,
        previousReminderState: task.deadlineReminderState,
      },
      occurredAt,
    },
  });

  await db.auditLog.create({
    data: {
      organizationId: task.organizationId,
      actorType: AuditActorType.SYSTEM,
      actorIdentifier: DEADLINE_REMINDER_WORKER_IDENTIFIER,
      action: "opportunity.task.deadline_reminder",
      targetType: "opportunity_task",
      targetId: task.id,
      targetDisplay: task.title,
      summary: `${content.title} on ${task.opportunity.title}.`,
      metadata: {
        deadlineAt: serializeDate(task.dueAt),
        lookaheadDays,
        nextReminderState: nextState,
        opportunityId: task.opportunityId,
        opportunityTitle: task.opportunity.title,
        previousReminderState: task.deadlineReminderState,
      },
      occurredAt,
    },
  });
}

/**
 * @param {{
 *   db: PrismaClient;
 *   milestone: {
 *     id: string;
 *     organizationId: string;
 *     opportunityId: string;
 *     title: string;
 *     targetDate: Date;
 *     deadlineReminderState: DeadlineReminderState;
 *     opportunity: { title: string };
 *   };
 *   nextState: DeadlineReminderState;
 *   occurredAt: Date;
 *   lookaheadDays: number;
 * }} input
 */
async function persistMilestoneReminderTransition({
  db,
  milestone,
  nextState,
  occurredAt,
  lookaheadDays,
}) {
  const content = buildReminderContent({
    entityLabel: "Milestone",
    title: milestone.title,
    deadlineAt: milestone.targetDate,
    previousState: milestone.deadlineReminderState,
    nextState,
  });

  await db.opportunityMilestone.update({
    where: {
      id: milestone.id,
    },
    data: {
      deadlineReminderState: nextState,
      deadlineReminderUpdatedAt: occurredAt,
    },
  });

  await db.opportunityActivityEvent.create({
    data: {
      organizationId: milestone.organizationId,
      opportunityId: milestone.opportunityId,
      actorType: AuditActorType.SYSTEM,
      actorIdentifier: DEADLINE_REMINDER_WORKER_IDENTIFIER,
      eventType: "milestone_deadline_reminder_updated",
      title: content.title,
      description: content.description,
      relatedEntityType: "milestone",
      relatedEntityId: milestone.id,
      metadata: {
        deadlineAt: serializeDate(milestone.targetDate),
        lookaheadDays,
        nextReminderState: nextState,
        previousReminderState: milestone.deadlineReminderState,
      },
      occurredAt,
    },
  });

  await db.auditLog.create({
    data: {
      organizationId: milestone.organizationId,
      actorType: AuditActorType.SYSTEM,
      actorIdentifier: DEADLINE_REMINDER_WORKER_IDENTIFIER,
      action: "opportunity.milestone.deadline_reminder",
      targetType: "opportunity_milestone",
      targetId: milestone.id,
      targetDisplay: milestone.title,
      summary: `${content.title} on ${milestone.opportunity.title}.`,
      metadata: {
        deadlineAt: serializeDate(milestone.targetDate),
        lookaheadDays,
        nextReminderState: nextState,
        opportunityId: milestone.opportunityId,
        opportunityTitle: milestone.opportunity.title,
        previousReminderState: milestone.deadlineReminderState,
      },
      occurredAt,
    },
  });
}

/**
 * @param {{
 *   db: PrismaClient;
 *   now?: Date;
 *   lookaheadDays?: number;
 *   log?: (payload: Record<string, unknown>) => void;
 * }} input
 */
export async function runDeadlineReminderSweep({
  db,
  now = new Date(),
  lookaheadDays = DEFAULT_DEADLINE_REMINDER_LOOKAHEAD_DAYS,
  log = () => undefined,
}) {
  const tasks = await db.opportunityTask.findMany({
    where: {
      OR: [
        {
          dueAt: {
            not: null,
          },
        },
        {
          deadlineReminderState: {
            not: DeadlineReminderState.NONE,
          },
        },
      ],
    },
    select: {
      id: true,
      organizationId: true,
      opportunityId: true,
      title: true,
      status: true,
      dueAt: true,
      deadlineReminderState: true,
      opportunity: {
        select: {
          title: true,
        },
      },
    },
  });
  const milestones = await db.opportunityMilestone.findMany({
    select: {
      id: true,
      organizationId: true,
      opportunityId: true,
      title: true,
      status: true,
      targetDate: true,
      deadlineReminderState: true,
      opportunity: {
        select: {
          title: true,
        },
      },
    },
  });
  const occurredAt = now;
  const summary = {
    scannedTaskCount: tasks.length,
    scannedMilestoneCount: milestones.length,
    taskReminderUpdates: 0,
    milestoneReminderUpdates: 0,
    upcomingTaskCount: 0,
    overdueTaskCount: 0,
    upcomingMilestoneCount: 0,
    overdueMilestoneCount: 0,
  };

  for (const task of tasks) {
    const nextState = determineDeadlineReminderState({
      deadlineAt: task.dueAt,
      isActive: ACTIVE_TASK_STATUSES.has(task.status),
      lookaheadDays,
      now,
    });

    if (nextState === DeadlineReminderState.UPCOMING) {
      summary.upcomingTaskCount += 1;
    } else if (nextState === DeadlineReminderState.OVERDUE) {
      summary.overdueTaskCount += 1;
    }

    if (nextState === task.deadlineReminderState) {
      continue;
    }

    await persistTaskReminderTransition({
      db,
      task,
      nextState,
      occurredAt,
      lookaheadDays,
    });
    summary.taskReminderUpdates += 1;
  }

  for (const milestone of milestones) {
    const nextState = determineDeadlineReminderState({
      deadlineAt: milestone.targetDate,
      isActive: ACTIVE_MILESTONE_STATUSES.has(milestone.status),
      lookaheadDays,
      now,
    });

    if (nextState === DeadlineReminderState.UPCOMING) {
      summary.upcomingMilestoneCount += 1;
    } else if (nextState === DeadlineReminderState.OVERDUE) {
      summary.overdueMilestoneCount += 1;
    }

    if (nextState === milestone.deadlineReminderState) {
      continue;
    }

    await persistMilestoneReminderTransition({
      db,
      milestone,
      nextState,
      occurredAt,
      lookaheadDays,
    });
    summary.milestoneReminderUpdates += 1;
  }

  log({
    level: "info",
    message: "Deadline reminder sweep completed.",
    detail: summary,
  });

  return summary;
}

/**
 * @param {{
 *   prisma?: PrismaClient;
 *   now?: Date;
 *   lookaheadDays?: number;
 *   disconnect?: boolean;
 *   log?: (payload: Record<string, unknown>) => void;
 * }} input
 */
export async function runDeadlineReminderSweepWithPrisma({
  prisma = new PrismaClient(),
  now = new Date(),
  lookaheadDays = DEFAULT_DEADLINE_REMINDER_LOOKAHEAD_DAYS,
  disconnect = true,
  log,
} = {}) {
  try {
    return await runDeadlineReminderSweep({
      db: prisma,
      now,
      lookaheadDays,
      log,
    });
  } finally {
    if (disconnect) {
      await prisma.$disconnect();
    }
  }
}
