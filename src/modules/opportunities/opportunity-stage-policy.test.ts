import { describe, expect, it } from "vitest";

import {
  OpportunityStageTransitionValidationError,
  buildOpportunityStageControlSnapshot,
  validateOpportunityStageTransition,
  type OpportunityStageValidationContext,
} from "./opportunity-stage-policy";

const baseContext: OpportunityStageValidationContext = {
  bidDecisionCount: 1,
  currentBidDecisionFinalOutcome: "GO",
  currentStageKey: "capture_active",
  currentStageLabel: "Capture Active",
  documentCount: 1,
  leadAgencyId: "agency_123",
  milestoneCount: 1,
  naicsCode: "541512",
  noteCount: 1,
  responseDeadlineAt: "2026-05-20T17:00:00.000Z",
  scorecardCount: 1,
  solicitationNumber: "SOL-1",
  taskCount: 1,
};

describe("opportunity-stage-policy", () => {
  it("marks blocked transitions when their required records are missing", () => {
    const snapshot = buildOpportunityStageControlSnapshot({
      context: {
        ...baseContext,
        documentCount: 0,
      },
    });

    const proposalStage = snapshot.options.find(
      (option) => option.stageKey === "proposal_in_development",
    );

    expect(proposalStage).toMatchObject({
      isAllowed: false,
      missingRequirementLabels: ["At least one document"],
    });
  });

  it("returns a required-field snapshot for allowed transitions", () => {
    const result = validateOpportunityStageTransition({
      context: baseContext,
      rationale: "Proposal staffing and artifacts are ready for development.",
      toStageKey: "proposal_in_development",
    });

    expect(result.toStageKey).toBe("proposal_in_development");
    expect(result.requiredFieldsSnapshot).toMatchObject({
      rationaleRequired: true,
      toStageLabel: "Proposal In Development",
    });
    expect(result.requiredFieldsSnapshot.requirements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "document",
          status: "satisfied",
        }),
      ]),
    );
  });

  it("rejects invalid transitions with a validation error", () => {
    expect(() =>
      validateOpportunityStageTransition({
        context: {
          ...baseContext,
          documentCount: 0,
        },
        rationale: "Not ready yet.",
        toStageKey: "proposal_in_development",
      }),
    ).toThrow(OpportunityStageTransitionValidationError);
  });
});
