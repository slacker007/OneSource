import { describe, expect, it } from "vitest";

import {
  formatOpportunityMilestoneDateInputValue,
  validateOpportunityMilestoneFormSubmission,
} from "./opportunity-milestone-form.schema";

describe("opportunity-milestone-form.schema", () => {
  it("normalizes valid milestone submissions", () => {
    const validation = validateOpportunityMilestoneFormSubmission({
      description: "Confirm the pursuit posture with leadership before kickoff.",
      milestoneTypeKey: "decision_checkpoint",
      status: "AT_RISK",
      targetDate: "2026-05-22",
      title: "  Capture decision checkpoint  ",
    });

    expect(validation).toEqual({
      success: true,
      submission: {
        description: "Confirm the pursuit posture with leadership before kickoff.",
        milestoneTypeKey: "decision_checkpoint",
        status: "AT_RISK",
        targetDate: new Date("2026-05-22T12:00:00.000Z"),
        title: "Capture decision checkpoint",
      },
    });
  });

  it("returns field errors for invalid date and short title values", () => {
    const validation = validateOpportunityMilestoneFormSubmission({
      description: "",
      milestoneTypeKey: "",
      status: "PLANNED",
      targetDate: "2026-02-31",
      title: "ab",
    });

    expect(validation).toEqual({
      success: false,
      state: {
        fieldErrors: {
          targetDate: "Enter the milestone target date as a valid date.",
          title: "Enter a milestone title with at least 3 characters.",
        },
        formError: "Correct the highlighted milestone fields before saving.",
        successMessage: null,
      },
    });
  });

  it("formats milestone dates for date inputs", () => {
    expect(
      formatOpportunityMilestoneDateInputValue(
        new Date("2026-05-22T12:00:00.000Z"),
      ),
    ).toBe("2026-05-22");
    expect(formatOpportunityMilestoneDateInputValue(null)).toBe("");
  });
});
