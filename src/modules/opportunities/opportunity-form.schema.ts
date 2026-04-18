import { z } from "zod";

import type {
  OpportunityFormFieldErrors,
  OpportunityFormMode,
  OpportunityFormValues,
} from "./opportunity.types";

const OPPORTUNITY_FORM_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const OPPORTUNITY_FORM_NAICS_PATTERN = /^\d{2,6}$/;

const opportunityDraftValuesSchema = z.object({
  title: z.string().max(160).catch(""),
  description: z.string().max(4000).catch(""),
  leadAgencyId: z.string().max(120).catch(""),
  responseDeadlineAt: z.string().max(32).catch(""),
  solicitationNumber: z.string().max(80).catch(""),
  naicsCode: z.string().max(6).catch(""),
});

const opportunitySubmissionSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Enter an opportunity title with at least 3 characters.")
      .max(160, "Keep the title to 160 characters or fewer."),
    description: z
      .string()
      .trim()
      .max(4000, "Keep the description to 4000 characters or fewer."),
    leadAgencyId: z
      .string()
      .trim()
      .max(120, "Lead agency selection is too long."),
    responseDeadlineAt: z.string().trim(),
    solicitationNumber: z
      .string()
      .trim()
      .max(80, "Keep the solicitation number to 80 characters or fewer."),
    naicsCode: z.string().trim().max(6, "NAICS codes can be at most 6 digits."),
  })
  .superRefine((values, context) => {
    if (
      values.responseDeadlineAt.length > 0 &&
      !OPPORTUNITY_FORM_DATE_PATTERN.test(values.responseDeadlineAt)
    ) {
      context.addIssue({
        code: "custom",
        message: "Enter the response deadline as a valid date.",
        path: ["responseDeadlineAt"],
      });
    }

    if (
      values.responseDeadlineAt.length > 0 &&
      OPPORTUNITY_FORM_DATE_PATTERN.test(values.responseDeadlineAt) &&
      parseDateOnlyValue(values.responseDeadlineAt) === null
    ) {
      context.addIssue({
        code: "custom",
        message: "Enter the response deadline as a valid date.",
        path: ["responseDeadlineAt"],
      });
    }

    if (
      values.naicsCode.length > 0 &&
      !OPPORTUNITY_FORM_NAICS_PATTERN.test(values.naicsCode)
    ) {
      context.addIssue({
        code: "custom",
        message: "Enter a NAICS code using 2 to 6 digits.",
        path: ["naicsCode"],
      });
    }
  });

export type OpportunityFormSubmission = {
  title: string;
  description: string | null;
  leadAgencyId: string | null;
  responseDeadlineAt: Date | null;
  solicitationNumber: string | null;
  naicsCode: string | null;
};

export type OpportunityFormActionState = {
  fieldErrors: OpportunityFormFieldErrors;
  formError: string | null;
};

export const EMPTY_OPPORTUNITY_FORM_VALUES: OpportunityFormValues = {
  title: "",
  description: "",
  leadAgencyId: "",
  responseDeadlineAt: "",
  solicitationNumber: "",
  naicsCode: "",
};

export const INITIAL_OPPORTUNITY_FORM_ACTION_STATE: OpportunityFormActionState =
  {
    fieldErrors: {},
    formError: null,
  };

export function buildOpportunityDraftStorageKey({
  mode,
  opportunityId,
}: {
  mode: OpportunityFormMode;
  opportunityId?: string | null;
}) {
  if (mode === "edit" && opportunityId) {
    return `onesource:opportunity-form:${opportunityId}`;
  }

  return "onesource:opportunity-form:new";
}

export function formatOpportunityDateInputValue(value: Date | null) {
  if (!value) {
    return "";
  }

  return value.toISOString().slice(0, 10);
}

export function parseOpportunityDraftValues(
  input: unknown,
): OpportunityFormValues | null {
  const parsed = opportunityDraftValuesSchema.safeParse(input);

  if (!parsed.success) {
    return null;
  }

  return parsed.data;
}

export function readOpportunityFormValues(
  input: FormData | Record<string, unknown>,
): OpportunityFormValues {
  const candidate =
    input instanceof FormData
      ? {
          title: input.get("title"),
          description: input.get("description"),
          leadAgencyId: input.get("leadAgencyId"),
          responseDeadlineAt: input.get("responseDeadlineAt"),
          solicitationNumber: input.get("solicitationNumber"),
          naicsCode: input.get("naicsCode"),
        }
      : input;

  return {
    title: readFormString(candidate.title),
    description: readFormString(candidate.description),
    leadAgencyId: readFormString(candidate.leadAgencyId),
    responseDeadlineAt: readFormString(candidate.responseDeadlineAt),
    solicitationNumber: readFormString(candidate.solicitationNumber),
    naicsCode: readFormString(candidate.naicsCode),
  };
}

export function validateOpportunityFormSubmission(
  input: FormData | Record<string, unknown>,
):
  | {
      success: true;
      submission: OpportunityFormSubmission;
    }
  | {
      success: false;
      state: OpportunityFormActionState;
    } {
  const rawValues = readOpportunityFormValues(input);
  const parsed = opportunitySubmissionSchema.safeParse(rawValues);

  if (!parsed.success) {
    return {
      success: false,
      state: {
        fieldErrors: mapFieldErrors(parsed.error.issues),
        formError: "Correct the highlighted fields before saving the opportunity.",
      },
    };
  }

  return {
    success: true,
    submission: {
      title: parsed.data.title,
      description: toOptionalString(parsed.data.description),
      leadAgencyId: toOptionalString(parsed.data.leadAgencyId),
      responseDeadlineAt: parseDateOnlyValue(parsed.data.responseDeadlineAt),
      solicitationNumber: toOptionalString(parsed.data.solicitationNumber),
      naicsCode: toOptionalString(parsed.data.naicsCode),
    },
  };
}

function mapFieldErrors(
  issues: z.ZodIssue[],
): OpportunityFormFieldErrors {
  const fieldErrors: OpportunityFormFieldErrors = {};

  for (const issue of issues) {
    const fieldName = issue.path[0];

    if (
      typeof fieldName === "string" &&
      !(fieldName in fieldErrors) &&
      fieldName in EMPTY_OPPORTUNITY_FORM_VALUES
    ) {
      fieldErrors[fieldName as keyof OpportunityFormValues] = issue.message;
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

function toOptionalString(value: string) {
  return value.length > 0 ? value : null;
}
