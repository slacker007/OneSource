import { AuditActorType } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { AUDIT_ACTIONS } from "@/modules/audit/audit.service";
import { OpportunityStageTransitionValidationError } from "@/modules/opportunities/opportunity-stage-policy";

import {
  createOpportunityMilestone,
  createOpportunityNote,
  createOpportunityTask,
  createOpportunity,
  deleteOpportunityMilestone,
  deleteOpportunityTask,
  deleteOpportunity,
  recordBidDecision,
  recordSourceImportDecision,
  recordStageTransition,
  updateOpportunityMilestone,
  updateOpportunityTask,
  updateOpportunity,
  type OpportunityWriteClient,
  type OpportunityWriteTransactionClient,
} from "./opportunity-write.service";

const actor = {
  type: AuditActorType.USER,
  userId: "user_123",
  identifier: "alex.morgan@onesource.local",
  organizationId: "org_123",
};

function createMockWriteClient() {
  const tx = {
    auditLog: {
      create: vi.fn(),
    },
    opportunityActivityEvent: {
      create: vi.fn(),
    },
    opportunityTask: {
      count: vi.fn(),
      create: vi.fn(),
      findFirstOrThrow: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    opportunityMilestone: {
      count: vi.fn(),
      create: vi.fn(),
      findFirstOrThrow: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    opportunityNote: {
      create: vi.fn(),
    },
    opportunity: {
      create: vi.fn(),
      findFirstOrThrow: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    opportunityStageTransition: {
      create: vi.fn(),
    },
    bidDecision: {
      updateMany: vi.fn(),
      create: vi.fn(),
    },
    sourceRecord: {
      findFirstOrThrow: vi.fn(),
    },
    sourceImportDecision: {
      create: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
    },
  } as unknown as OpportunityWriteTransactionClient;

  const db = {
    ...tx,
    $transaction: vi.fn(async (callback) => callback(tx)),
  } as unknown as OpportunityWriteClient;

  return {
    db,
    tx,
  };
}

describe("opportunity-write.service", () => {
  it("creates opportunities and emits a create audit row", async () => {
    const { db, tx } = createMockWriteClient();
    const occurredAt = new Date("2026-04-18T01:32:00.000Z");

    vi.mocked(tx.opportunity.create).mockResolvedValue({
      id: "opp_123",
      organizationId: "org_123",
      title: "Data Platform Operations",
      description: "Cloud and platform support.",
      leadAgencyId: "agency_123",
      responseDeadlineAt: null,
      solicitationNumber: null,
      naicsCode: "541512",
      originSourceSystem: "sam_gov",
      currentStageKey: "identified",
      currentStageLabel: "Identified",
    });

    await createOpportunity({
      db,
      input: {
        actor,
        title: "  Data Platform Operations  ",
        description: "  Cloud and platform support.  ",
        leadAgencyId: "agency_123",
        naicsCode: "541512",
        originSourceSystem: "sam_gov",
        currentStageKey: "identified",
        occurredAt,
      },
    });

    expect(tx.opportunity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "Data Platform Operations",
          description: "Cloud and platform support.",
          currentStageKey: "identified",
          currentStageLabel: "Identified",
          currentStageChangedAt: occurredAt,
        }),
      }),
    );
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: "org_123",
        action: AUDIT_ACTIONS.opportunityCreate,
        targetType: "opportunity",
        targetId: "opp_123",
        targetDisplay: "Data Platform Operations",
        occurredAt,
      }),
    });
  });

  it("updates opportunities and records changed fields in audit metadata", async () => {
    const { db, tx } = createMockWriteClient();
    const occurredAt = new Date("2026-04-18T01:33:00.000Z");

    vi.mocked(tx.opportunity.findFirstOrThrow).mockResolvedValue({
      id: "opp_123",
      organizationId: "org_123",
      title: "Data Platform Operations",
      description: "Old description.",
      leadAgencyId: "agency_123",
      responseDeadlineAt: new Date("2026-05-01T17:00:00.000Z"),
      solicitationNumber: "SOL-1",
      naicsCode: "541512",
      originSourceSystem: "sam_gov",
      currentStageKey: "identified",
      currentStageLabel: "Identified",
    });
    vi.mocked(tx.opportunity.update).mockResolvedValue({
      id: "opp_123",
      organizationId: "org_123",
      title: "Enterprise Data Platform Operations",
      description: "Expanded cloud support.",
      leadAgencyId: "agency_999",
      responseDeadlineAt: new Date("2026-05-08T17:00:00.000Z"),
      solicitationNumber: "SOL-2",
      naicsCode: "541519",
      originSourceSystem: "sam_gov",
      currentStageKey: "identified",
      currentStageLabel: "Identified",
    });

    await updateOpportunity({
      db,
      input: {
        actor,
        opportunityId: "opp_123",
        title: "Enterprise Data Platform Operations",
        description: "Expanded cloud support.",
        leadAgencyId: "agency_999",
        responseDeadlineAt: new Date("2026-05-08T17:00:00.000Z"),
        solicitationNumber: "SOL-2",
        naicsCode: "541519",
        occurredAt,
      },
    });

    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: AUDIT_ACTIONS.opportunityUpdate,
        targetId: "opp_123",
        metadata: expect.objectContaining({
          changedFields: expect.objectContaining({
            title: {
              from: "Data Platform Operations",
              to: "Enterprise Data Platform Operations",
            },
            solicitationNumber: {
              from: "SOL-1",
              to: "SOL-2",
            },
            naicsCode: {
              from: "541512",
              to: "541519",
            },
          }),
        }),
        occurredAt,
      }),
    });
  });

  it("deletes opportunities and emits a delete audit row", async () => {
    const { db, tx } = createMockWriteClient();
    const occurredAt = new Date("2026-04-18T01:34:00.000Z");

    vi.mocked(tx.opportunity.findFirstOrThrow).mockResolvedValue({
      id: "opp_123",
      organizationId: "org_123",
      title: "Data Platform Operations",
      description: null,
      leadAgencyId: null,
      responseDeadlineAt: null,
      solicitationNumber: null,
      naicsCode: null,
      originSourceSystem: null,
      currentStageKey: null,
      currentStageLabel: null,
    });
    vi.mocked(tx.opportunity.delete).mockResolvedValue({
      id: "opp_123",
      organizationId: "org_123",
      title: "Data Platform Operations",
    });

    await deleteOpportunity({
      db,
      input: {
        actor,
        opportunityId: "opp_123",
        occurredAt,
      },
    });

    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: AUDIT_ACTIONS.opportunityDelete,
        targetType: "opportunity",
        targetId: "opp_123",
        targetDisplay: "Data Platform Operations",
        occurredAt,
      }),
    });
  });

  it("creates opportunity tasks and emits activity plus audit rows", async () => {
    const { db, tx } = createMockWriteClient();
    const occurredAt = new Date("2026-04-18T01:34:30.000Z");

    vi.mocked(tx.opportunity.findFirstOrThrow).mockResolvedValue({
      id: "opp_123",
      organizationId: "org_123",
      title: "Data Platform Operations",
      description: null,
      leadAgencyId: null,
      responseDeadlineAt: null,
      solicitationNumber: null,
      naicsCode: null,
      originSourceSystem: null,
      currentStageKey: "capture_active",
      currentStageLabel: "Capture Active",
    });
    vi.mocked(tx.user.findFirst).mockResolvedValue({
      id: "user_456",
    });
    vi.mocked(tx.opportunityTask.count).mockResolvedValue(2);
    vi.mocked(tx.opportunityTask.create).mockResolvedValue({
      id: "task_123",
      organizationId: "org_123",
      opportunityId: "opp_123",
      title: "Confirm pricing assumptions",
      description: "Coordinate with finance before executive review.",
      status: "IN_PROGRESS",
      priority: "CRITICAL",
      dueAt: new Date("2026-04-24T12:00:00.000Z"),
      startedAt: occurredAt,
      completedAt: null,
      sortOrder: 2,
      assigneeUserId: "user_456",
      opportunity: {
        id: "opp_123",
        title: "Data Platform Operations",
      },
    });
    vi.mocked(tx.opportunityActivityEvent.create).mockResolvedValue({
      id: "activity_123",
    });

    await createOpportunityTask({
      db,
      input: {
        actor,
        opportunityId: "opp_123",
        title: "  Confirm pricing assumptions  ",
        description: " Coordinate with finance before executive review. ",
        assigneeUserId: "user_456",
        dueAt: new Date("2026-04-24T12:00:00.000Z"),
        priority: "CRITICAL",
        status: "IN_PROGRESS",
        occurredAt,
      },
    });

    expect(tx.opportunityTask.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          assigneeUserId: "user_456",
          createdByUserId: "user_123",
          priority: "CRITICAL",
          sortOrder: 2,
          startedAt: occurredAt,
          status: "IN_PROGRESS",
          title: "Confirm pricing assumptions",
        }),
      }),
    );
    expect(tx.opportunityActivityEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        eventType: "task_created",
        relatedEntityId: "task_123",
        title: "Task created: Confirm pricing assumptions",
      }),
      select: {
        id: true,
      },
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: AUDIT_ACTIONS.opportunityTaskCreate,
        targetId: "task_123",
        targetType: "opportunity_task",
        occurredAt,
      }),
    });
  });

  it("updates opportunity tasks and records changed fields in audit metadata", async () => {
    const { db, tx } = createMockWriteClient();
    const occurredAt = new Date("2026-04-18T01:34:45.000Z");

    vi.mocked(tx.opportunityTask.findFirstOrThrow).mockResolvedValue({
      id: "task_123",
      organizationId: "org_123",
      opportunityId: "opp_123",
      title: "Confirm pricing assumptions",
      description: "Coordinate with finance before executive review.",
      status: "NOT_STARTED",
      priority: "HIGH",
      dueAt: new Date("2026-04-24T12:00:00.000Z"),
      startedAt: null,
      completedAt: null,
      sortOrder: 2,
      assigneeUserId: "user_456",
      opportunity: {
        id: "opp_123",
        title: "Data Platform Operations",
      },
    });
    vi.mocked(tx.user.findFirst).mockResolvedValue({
      id: "user_789",
    });
    vi.mocked(tx.opportunityTask.update).mockResolvedValue({
      id: "task_123",
      organizationId: "org_123",
      opportunityId: "opp_123",
      title: "Finalize pricing assumptions",
      description: "Coordinate with finance and contracts before executive review.",
      status: "COMPLETED",
      priority: "CRITICAL",
      dueAt: new Date("2026-04-25T12:00:00.000Z"),
      startedAt: occurredAt,
      completedAt: occurredAt,
      sortOrder: 2,
      assigneeUserId: "user_789",
      opportunity: {
        id: "opp_123",
        title: "Data Platform Operations",
      },
    });
    vi.mocked(tx.opportunityActivityEvent.create).mockResolvedValue({
      id: "activity_456",
    });

    await updateOpportunityTask({
      db,
      input: {
        actor,
        taskId: "task_123",
        title: "Finalize pricing assumptions",
        description: "Coordinate with finance and contracts before executive review.",
        assigneeUserId: "user_789",
        dueAt: new Date("2026-04-25T12:00:00.000Z"),
        priority: "CRITICAL",
        status: "COMPLETED",
        occurredAt,
      },
    });

    expect(tx.opportunityTask.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          assigneeUserId: "user_789",
          completedAt: occurredAt,
          priority: "CRITICAL",
          startedAt: occurredAt,
          status: "COMPLETED",
          title: "Finalize pricing assumptions",
        }),
      }),
    );
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: AUDIT_ACTIONS.opportunityTaskUpdate,
        metadata: expect.objectContaining({
          changedFields: expect.objectContaining({
            assigneeUserId: {
              from: "user_456",
              to: "user_789",
            },
            status: {
              from: "NOT_STARTED",
              to: "COMPLETED",
            },
            title: {
              from: "Confirm pricing assumptions",
              to: "Finalize pricing assumptions",
            },
          }),
        }),
        targetId: "task_123",
      }),
    });
  });

  it("deletes opportunity tasks and emits a delete audit row", async () => {
    const { db, tx } = createMockWriteClient();
    const occurredAt = new Date("2026-04-18T01:34:55.000Z");

    vi.mocked(tx.opportunityTask.findFirstOrThrow).mockResolvedValue({
      id: "task_123",
      organizationId: "org_123",
      opportunityId: "opp_123",
      title: "Finalize pricing assumptions",
      description: "Coordinate with finance and contracts before executive review.",
      status: "COMPLETED",
      priority: "CRITICAL",
      dueAt: new Date("2026-04-25T12:00:00.000Z"),
      startedAt: new Date("2026-04-18T01:34:45.000Z"),
      completedAt: new Date("2026-04-18T01:34:55.000Z"),
      sortOrder: 2,
      assigneeUserId: "user_789",
      opportunity: {
        id: "opp_123",
        title: "Data Platform Operations",
      },
    });
    vi.mocked(tx.opportunityTask.delete).mockResolvedValue({
      id: "task_123",
      organizationId: "org_123",
      opportunityId: "opp_123",
      title: "Finalize pricing assumptions",
      description: "Coordinate with finance and contracts before executive review.",
      status: "COMPLETED",
      priority: "CRITICAL",
      dueAt: new Date("2026-04-25T12:00:00.000Z"),
      startedAt: new Date("2026-04-18T01:34:45.000Z"),
      completedAt: new Date("2026-04-18T01:34:55.000Z"),
      sortOrder: 2,
      assigneeUserId: "user_789",
      opportunity: {
        id: "opp_123",
        title: "Data Platform Operations",
      },
    });
    vi.mocked(tx.opportunityActivityEvent.create).mockResolvedValue({
      id: "activity_789",
    });

    await deleteOpportunityTask({
      db,
      input: {
        actor,
        taskId: "task_123",
        occurredAt,
      },
    });

    expect(tx.opportunityTask.delete).toHaveBeenCalledWith({
      where: {
        id: "task_123",
      },
      select: expect.any(Object),
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: AUDIT_ACTIONS.opportunityTaskDelete,
        targetDisplay: "Finalize pricing assumptions",
        targetId: "task_123",
        targetType: "opportunity_task",
        occurredAt,
      }),
    });
  });

  it("creates opportunity milestones and emits activity plus audit rows", async () => {
    const { db, tx } = createMockWriteClient();
    const occurredAt = new Date("2026-04-18T01:35:15.000Z");

    vi.mocked(tx.opportunity.findFirstOrThrow).mockResolvedValue({
      id: "opp_123",
      organizationId: "org_123",
      title: "Data Platform Operations",
      description: null,
      leadAgencyId: null,
      responseDeadlineAt: null,
      solicitationNumber: null,
      naicsCode: null,
      originSourceSystem: null,
      currentStageKey: "capture_active",
      currentStageLabel: "Capture Active",
    });
    vi.mocked(tx.opportunityMilestone.count).mockResolvedValue(1);
    vi.mocked(tx.opportunityMilestone.create).mockResolvedValue({
      id: "milestone_123",
      organizationId: "org_123",
      opportunityId: "opp_123",
      title: "Go/No-Go Board",
      description: "Review pursuit posture with leadership.",
      milestoneTypeKey: "decision_checkpoint",
      status: "AT_RISK",
      targetDate: new Date("2026-04-28T12:00:00.000Z"),
      completedAt: null,
      sortOrder: 1,
      opportunity: {
        id: "opp_123",
        title: "Data Platform Operations",
      },
    });
    vi.mocked(tx.opportunityActivityEvent.create).mockResolvedValue({
      id: "activity_901",
    });

    await createOpportunityMilestone({
      db,
      input: {
        actor,
        opportunityId: "opp_123",
        title: "  Go/No-Go Board  ",
        description: " Review pursuit posture with leadership. ",
        milestoneTypeKey: "decision_checkpoint",
        targetDate: new Date("2026-04-28T12:00:00.000Z"),
        status: "AT_RISK",
        occurredAt,
      },
    });

    expect(tx.opportunityMilestone.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          createdByUserId: "user_123",
          milestoneTypeKey: "decision_checkpoint",
          sortOrder: 1,
          status: "AT_RISK",
          title: "Go/No-Go Board",
        }),
      }),
    );
    expect(tx.opportunityActivityEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        eventType: "milestone_created",
        relatedEntityId: "milestone_123",
        title: "Milestone created: Go/No-Go Board",
      }),
      select: {
        id: true,
      },
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: AUDIT_ACTIONS.opportunityMilestoneCreate,
        targetId: "milestone_123",
        targetType: "opportunity_milestone",
        occurredAt,
      }),
    });
  });

  it("creates opportunity notes and emits activity plus audit rows", async () => {
    const { db, tx } = createMockWriteClient();
    const occurredAt = new Date("2026-04-18T06:10:00.000Z");

    vi.mocked(tx.opportunity.findFirstOrThrow).mockResolvedValue({
      id: "opp_123",
      organizationId: "org_123",
      title: "Enterprise Knowledge Management Support Services",
      description: null,
      leadAgencyId: null,
      responseDeadlineAt: null,
      solicitationNumber: null,
      naicsCode: null,
      originSourceSystem: "sam_gov",
      currentStageKey: "capture_active",
      currentStageLabel: "Capture Active",
    });
    vi.mocked(tx.opportunityNote.create).mockResolvedValue({
      id: "note_123",
      organizationId: "org_123",
      opportunityId: "opp_123",
      title: "Capture summary",
      body: "Customer history is favorable and vehicle access is already confirmed.",
      contentFormat: "markdown",
      isPinned: true,
      opportunity: {
        id: "opp_123",
        title: "Enterprise Knowledge Management Support Services",
      },
    });
    vi.mocked(tx.opportunityActivityEvent.create).mockResolvedValue({
      id: "activity_note_123",
    });

    await createOpportunityNote({
      db,
      input: {
        actor,
        opportunityId: "opp_123",
        title: "  Capture summary  ",
        body: "  Customer history is favorable and vehicle access is already confirmed.  ",
        isPinned: true,
        occurredAt,
      },
    });

    expect(tx.opportunityNote.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        authorUserId: "user_123",
        body:
          "Customer history is favorable and vehicle access is already confirmed.",
        contentFormat: "markdown",
        isPinned: true,
        opportunityId: "opp_123",
        organizationId: "org_123",
        title: "Capture summary",
      }),
      select: expect.any(Object),
    });
    expect(tx.opportunityActivityEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: "user_123",
        description:
          "Customer history is favorable and vehicle access is already confirmed.",
        eventType: "note_added",
        occurredAt,
        opportunityId: "opp_123",
        organizationId: "org_123",
        relatedEntityId: "note_123",
        relatedEntityType: "note",
        title: "Note added: Capture summary",
      }),
      select: {
        id: true,
      },
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: AUDIT_ACTIONS.opportunityNoteCreate,
        metadata: expect.objectContaining({
          contentFormat: "markdown",
          isPinned: true,
          opportunityId: "opp_123",
          opportunityTitle: "Enterprise Knowledge Management Support Services",
        }),
        occurredAt,
        targetDisplay: "Capture summary",
        targetId: "note_123",
        targetType: "opportunity_note",
      }),
    });
  });

  it("updates opportunity milestones and records changed fields in audit metadata", async () => {
    const { db, tx } = createMockWriteClient();
    const occurredAt = new Date("2026-04-18T01:35:25.000Z");

    vi.mocked(tx.opportunityMilestone.findFirstOrThrow).mockResolvedValue({
      id: "milestone_123",
      organizationId: "org_123",
      opportunityId: "opp_123",
      title: "Go/No-Go Board",
      description: "Review pursuit posture with leadership.",
      milestoneTypeKey: "decision_checkpoint",
      status: "PLANNED",
      targetDate: new Date("2026-04-28T12:00:00.000Z"),
      completedAt: null,
      sortOrder: 1,
      opportunity: {
        id: "opp_123",
        title: "Data Platform Operations",
      },
    });
    vi.mocked(tx.opportunityMilestone.update).mockResolvedValue({
      id: "milestone_123",
      organizationId: "org_123",
      opportunityId: "opp_123",
      title: "Executive Go/No-Go Board",
      description: "Leadership approved the checkpoint as complete.",
      milestoneTypeKey: "bid_decision",
      status: "COMPLETED",
      targetDate: new Date("2026-04-29T12:00:00.000Z"),
      completedAt: occurredAt,
      sortOrder: 1,
      opportunity: {
        id: "opp_123",
        title: "Data Platform Operations",
      },
    });
    vi.mocked(tx.opportunityActivityEvent.create).mockResolvedValue({
      id: "activity_902",
    });

    await updateOpportunityMilestone({
      db,
      input: {
        actor,
        milestoneId: "milestone_123",
        title: "Executive Go/No-Go Board",
        description: "Leadership approved the checkpoint as complete.",
        milestoneTypeKey: "bid_decision",
        targetDate: new Date("2026-04-29T12:00:00.000Z"),
        status: "COMPLETED",
        occurredAt,
      },
    });

    expect(tx.opportunityMilestone.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          completedAt: occurredAt,
          milestoneTypeKey: "bid_decision",
          status: "COMPLETED",
          title: "Executive Go/No-Go Board",
        }),
      }),
    );
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: AUDIT_ACTIONS.opportunityMilestoneUpdate,
        metadata: expect.objectContaining({
          changedFields: expect.objectContaining({
            milestoneTypeKey: {
              from: "decision_checkpoint",
              to: "bid_decision",
            },
            status: {
              from: "PLANNED",
              to: "COMPLETED",
            },
            title: {
              from: "Go/No-Go Board",
              to: "Executive Go/No-Go Board",
            },
          }),
        }),
        targetId: "milestone_123",
      }),
    });
  });

  it("deletes opportunity milestones and emits a delete audit row", async () => {
    const { db, tx } = createMockWriteClient();
    const occurredAt = new Date("2026-04-18T01:35:35.000Z");

    vi.mocked(tx.opportunityMilestone.findFirstOrThrow).mockResolvedValue({
      id: "milestone_123",
      organizationId: "org_123",
      opportunityId: "opp_123",
      title: "Executive Go/No-Go Board",
      description: "Leadership approved the checkpoint as complete.",
      milestoneTypeKey: "bid_decision",
      status: "COMPLETED",
      targetDate: new Date("2026-04-29T12:00:00.000Z"),
      completedAt: new Date("2026-04-18T01:35:25.000Z"),
      sortOrder: 1,
      opportunity: {
        id: "opp_123",
        title: "Data Platform Operations",
      },
    });
    vi.mocked(tx.opportunityMilestone.delete).mockResolvedValue({
      id: "milestone_123",
      organizationId: "org_123",
      opportunityId: "opp_123",
      title: "Executive Go/No-Go Board",
      description: "Leadership approved the checkpoint as complete.",
      milestoneTypeKey: "bid_decision",
      status: "COMPLETED",
      targetDate: new Date("2026-04-29T12:00:00.000Z"),
      completedAt: new Date("2026-04-18T01:35:25.000Z"),
      sortOrder: 1,
      opportunity: {
        id: "opp_123",
        title: "Data Platform Operations",
      },
    });
    vi.mocked(tx.opportunityActivityEvent.create).mockResolvedValue({
      id: "activity_903",
    });

    await deleteOpportunityMilestone({
      db,
      input: {
        actor,
        milestoneId: "milestone_123",
        occurredAt,
      },
    });

    expect(tx.opportunityMilestone.delete).toHaveBeenCalledWith({
      where: {
        id: "milestone_123",
      },
      select: expect.any(Object),
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: AUDIT_ACTIONS.opportunityMilestoneDelete,
        targetDisplay: "Executive Go/No-Go Board",
        targetId: "milestone_123",
        targetType: "opportunity_milestone",
        occurredAt,
      }),
    });
  });

  it("records stage transitions and audits the before and after stage state", async () => {
    const { db, tx } = createMockWriteClient();
    const transitionedAt = new Date("2026-04-18T01:35:00.000Z");

    vi.mocked(tx.opportunity.findFirstOrThrow).mockResolvedValue({
      id: "opp_123",
      organizationId: "org_123",
      title: "Data Platform Operations",
      description: null,
      leadAgencyId: "agency_123",
      responseDeadlineAt: new Date("2026-05-20T17:00:00.000Z"),
      solicitationNumber: "SOL-1",
      naicsCode: "541512",
      originSourceSystem: null,
      currentStageKey: "identified",
      currentStageLabel: "Identified",
      bidDecisions: [],
      documents: [],
      milestones: [],
      notes: [],
      scorecards: [],
      tasks: [],
    });
    vi.mocked(tx.opportunity.update).mockResolvedValue({
      id: "opp_123",
      organizationId: "org_123",
      title: "Data Platform Operations",
      description: null,
      leadAgencyId: "agency_123",
      responseDeadlineAt: new Date("2026-05-20T17:00:00.000Z"),
      solicitationNumber: "SOL-1",
      naicsCode: "541512",
      originSourceSystem: null,
      currentStageKey: "qualified",
      currentStageLabel: "Qualified",
    });
    vi.mocked(tx.opportunityStageTransition.create).mockResolvedValue({
      id: "transition_123",
      transitionedAt,
      toStageKey: "qualified",
      toStageLabel: "Qualified",
    });
    vi.mocked(tx.opportunityActivityEvent.create).mockResolvedValue({
      id: "activity_123",
    });

    await recordStageTransition({
      db,
      input: {
        actor,
        opportunityId: "opp_123",
        toStageKey: "qualified",
        rationale: "Qualified after incumbent check.",
        transitionedAt,
      },
    });

    expect(tx.opportunityStageTransition.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fromStageKey: "identified",
          toStageKey: "qualified",
          transitionedAt,
        }),
      }),
    );
    expect(tx.opportunityActivityEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        description: "Qualified after incumbent check.",
        eventType: "stage_transition",
        opportunityId: "opp_123",
        relatedEntityId: "transition_123",
        relatedEntityType: "stage_transition",
        title: "Moved to Qualified",
      }),
      select: {
        id: true,
      },
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: AUDIT_ACTIONS.opportunityStageTransition,
        metadata: expect.objectContaining({
          transitionId: "transition_123",
          fromStageKey: "identified",
          toStageKey: "qualified",
        }),
        occurredAt: transitionedAt,
      }),
    });
  });

  it("blocks invalid stage transitions when required fields are missing", async () => {
    const { db, tx } = createMockWriteClient();

    vi.mocked(tx.opportunity.findFirstOrThrow).mockResolvedValue({
      id: "opp_123",
      organizationId: "org_123",
      title: "Data Platform Operations",
      description: null,
      leadAgencyId: null,
      responseDeadlineAt: null,
      solicitationNumber: null,
      naicsCode: null,
      originSourceSystem: null,
      currentStageKey: "identified",
      currentStageLabel: "Identified",
      bidDecisions: [],
      documents: [],
      milestones: [],
      notes: [],
      scorecards: [],
      tasks: [],
    });

    await expect(
      recordStageTransition({
        db,
        input: {
          actor,
          opportunityId: "opp_123",
          toStageKey: "qualified",
          rationale: "Ready to qualify.",
        },
      }),
    ).rejects.toBeInstanceOf(OpportunityStageTransitionValidationError);

    expect(tx.opportunity.update).not.toHaveBeenCalled();
    expect(tx.opportunityStageTransition.create).not.toHaveBeenCalled();
    expect(tx.opportunityActivityEvent.create).not.toHaveBeenCalled();
    expect(tx.auditLog.create).not.toHaveBeenCalled();
  });

  it("blocks stage transitions when the rationale is blank", async () => {
    const { db, tx } = createMockWriteClient();

    vi.mocked(tx.opportunity.findFirstOrThrow).mockResolvedValue({
      id: "opp_123",
      organizationId: "org_123",
      title: "Data Platform Operations",
      description: null,
      leadAgencyId: "agency_123",
      responseDeadlineAt: new Date("2026-05-20T17:00:00.000Z"),
      solicitationNumber: "SOL-1",
      naicsCode: "541512",
      originSourceSystem: null,
      currentStageKey: "identified",
      currentStageLabel: "Identified",
      bidDecisions: [],
      documents: [],
      milestones: [],
      notes: [],
      scorecards: [],
      tasks: [],
    });

    await expect(
      recordStageTransition({
        db,
        input: {
          actor,
          opportunityId: "opp_123",
          toStageKey: "qualified",
          rationale: "   ",
        },
      }),
    ).rejects.toBeInstanceOf(OpportunityStageTransitionValidationError);

    expect(tx.opportunity.update).not.toHaveBeenCalled();
    expect(tx.opportunityStageTransition.create).not.toHaveBeenCalled();
    expect(tx.opportunityActivityEvent.create).not.toHaveBeenCalled();
    expect(tx.auditLog.create).not.toHaveBeenCalled();
  });

  it("records bid decisions and emits an opportunity decision audit row", async () => {
    const { db, tx } = createMockWriteClient();
    const decidedAt = new Date("2026-04-18T01:36:00.000Z");

    vi.mocked(tx.opportunity.findFirstOrThrow).mockResolvedValue({
      id: "opp_123",
      organizationId: "org_123",
      title: "Data Platform Operations",
      description: null,
      leadAgencyId: null,
      responseDeadlineAt: null,
      solicitationNumber: null,
      naicsCode: null,
      originSourceSystem: null,
      currentStageKey: "capture_active",
      currentStageLabel: "Capture Active",
    });
    vi.mocked(tx.bidDecision.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(tx.bidDecision.create).mockResolvedValue({
      id: "decision_123",
      decisionTypeKey: "initial_pursuit",
      recommendationOutcome: "GO",
      finalOutcome: "GO",
      decidedAt,
    });

    await recordBidDecision({
      db,
      input: {
        actor,
        opportunityId: "opp_123",
        decisionTypeKey: "initial_pursuit",
        recommendedByActorType: AuditActorType.SYSTEM,
        recommendedByIdentifier: "rule_engine:default_capture_v1",
        recommendationOutcome: "GO",
        finalOutcome: "GO",
        finalRationale: "Vehicle access and incumbent story are favorable.",
        decidedAt,
      },
    });

    expect(tx.bidDecision.updateMany).toHaveBeenCalledWith({
      where: {
        organizationId: "org_123",
        opportunityId: "opp_123",
        isCurrent: true,
      },
      data: {
        isCurrent: false,
      },
    });
    expect(tx.bidDecision.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          recommendedByActorType: AuditActorType.SYSTEM,
          recommendedByUserId: null,
          recommendedByIdentifier: "rule_engine:default_capture_v1",
          decidedByUserId: "user_123",
        }),
      }),
    );
    expect(tx.opportunityActivityEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        eventType: "bid_decision_recorded",
        relatedEntityType: "bid_decision",
        title: "Bid decision recorded as GO",
      }),
      select: {
        id: true,
      },
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: AUDIT_ACTIONS.opportunityDecisionRecord,
        targetId: "opp_123",
        metadata: expect.objectContaining({
          decisionId: "decision_123",
          decisionTypeKey: "initial_pursuit",
          finalOutcome: "GO",
        }),
        occurredAt: decidedAt,
      }),
    });
  });

  it("records source import decisions and emits import audit rows", async () => {
    const { db, tx } = createMockWriteClient();
    const requestedAt = new Date("2026-04-18T01:37:00.000Z");
    const decidedAt = new Date("2026-04-18T01:38:00.000Z");

    vi.mocked(tx.sourceRecord.findFirstOrThrow).mockResolvedValue({
      id: "source_123",
      organizationId: "org_123",
      sourceRecordId: "notice-001",
      sourceSystem: "sam_gov",
    });
    vi.mocked(tx.sourceImportDecision.create).mockResolvedValue({
      id: "import_123",
      organizationId: "org_123",
      sourceRecordId: "source_123",
      targetOpportunityId: "opp_123",
      mode: "LINK_TO_EXISTING",
      status: "APPLIED",
      decidedAt,
    });

    await recordSourceImportDecision({
      db,
      input: {
        actor,
        sourceRecordId: "source_123",
        targetOpportunityId: "opp_123",
        mode: "LINK_TO_EXISTING",
        status: "APPLIED",
        requestedAt,
        decidedAt,
      },
    });

    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: AUDIT_ACTIONS.sourceImportDecisionRecord,
        targetType: "source_import_decision",
        targetId: "import_123",
        targetDisplay: "sam_gov:notice-001",
        metadata: expect.objectContaining({
          sourceExternalRecordId: "notice-001",
          sourceSystem: "sam_gov",
          targetOpportunityId: "opp_123",
          mode: "LINK_TO_EXISTING",
          status: "APPLIED",
        }),
        occurredAt: decidedAt,
      }),
    });
  });
});
