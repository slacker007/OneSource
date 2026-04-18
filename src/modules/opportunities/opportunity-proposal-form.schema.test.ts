import { describe, expect, it } from "vitest";

import {
  readOpportunityProposalFormValues,
  validateOpportunityProposalFormSubmission,
} from "./opportunity-proposal-form.schema";

describe("opportunity-proposal-form.schema", () => {
  it("reads proposal form values from repeated checkbox fields", () => {
    const formData = new FormData();

    formData.set("currentStageKey", "proposal_in_development");
    formData.set("status", "IN_REVIEW");
    formData.set("ownerUserId", "user_owner");
    formData.append(
      "complianceChecklistKeys",
      "requirement_matrix_reviewed",
    );
    formData.append("complianceChecklistKeys", "pricing_package_aligned");
    formData.append("linkedDocumentIds", "doc_1");
    formData.append("linkedDocumentIds", "doc_2");

    expect(readOpportunityProposalFormValues(formData)).toEqual({
      currentStageKey: "proposal_in_development",
      status: "IN_REVIEW",
      ownerUserId: "user_owner",
      complianceChecklistKeys: [
        "requirement_matrix_reviewed",
        "pricing_package_aligned",
      ],
      linkedDocumentIds: ["doc_1", "doc_2"],
    });
  });

  it("rejects proposal tracking before the pursuit is approved", () => {
    const result = validateOpportunityProposalFormSubmission({
      currentStageKey: "qualified",
      status: "PLANNING",
      ownerUserId: "",
      complianceChecklistKeys: [],
      linkedDocumentIds: [],
    });

    expect(result.success).toBe(false);
    expect(result.success ? null : result.state.fieldErrors.currentStageKey).toBe(
      "Proposal tracking starts only after the pursuit is approved.",
    );
  });

  it("normalizes optional owner and deduplicates repeated selections", () => {
    const result = validateOpportunityProposalFormSubmission({
      currentStageKey: "proposal_in_development",
      status: "SUBMITTED",
      ownerUserId: "",
      complianceChecklistKeys: [
        "requirement_matrix_reviewed",
        "requirement_matrix_reviewed",
        "final_compliance_review_complete",
      ],
      linkedDocumentIds: ["doc_1", "doc_1", "doc_2"],
    });

    expect(result.success).toBe(true);

    if (!result.success) {
      return;
    }

    expect(result.submission).toEqual({
      currentStageKey: "proposal_in_development",
      status: "SUBMITTED",
      ownerUserId: null,
      completedChecklistKeys: [
        "requirement_matrix_reviewed",
        "final_compliance_review_complete",
      ],
      linkedDocumentIds: ["doc_1", "doc_2"],
    });
  });
});
