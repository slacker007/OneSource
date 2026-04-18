import { z } from "zod";

export const OPPORTUNITY_DOCUMENT_TYPE_OPTIONS = [
  "",
  "statement_of_work",
  "capture_plan",
  "qualification_brief",
  "proposal_storyboard",
  "proposal_submission",
] as const;

const opportunityDocumentSubmissionSchema = z.object({
  title: z
    .string()
    .trim()
    .max(160, "Keep the document title to 160 characters or fewer."),
  documentType: z.enum(OPPORTUNITY_DOCUMENT_TYPE_OPTIONS, {
    error: "Choose a supported document type.",
  }),
});

export type OpportunityDocumentFormValues = {
  title: string;
  documentType: (typeof OPPORTUNITY_DOCUMENT_TYPE_OPTIONS)[number];
};

export type OpportunityDocumentFormFieldName =
  | keyof OpportunityDocumentFormValues
  | "file";

export type OpportunityDocumentFormFieldErrors = Partial<
  Record<OpportunityDocumentFormFieldName, string>
>;

export type OpportunityDocumentActionState = {
  fieldErrors: OpportunityDocumentFormFieldErrors;
  formError: string | null;
  successMessage: string | null;
};

export type OpportunityDocumentSubmission = {
  documentType: string | null;
  file: File;
  title: string | null;
};

export const EMPTY_OPPORTUNITY_DOCUMENT_FORM_VALUES: OpportunityDocumentFormValues =
  {
    title: "",
    documentType: "",
  };

export const INITIAL_OPPORTUNITY_DOCUMENT_ACTION_STATE: OpportunityDocumentActionState =
  {
    fieldErrors: {},
    formError: null,
    successMessage: null,
  };

export function readOpportunityDocumentFormValues(
  input: FormData | Record<string, unknown>,
): OpportunityDocumentFormValues {
  const candidate =
    input instanceof FormData
      ? {
          title: input.get("title"),
          documentType: input.get("documentType"),
        }
      : input;

  return {
    title: readFormString(candidate.title),
    documentType: readEnumValue(
      candidate.documentType,
      EMPTY_OPPORTUNITY_DOCUMENT_FORM_VALUES.documentType,
    ),
  };
}

export function validateOpportunityDocumentFormSubmission(
  input: FormData | Record<string, unknown>,
):
  | {
      success: true;
      submission: OpportunityDocumentSubmission;
    }
  | {
      success: false;
      state: OpportunityDocumentActionState;
    } {
  const rawValues = readOpportunityDocumentFormValues(input);
  const parsed = opportunityDocumentSubmissionSchema.safeParse(rawValues);
  const file = readFileInput(input);

  const fieldErrors = parsed.success ? {} : mapFieldErrors(parsed.error.issues);

  if (!file) {
    fieldErrors.file = "Choose a file to upload.";
  } else if (file.size <= 0) {
    fieldErrors.file = "The selected file is empty.";
  }

  if (Object.keys(fieldErrors).length > 0 || !parsed.success || !file) {
    return {
      success: false,
      state: {
        fieldErrors,
        formError: "Correct the highlighted document fields before uploading.",
        successMessage: null,
      },
    };
  }

  return {
    success: true,
    submission: {
      title: toOptionalString(parsed.data.title),
      documentType: toOptionalString(parsed.data.documentType),
      file,
    },
  };
}

function mapFieldErrors(
  issues: z.ZodIssue[],
): OpportunityDocumentFormFieldErrors {
  const fieldErrors: OpportunityDocumentFormFieldErrors = {};

  for (const issue of issues) {
    const fieldName = issue.path[0];

    if (
      typeof fieldName === "string" &&
      !(fieldName in fieldErrors) &&
      fieldName in EMPTY_OPPORTUNITY_DOCUMENT_FORM_VALUES
    ) {
      fieldErrors[fieldName as keyof OpportunityDocumentFormValues] = issue.message;
    }
  }

  return fieldErrors;
}

function readFileInput(input: FormData | Record<string, unknown>) {
  if (input instanceof FormData) {
    const value = input.get("file");
    return value instanceof File ? value : null;
  }

  const candidate = input.file;
  return candidate instanceof File ? candidate : null;
}

function readFormString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function readEnumValue<TValue extends string>(
  value: unknown,
  fallbackValue: TValue,
) {
  return typeof value === "string" ? (value as TValue) : fallbackValue;
}

function toOptionalString(value: string) {
  return value.length > 0 ? value : null;
}
