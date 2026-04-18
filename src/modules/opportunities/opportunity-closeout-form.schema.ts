import { z } from "zod";

const CLOSED_STAGE_KEYS = ["awarded", "lost", "no_bid"] as const;

const opportunityCloseoutSubmissionSchema = z
  .object({
    currentStageKey: z.string().trim().min(1),
    competitorId: z.string().trim().max(191),
    outcomeReason: z
      .string()
      .trim()
      .min(12, "Provide a concise reason for the final outcome.")
      .max(4000, "Keep the outcome reason to 4000 characters or fewer."),
    lessonsLearned: z
      .string()
      .trim()
      .min(16, "Document at least one concrete lesson learned.")
      .max(6000, "Keep lessons learned to 6000 characters or fewer."),
  })
  .superRefine((value, context) => {
    if (!CLOSED_STAGE_KEYS.includes(value.currentStageKey as (typeof CLOSED_STAGE_KEYS)[number])) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Closeout notes can only be recorded after the opportunity is closed.",
        path: ["currentStageKey"],
      });
    }

    if (value.currentStageKey !== "no_bid" && value.competitorId.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Select the competitor associated with the final outcome for awarded or lost pursuits.",
        path: ["competitorId"],
      });
    }
  });

export type OpportunityCloseoutFormValues = {
  currentStageKey: string;
  competitorId: string;
  outcomeReason: string;
  lessonsLearned: string;
};

export type OpportunityCloseoutFormFieldName = keyof OpportunityCloseoutFormValues;

export type OpportunityCloseoutFormFieldErrors = Partial<
  Record<OpportunityCloseoutFormFieldName, string>
>;

export type OpportunityCloseoutActionState = {
  fieldErrors: OpportunityCloseoutFormFieldErrors;
  formError: string | null;
  successMessage: string | null;
};

export type OpportunityCloseoutSubmission = {
  competitorId: string | null;
  currentStageKey: string;
  lessonsLearned: string;
  outcomeReason: string;
};

export const EMPTY_OPPORTUNITY_CLOSEOUT_FORM_VALUES: OpportunityCloseoutFormValues =
  {
    currentStageKey: "",
    competitorId: "",
    outcomeReason: "",
    lessonsLearned: "",
  };

export const INITIAL_OPPORTUNITY_CLOSEOUT_ACTION_STATE: OpportunityCloseoutActionState =
  {
    fieldErrors: {},
    formError: null,
    successMessage: null,
  };

export function readOpportunityCloseoutFormValues(
  input: FormData | Record<string, unknown>,
): OpportunityCloseoutFormValues {
  const candidate =
    input instanceof FormData
      ? {
          currentStageKey: input.get("currentStageKey"),
          competitorId: input.get("competitorId"),
          outcomeReason: input.get("outcomeReason"),
          lessonsLearned: input.get("lessonsLearned"),
        }
      : input;

  return {
    currentStageKey: readFormString(candidate.currentStageKey),
    competitorId: readFormString(candidate.competitorId),
    outcomeReason: readFormString(candidate.outcomeReason),
    lessonsLearned: readFormString(candidate.lessonsLearned),
  };
}

export function validateOpportunityCloseoutFormSubmission(
  input: FormData | Record<string, unknown>,
):
  | {
      success: true;
      submission: OpportunityCloseoutSubmission;
    }
  | {
      success: false;
      state: OpportunityCloseoutActionState;
    } {
  const rawValues = readOpportunityCloseoutFormValues(input);
  const parsed = opportunityCloseoutSubmissionSchema.safeParse(rawValues);

  if (!parsed.success) {
    return {
      success: false,
      state: {
        fieldErrors: mapFieldErrors(parsed.error.issues),
        formError:
          "Correct the highlighted closeout fields before recording the postmortem.",
        successMessage: null,
      },
    };
  }

  return {
    success: true,
    submission: {
      competitorId: toOptionalString(parsed.data.competitorId),
      currentStageKey: parsed.data.currentStageKey,
      lessonsLearned: parsed.data.lessonsLearned,
      outcomeReason: parsed.data.outcomeReason,
    },
  };
}

function mapFieldErrors(issues: z.ZodIssue[]): OpportunityCloseoutFormFieldErrors {
  const fieldErrors: OpportunityCloseoutFormFieldErrors = {};

  for (const issue of issues) {
    const fieldName = issue.path[0];

    if (
      typeof fieldName === "string" &&
      !(fieldName in fieldErrors) &&
      fieldName in EMPTY_OPPORTUNITY_CLOSEOUT_FORM_VALUES
    ) {
      fieldErrors[fieldName as OpportunityCloseoutFormFieldName] = issue.message;
    }
  }

  return fieldErrors;
}

function readFormString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function toOptionalString(value: string) {
  return value.length > 0 ? value : null;
}
