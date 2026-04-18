import { describe, expect, it } from "vitest";

import {
  formatOpportunityTaskDateInputValue,
  validateOpportunityTaskFormSubmission,
} from "./opportunity-task-form.schema";

describe("opportunity-task-form.schema", () => {
  it("normalizes valid task submissions", () => {
    const validation = validateOpportunityTaskFormSubmission({
      assigneeUserId: "user_123",
      description: "Coordinate the pricing assumptions with finance.",
      dueAt: "2026-05-20",
      priority: "CRITICAL",
      status: "IN_PROGRESS",
      title: "  Confirm pricing inputs  ",
    });

    expect(validation).toEqual({
      success: true,
      submission: {
        assigneeUserId: "user_123",
        description: "Coordinate the pricing assumptions with finance.",
        dueAt: new Date("2026-05-20T12:00:00.000Z"),
        priority: "CRITICAL",
        status: "IN_PROGRESS",
        title: "Confirm pricing inputs",
      },
    });
  });

  it("returns field errors for invalid date and short title values", () => {
    const validation = validateOpportunityTaskFormSubmission({
      assigneeUserId: "",
      description: "",
      dueAt: "2026-02-31",
      priority: "MEDIUM",
      status: "NOT_STARTED",
      title: "ab",
    });

    expect(validation).toEqual({
      success: false,
      state: {
        fieldErrors: {
          dueAt: "Enter the due date as a valid date.",
          title: "Enter a task title with at least 3 characters.",
        },
        formError: "Correct the highlighted task fields before saving.",
        successMessage: null,
      },
    });
  });

  it("formats due dates for date inputs", () => {
    expect(
      formatOpportunityTaskDateInputValue(new Date("2026-05-20T12:00:00.000Z")),
    ).toBe("2026-05-20");
    expect(formatOpportunityTaskDateInputValue(null)).toBe("");
  });
});
