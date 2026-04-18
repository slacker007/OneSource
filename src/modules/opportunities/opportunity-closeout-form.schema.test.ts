import { describe, expect, it } from "vitest";

import {
  readOpportunityCloseoutFormValues,
  validateOpportunityCloseoutFormSubmission,
} from "./opportunity-closeout-form.schema";

describe("opportunity-closeout-form.schema", () => {
  it("reads default-safe values from partial input", () => {
    expect(
      readOpportunityCloseoutFormValues({
        outcomeReason: "Documented no-bid outcome for the pursuit.",
      }),
    ).toEqual({
      currentStageKey: "",
      competitorId: "",
      outcomeReason: "Documented no-bid outcome for the pursuit.",
      lessonsLearned: "",
    });
  });

  it("validates a no-bid closeout without a competitor", () => {
    const result = validateOpportunityCloseoutFormSubmission({
      currentStageKey: "no_bid",
      competitorId: "",
      outcomeReason:
        "The team passed because customer access and vehicle positioning were both weak.",
      lessonsLearned:
        "Document the customer-access gap earlier so low-probability pursuits exit sooner.",
    });

    expect(result).toEqual({
      success: true,
      submission: {
        currentStageKey: "no_bid",
        competitorId: null,
        outcomeReason:
          "The team passed because customer access and vehicle positioning were both weak.",
        lessonsLearned:
          "Document the customer-access gap earlier so low-probability pursuits exit sooner.",
      },
    });
  });

  it("requires a competitor and closed stage for awarded or lost closeouts", () => {
    const validation = validateOpportunityCloseoutFormSubmission({
      currentStageKey: "capture_active",
      competitorId: "",
      outcomeReason: "Too short",
      lessonsLearned: "Still too short",
    });

    expect(validation).toEqual({
      success: false,
      state: {
        fieldErrors: {
          competitorId:
            "Select the competitor associated with the final outcome for awarded or lost pursuits.",
          currentStageKey:
            "Closeout notes can only be recorded after the opportunity is closed.",
          outcomeReason: "Provide a concise reason for the final outcome.",
          lessonsLearned: "Document at least one concrete lesson learned.",
        },
        formError:
          "Correct the highlighted closeout fields before recording the postmortem.",
        successMessage: null,
      },
    });

    const competitorValidation = validateOpportunityCloseoutFormSubmission({
      currentStageKey: "lost",
      competitorId: "",
      outcomeReason:
        "The incumbent preserved the relationship edge and won the final evaluation.",
      lessonsLearned:
        "Start the discriminator review earlier so the capture plan addresses evaluation risk sooner.",
    });

    expect(competitorValidation).toEqual({
      success: false,
      state: {
        fieldErrors: {
          competitorId:
            "Select the competitor associated with the final outcome for awarded or lost pursuits.",
        },
        formError:
          "Correct the highlighted closeout fields before recording the postmortem.",
        successMessage: null,
      },
    });
  });
});
