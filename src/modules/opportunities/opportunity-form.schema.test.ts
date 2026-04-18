import { describe, expect, it } from "vitest";

import {
  buildOpportunityDraftStorageKey,
  formatOpportunityDateInputValue,
  validateOpportunityFormSubmission,
} from "./opportunity-form.schema";

describe("opportunity-form.schema", () => {
  it("parses a valid form submission into typed opportunity input", () => {
    const result = validateOpportunityFormSubmission({
      title: "  Enterprise Data Platform Operations  ",
      description: "  Capture support for a cloud operations recompete.  ",
      leadAgencyId: "agency_123",
      responseDeadlineAt: "2026-05-14",
      solicitationNumber: " SOL-2026-1042 ",
      naicsCode: "541512",
    });

    expect(result.success).toBe(true);

    if (!result.success) {
      throw new Error("Expected the opportunity form submission to parse.");
    }

    expect(result.submission).toEqual({
      title: "Enterprise Data Platform Operations",
      description: "Capture support for a cloud operations recompete.",
      leadAgencyId: "agency_123",
      responseDeadlineAt: new Date("2026-05-14T12:00:00.000Z"),
      solicitationNumber: "SOL-2026-1042",
      naicsCode: "541512",
    });
  });

  it("returns field-level validation errors for invalid values", () => {
    const result = validateOpportunityFormSubmission({
      title: "  ",
      description:
        "Opportunity summary that remains valid while other fields fail.",
      leadAgencyId: "",
      responseDeadlineAt: "2026-02-31",
      solicitationNumber: "SOL-2026-1042",
      naicsCode: "54A512",
    });

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Expected the opportunity form submission to fail.");
    }

    expect(result.state.formError).toMatch(/correct the highlighted fields/i);
    expect(result.state.fieldErrors).toMatchObject({
      title: "Enter an opportunity title with at least 3 characters.",
      responseDeadlineAt: "Enter the response deadline as a valid date.",
      naicsCode: "Enter a NAICS code using 2 to 6 digits.",
    });
  });

  it("formats helper values for browser-local draft handling", () => {
    expect(
      buildOpportunityDraftStorageKey({
        mode: "create",
      }),
    ).toBe("onesource:opportunity-form:new");
    expect(
      buildOpportunityDraftStorageKey({
        mode: "edit",
        opportunityId: "opp_123",
      }),
    ).toBe("onesource:opportunity-form:opp_123");
    expect(
      formatOpportunityDateInputValue(new Date("2026-05-14T12:00:00.000Z")),
    ).toBe("2026-05-14");
  });
});
