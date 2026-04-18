import { describe, expect, it } from "vitest";

import { validateOpportunityDocumentFormSubmission } from "./opportunity-document-form.schema";

describe("opportunity-document-form.schema", () => {
  it("normalizes valid document submissions", () => {
    const validation = validateOpportunityDocumentFormSubmission({
      documentType: "capture_plan",
      file: new File(["capture scope"], "capture-plan.txt", {
        type: "text/plain",
      }),
      title: "  Capture Plan  ",
    });

    expect(validation).toEqual({
      success: true,
      submission: {
        documentType: "capture_plan",
        file: expect.any(File),
        title: "Capture Plan",
      },
    });
  });

  it("returns field errors when the file is missing or metadata is invalid", () => {
    const validation = validateOpportunityDocumentFormSubmission({
      documentType: "unsupported_type",
      title:
        "A title that intentionally exceeds the allowed character count because it keeps going far beyond the one hundred and sixty character guardrail in the schema layer for uploads.",
    });

    expect(validation).toEqual({
      success: false,
      state: {
        fieldErrors: {
          documentType: "Choose a supported document type.",
          file: "Choose a file to upload.",
          title: "Keep the document title to 160 characters or fewer.",
        },
        formError: "Correct the highlighted document fields before uploading.",
        successMessage: null,
      },
    });
  });
});
