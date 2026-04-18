import { z } from "zod";

import type { OpportunityMilestoneStatus } from "./opportunity.types";

const OPPORTUNITY_MILESTONE_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const OPPORTUNITY_MILESTONE_STATUS_OPTIONS = [
  "PLANNED",
  "AT_RISK",
  "COMPLETED",
  "MISSED",
  "CANCELLED",
] as const satisfies readonly OpportunityMilestoneStatus[];

export const OPPORTUNITY_MILESTONE_TYPE_OPTIONS = [
  "bid_decision",
  "decision_checkpoint",
  "question_deadline",
  "proposal_due",
  "submission",
  "review",
  "solution_outline",
  "customer_meeting",
] as const;

const opportunityMilestoneSubmissionSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Enter a milestone title with at least 3 characters.")
      .max(160, "Keep the milestone title to 160 characters or fewer."),
    description: z
      .string()
      .trim()
      .max(4000, "Keep the milestone description to 4000 characters or fewer."),
    milestoneTypeKey: z
      .string()
      .trim()
      .max(120, "Keep the milestone type to 120 characters or fewer."),
    targetDate: z.string().trim(),
    status: z.enum(OPPORTUNITY_MILESTONE_STATUS_OPTIONS, {
      error: "Choose a valid milestone status.",
    }),
  })
  .superRefine((values, context) => {
    if (values.targetDate.length === 0) {
      context.addIssue({
        code: "custom",
        message: "Enter the milestone target date.",
        path: ["targetDate"],
      });
    }

    if (
      values.targetDate.length > 0 &&
      !OPPORTUNITY_MILESTONE_DATE_PATTERN.test(values.targetDate)
    ) {
      context.addIssue({
        code: "custom",
        message: "Enter the milestone target date as a valid date.",
        path: ["targetDate"],
      });
    }

    if (
      values.targetDate.length > 0 &&
      OPPORTUNITY_MILESTONE_DATE_PATTERN.test(values.targetDate) &&
      parseDateOnlyValue(values.targetDate) === null
    ) {
      context.addIssue({
        code: "custom",
        message: "Enter the milestone target date as a valid date.",
        path: ["targetDate"],
      });
    }
  });

export type OpportunityMilestoneFormValues = {
  title: string;
  description: string;
  milestoneTypeKey: string;
  targetDate: string;
  status: OpportunityMilestoneStatus;
};

export type OpportunityMilestoneFormFieldName =
  keyof OpportunityMilestoneFormValues;

export type OpportunityMilestoneFormFieldErrors = Partial<
  Record<OpportunityMilestoneFormFieldName, string>
>;

export type OpportunityMilestoneActionState = {
  fieldErrors: OpportunityMilestoneFormFieldErrors;
  formError: string | null;
  successMessage: string | null;
};

export type OpportunityMilestoneSubmission = {
  title: string;
  description: string | null;
  milestoneTypeKey: string | null;
  targetDate: Date;
  status: OpportunityMilestoneStatus;
};

export const EMPTY_OPPORTUNITY_MILESTONE_FORM_VALUES: OpportunityMilestoneFormValues =
  {
    title: "",
    description: "",
    milestoneTypeKey: "",
    targetDate: "",
    status: "PLANNED",
  };

export const INITIAL_OPPORTUNITY_MILESTONE_ACTION_STATE: OpportunityMilestoneActionState =
  {
    fieldErrors: {},
    formError: null,
    successMessage: null,
  };

export function readOpportunityMilestoneFormValues(
  input: FormData | Record<string, unknown>,
): OpportunityMilestoneFormValues {
  const candidate =
    input instanceof FormData
      ? {
          title: input.get("title"),
          description: input.get("description"),
          milestoneTypeKey: input.get("milestoneTypeKey"),
          targetDate: input.get("targetDate"),
          status: input.get("status"),
        }
      : input;

  return {
    title: readFormString(candidate.title),
    description: readFormString(candidate.description),
    milestoneTypeKey: readFormString(candidate.milestoneTypeKey),
    targetDate: readFormString(candidate.targetDate),
    status: readEnumValue(
      candidate.status,
      EMPTY_OPPORTUNITY_MILESTONE_FORM_VALUES.status,
    ),
  };
}

export function formatOpportunityMilestoneDateInputValue(value: Date | null) {
  if (!value) {
    return "";
  }

  return value.toISOString().slice(0, 10);
}

export function validateOpportunityMilestoneFormSubmission(
  input: FormData | Record<string, unknown>,
):
  | {
      success: true;
      submission: OpportunityMilestoneSubmission;
    }
  | {
      success: false;
      state: OpportunityMilestoneActionState;
    } {
  const rawValues = readOpportunityMilestoneFormValues(input);
  const parsed = opportunityMilestoneSubmissionSchema.safeParse(rawValues);

  if (!parsed.success) {
    return {
      success: false,
      state: {
        fieldErrors: mapFieldErrors(parsed.error.issues),
        formError: "Correct the highlighted milestone fields before saving.",
        successMessage: null,
      },
    };
  }

  return {
    success: true,
    submission: {
      title: parsed.data.title,
      description: toOptionalString(parsed.data.description),
      milestoneTypeKey: toOptionalString(parsed.data.milestoneTypeKey),
      targetDate: parseDateOnlyValue(parsed.data.targetDate) as Date,
      status: parsed.data.status,
    },
  };
}

function mapFieldErrors(
  issues: z.ZodIssue[],
): OpportunityMilestoneFormFieldErrors {
  const fieldErrors: OpportunityMilestoneFormFieldErrors = {};

  for (const issue of issues) {
    const fieldName = issue.path[0];

    if (
      typeof fieldName === "string" &&
      !(fieldName in fieldErrors) &&
      fieldName in EMPTY_OPPORTUNITY_MILESTONE_FORM_VALUES
    ) {
      fieldErrors[fieldName as OpportunityMilestoneFormFieldName] = issue.message;
    }
  }

  return fieldErrors;
}

function parseDateOnlyValue(value: string) {
  if (value.length === 0) {
    return null;
  }

  const [yearString, monthString, dayString] = value.split("-");
  const year = Number(yearString);
  const month = Number(monthString);
  const day = Number(dayString);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return null;
  }

  const parsed = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return parsed;
}

function readFormString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function readEnumValue<TValue extends string>(
  value: unknown,
  fallbackValue: TValue,
) {
  return typeof value === "string" && value.length > 0
    ? (value as TValue)
    : fallbackValue;
}

function toOptionalString(value: string) {
  return value.length > 0 ? value : null;
}
