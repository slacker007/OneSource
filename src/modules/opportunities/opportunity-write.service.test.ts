import { AuditActorType } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { AUDIT_ACTIONS } from "@/modules/audit/audit.service";

import {
  createOpportunity,
  deleteOpportunity,
  recordBidDecision,
  recordSourceImportDecision,
  recordStageTransition,
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

  it("records stage transitions and audits the before and after stage state", async () => {
    const { db, tx } = createMockWriteClient();
    const transitionedAt = new Date("2026-04-18T01:35:00.000Z");

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
    });
    vi.mocked(tx.opportunity.update).mockResolvedValue({
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
    vi.mocked(tx.opportunityStageTransition.create).mockResolvedValue({
      id: "transition_123",
      transitionedAt,
      toStageKey: "capture_active",
      toStageLabel: "Capture Active",
    });

    await recordStageTransition({
      db,
      input: {
        actor,
        opportunityId: "opp_123",
        toStageKey: "capture_active",
        rationale: "Qualified after incumbent check.",
        transitionedAt,
      },
    });

    expect(tx.opportunityStageTransition.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fromStageKey: "identified",
          toStageKey: "capture_active",
          transitionedAt,
        }),
      }),
    );
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: AUDIT_ACTIONS.opportunityStageTransition,
        metadata: expect.objectContaining({
          transitionId: "transition_123",
          fromStageKey: "identified",
          toStageKey: "capture_active",
        }),
        occurredAt: transitionedAt,
      }),
    });
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
