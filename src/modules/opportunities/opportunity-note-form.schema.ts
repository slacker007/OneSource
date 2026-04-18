import { z } from "zod";

const OPPORTUNITY_NOTE_PIN_OPTIONS = ["false", "true"] as const;

const opportunityNoteSubmissionSchema = z.object({
  title: z
    .string()
    .trim()
    .max(160, "Keep the note title to 160 characters or fewer."),
  body: z
    .string()
    .trim()
    .min(3, "Enter note details with at least 3 characters.")
    .max(4000, "Keep the note details to 4000 characters or fewer."),
  isPinned: z.enum(OPPORTUNITY_NOTE_PIN_OPTIONS, {
    error: "Choose whether the note should stay pinned.",
  }),
});

export type OpportunityNoteFormValues = {
  title: string;
  body: string;
  isPinned: (typeof OPPORTUNITY_NOTE_PIN_OPTIONS)[number];
};

export type OpportunityNoteFormFieldName = keyof OpportunityNoteFormValues;

export type OpportunityNoteFormFieldErrors = Partial<
  Record<OpportunityNoteFormFieldName, string>
>;

export type OpportunityNoteActionState = {
  fieldErrors: OpportunityNoteFormFieldErrors;
  formError: string | null;
  successMessage: string | null;
};

export type OpportunityNoteSubmission = {
  title: string | null;
  body: string;
  isPinned: boolean;
};

export const EMPTY_OPPORTUNITY_NOTE_FORM_VALUES: OpportunityNoteFormValues = {
  title: "",
  body: "",
  isPinned: "false",
};

export const INITIAL_OPPORTUNITY_NOTE_ACTION_STATE: OpportunityNoteActionState =
  {
    fieldErrors: {},
    formError: null,
    successMessage: null,
  };

export function readOpportunityNoteFormValues(
  input: FormData | Record<string, unknown>,
): OpportunityNoteFormValues {
  const candidate =
    input instanceof FormData
      ? {
          title: input.get("title"),
          body: input.get("body"),
          isPinned: input.get("isPinned"),
        }
      : input;

  return {
    title: readFormString(candidate.title),
    body: readFormString(candidate.body),
    isPinned: readEnumValue(
      candidate.isPinned,
      EMPTY_OPPORTUNITY_NOTE_FORM_VALUES.isPinned,
    ),
  };
}

export function validateOpportunityNoteFormSubmission(
  input: FormData | Record<string, unknown>,
):
  | {
      success: true;
      submission: OpportunityNoteSubmission;
    }
  | {
      success: false;
      state: OpportunityNoteActionState;
    } {
  const rawValues = readOpportunityNoteFormValues(input);
  const parsed = opportunityNoteSubmissionSchema.safeParse(rawValues);

  if (!parsed.success) {
    return {
      success: false,
      state: {
        fieldErrors: mapFieldErrors(parsed.error.issues),
        formError: "Correct the highlighted note fields before saving.",
        successMessage: null,
      },
    };
  }

  return {
    success: true,
    submission: {
      title: toOptionalString(parsed.data.title),
      body: parsed.data.body,
      isPinned: parsed.data.isPinned === "true",
    },
  };
}

function mapFieldErrors(issues: z.ZodIssue[]): OpportunityNoteFormFieldErrors {
  const fieldErrors: OpportunityNoteFormFieldErrors = {};

  for (const issue of issues) {
    const fieldName = issue.path[0];

    if (
      typeof fieldName === "string" &&
      !(fieldName in fieldErrors) &&
      fieldName in EMPTY_OPPORTUNITY_NOTE_FORM_VALUES
    ) {
      fieldErrors[fieldName as OpportunityNoteFormFieldName] = issue.message;
    }
  }

  return fieldErrors;
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
