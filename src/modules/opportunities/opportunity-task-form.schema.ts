import { z } from "zod";

import type {
  OpportunityTaskPriority,
  OpportunityTaskStatus,
} from "./opportunity.types";

const OPPORTUNITY_TASK_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const OPPORTUNITY_TASK_STATUS_OPTIONS = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "BLOCKED",
  "COMPLETED",
  "CANCELLED",
] as const satisfies readonly OpportunityTaskStatus[];

export const OPPORTUNITY_TASK_PRIORITY_OPTIONS = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
] as const satisfies readonly OpportunityTaskPriority[];

const opportunityTaskSubmissionSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Enter a task title with at least 3 characters.")
      .max(160, "Keep the task title to 160 characters or fewer."),
    description: z
      .string()
      .trim()
      .max(4000, "Keep the task description to 4000 characters or fewer."),
    assigneeUserId: z
      .string()
      .trim()
      .max(120, "Assignee selection is too long."),
    dueAt: z.string().trim(),
    status: z.enum(OPPORTUNITY_TASK_STATUS_OPTIONS, {
      error: "Choose a valid task status.",
    }),
    priority: z.enum(OPPORTUNITY_TASK_PRIORITY_OPTIONS, {
      error: "Choose a valid task priority.",
    }),
  })
  .superRefine((values, context) => {
    if (
      values.dueAt.length > 0 &&
      !OPPORTUNITY_TASK_DATE_PATTERN.test(values.dueAt)
    ) {
      context.addIssue({
        code: "custom",
        message: "Enter the due date as a valid date.",
        path: ["dueAt"],
      });
    }

    if (
      values.dueAt.length > 0 &&
      OPPORTUNITY_TASK_DATE_PATTERN.test(values.dueAt) &&
      parseDateOnlyValue(values.dueAt) === null
    ) {
      context.addIssue({
        code: "custom",
        message: "Enter the due date as a valid date.",
        path: ["dueAt"],
      });
    }
  });

export type OpportunityTaskFormValues = {
  title: string;
  description: string;
  assigneeUserId: string;
  dueAt: string;
  status: OpportunityTaskStatus;
  priority: OpportunityTaskPriority;
};

export type OpportunityTaskFormFieldName = keyof OpportunityTaskFormValues;

export type OpportunityTaskFormFieldErrors = Partial<
  Record<OpportunityTaskFormFieldName, string>
>;

export type OpportunityTaskActionState = {
  fieldErrors: OpportunityTaskFormFieldErrors;
  formError: string | null;
  successMessage: string | null;
};

export type OpportunityTaskSubmission = {
  assigneeUserId: string | null;
  description: string | null;
  dueAt: Date | null;
  priority: OpportunityTaskPriority;
  status: OpportunityTaskStatus;
  title: string;
};

export const EMPTY_OPPORTUNITY_TASK_FORM_VALUES: OpportunityTaskFormValues = {
  title: "",
  description: "",
  assigneeUserId: "",
  dueAt: "",
  status: "NOT_STARTED",
  priority: "MEDIUM",
};

export const INITIAL_OPPORTUNITY_TASK_ACTION_STATE: OpportunityTaskActionState =
  {
    fieldErrors: {},
    formError: null,
    successMessage: null,
  };

export function readOpportunityTaskFormValues(
  input: FormData | Record<string, unknown>,
): OpportunityTaskFormValues {
  const candidate =
    input instanceof FormData
      ? {
          title: input.get("title"),
          description: input.get("description"),
          assigneeUserId: input.get("assigneeUserId"),
          dueAt: input.get("dueAt"),
          status: input.get("status"),
          priority: input.get("priority"),
        }
      : input;

  return {
    title: readFormString(candidate.title),
    description: readFormString(candidate.description),
    assigneeUserId: readFormString(candidate.assigneeUserId),
    dueAt: readFormString(candidate.dueAt),
    status: readEnumValue(
      candidate.status,
      EMPTY_OPPORTUNITY_TASK_FORM_VALUES.status,
    ),
    priority: readEnumValue(
      candidate.priority,
      EMPTY_OPPORTUNITY_TASK_FORM_VALUES.priority,
    ),
  };
}

export function formatOpportunityTaskDateInputValue(value: Date | null) {
  if (!value) {
    return "";
  }

  return value.toISOString().slice(0, 10);
}

export function validateOpportunityTaskFormSubmission(
  input: FormData | Record<string, unknown>,
):
  | {
      success: true;
      submission: OpportunityTaskSubmission;
    }
  | {
      success: false;
      state: OpportunityTaskActionState;
    } {
  const rawValues = readOpportunityTaskFormValues(input);
  const parsed = opportunityTaskSubmissionSchema.safeParse(rawValues);

  if (!parsed.success) {
    return {
      success: false,
      state: {
        fieldErrors: mapFieldErrors(parsed.error.issues),
        formError: "Correct the highlighted task fields before saving.",
        successMessage: null,
      },
    };
  }

  return {
    success: true,
    submission: {
      title: parsed.data.title,
      description: toOptionalString(parsed.data.description),
      assigneeUserId: toOptionalString(parsed.data.assigneeUserId),
      dueAt: parseDateOnlyValue(parsed.data.dueAt),
      status: parsed.data.status,
      priority: parsed.data.priority,
    },
  };
}

function mapFieldErrors(
  issues: z.ZodIssue[],
): OpportunityTaskFormFieldErrors {
  const fieldErrors: OpportunityTaskFormFieldErrors = {};

  for (const issue of issues) {
    const fieldName = issue.path[0];

    if (
      typeof fieldName === "string" &&
      !(fieldName in fieldErrors) &&
      fieldName in EMPTY_OPPORTUNITY_TASK_FORM_VALUES
    ) {
      fieldErrors[fieldName as OpportunityTaskFormFieldName] = issue.message;
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
