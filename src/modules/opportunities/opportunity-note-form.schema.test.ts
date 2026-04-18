import { describe, expect, it } from "vitest";

import { validateOpportunityNoteFormSubmission } from "./opportunity-note-form.schema";

describe("opportunity-note-form.schema", () => {
  it("normalizes valid note submissions", () => {
    const validation = validateOpportunityNoteFormSubmission({
      body: "  Customer history is favorable and the mission fit remains strong.  ",
      isPinned: "true",
      title: "  Capture summary  ",
    });

    expect(validation).toEqual({
      success: true,
      submission: {
        body: "Customer history is favorable and the mission fit remains strong.",
        isPinned: true,
        title: "Capture summary",
      },
    });
  });

  it("returns field errors for invalid note content", () => {
    const validation = validateOpportunityNoteFormSubmission({
      body: "ab",
      isPinned: "false",
      title:
        "A title that is intentionally too long for the allowed note title length because it keeps going far beyond the one hundred and sixty character guardrail in the schema layer.",
    });

    expect(validation).toEqual({
      success: false,
      state: {
        fieldErrors: {
          body: "Enter note details with at least 3 characters.",
          title: "Keep the note title to 160 characters or fewer.",
        },
        formError: "Correct the highlighted note fields before saving.",
        successMessage: null,
      },
    });
  });
});
