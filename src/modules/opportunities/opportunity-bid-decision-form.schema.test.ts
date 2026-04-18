import { describe, expect, it } from "vitest";

import {
  readOpportunityBidDecisionFormValues,
  validateOpportunityBidDecisionFormSubmission,
} from "./opportunity-bid-decision-form.schema";

describe("opportunity-bid-decision-form.schema", () => {
  it("reads default-safe values from partial input", () => {
    expect(
      readOpportunityBidDecisionFormValues({
        finalRationale: "Approve pursuit with the current team shape.",
      }),
    ).toMatchObject({
      decisionTypeKey: "initial_pursuit",
      finalOutcome: "DEFER",
      finalRationale: "Approve pursuit with the current team shape.",
    });
  });

  it("validates a complete final decision submission", () => {
    const result = validateOpportunityBidDecisionFormSubmission({
      decisionTypeKey: "proposal_authorization",
      finalOutcome: "GO",
      finalRationale:
        "Proceed because the opportunity fits the portfolio and the team is staffed.",
      recommendationOutcome: "GO",
      recommendationSummary:
        "The deterministic score favors pursuit because capability fit is strong.",
      recommendationSource: "rule_engine:default_capture_v1",
      recommendedAt: "2026-04-18T07:00:00.000Z",
    });

    expect(result).toMatchObject({
      success: true,
      submission: {
        decisionTypeKey: "proposal_authorization",
        finalOutcome: "GO",
        recommendationOutcome: "GO",
        recommendationSource: "rule_engine:default_capture_v1",
      },
    });
  });

  it("rejects short decision rationale text", () => {
    const result = validateOpportunityBidDecisionFormSubmission({
      decisionTypeKey: "initial_pursuit",
      finalOutcome: "NO_GO",
      finalRationale: "Too short",
      recommendationOutcome: "DEFER",
      recommendationSummary: "",
      recommendationSource: "",
      recommendedAt: "",
    });

    expect(result).toMatchObject({
      success: false,
      state: {
        fieldErrors: {
          finalRationale:
            "Provide at least a short rationale for the final decision.",
        },
      },
    });
  });
});
