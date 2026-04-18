import { z } from "zod";

import type { BidDecisionOutcome } from "./opportunity.types";

export const OPPORTUNITY_BID_DECISION_TYPE_OPTIONS = [
  "initial_pursuit",
  "qualification_review",
  "executive_review",
  "capture_reassessment",
  "proposal_authorization",
  "submit_authorization",
] as const;

export const OPPORTUNITY_BID_DECISION_OUTCOME_OPTIONS = [
  "GO",
  "DEFER",
  "NO_GO",
] as const satisfies readonly BidDecisionOutcome[];

const opportunityBidDecisionSubmissionSchema = z.object({
  decisionTypeKey: z
    .string()
    .trim()
    .min(1, "Choose the decision checkpoint for this entry.")
    .max(120, "Keep the decision checkpoint to 120 characters or fewer."),
  finalOutcome: z.enum(OPPORTUNITY_BID_DECISION_OUTCOME_OPTIONS, {
    error: "Choose a valid final decision outcome.",
  }),
  finalRationale: z
    .string()
    .trim()
    .min(12, "Provide at least a short rationale for the final decision.")
    .max(4000, "Keep the decision rationale to 4000 characters or fewer."),
  recommendationOutcome: z.string().trim().max(20),
  recommendationSummary: z.string().trim().max(4000),
  recommendationSource: z.string().trim().max(160),
  recommendedAt: z.string().trim().max(64),
});

export type OpportunityBidDecisionFormValues = {
  decisionTypeKey: string;
  finalOutcome: BidDecisionOutcome;
  finalRationale: string;
  recommendationOutcome: string;
  recommendationSummary: string;
  recommendationSource: string;
  recommendedAt: string;
};

export type OpportunityBidDecisionFormFieldName =
  keyof OpportunityBidDecisionFormValues;

export type OpportunityBidDecisionFormFieldErrors = Partial<
  Record<OpportunityBidDecisionFormFieldName, string>
>;

export type OpportunityBidDecisionActionState = {
  fieldErrors: OpportunityBidDecisionFormFieldErrors;
  formError: string | null;
  successMessage: string | null;
};

export type OpportunityBidDecisionSubmission = {
  decisionTypeKey: string;
  finalOutcome: BidDecisionOutcome;
  finalRationale: string;
  recommendationOutcome: BidDecisionOutcome | null;
  recommendationSummary: string | null;
  recommendationSource: string | null;
  recommendedAt: Date | null;
};

export const EMPTY_OPPORTUNITY_BID_DECISION_FORM_VALUES: OpportunityBidDecisionFormValues =
  {
    decisionTypeKey: "initial_pursuit",
    finalOutcome: "DEFER",
    finalRationale: "",
    recommendationOutcome: "",
    recommendationSummary: "",
    recommendationSource: "",
    recommendedAt: "",
  };

export const INITIAL_OPPORTUNITY_BID_DECISION_ACTION_STATE: OpportunityBidDecisionActionState =
  {
    fieldErrors: {},
    formError: null,
    successMessage: null,
  };

export function readOpportunityBidDecisionFormValues(
  input: FormData | Record<string, unknown>,
): OpportunityBidDecisionFormValues {
  const candidate =
    input instanceof FormData
      ? {
          decisionTypeKey: input.get("decisionTypeKey"),
          finalOutcome: input.get("finalOutcome"),
          finalRationale: input.get("finalRationale"),
          recommendationOutcome: input.get("recommendationOutcome"),
          recommendationSummary: input.get("recommendationSummary"),
          recommendationSource: input.get("recommendationSource"),
          recommendedAt: input.get("recommendedAt"),
        }
      : input;

  return {
    decisionTypeKey: readEnumValue(
      candidate.decisionTypeKey,
      EMPTY_OPPORTUNITY_BID_DECISION_FORM_VALUES.decisionTypeKey,
    ),
    finalOutcome: readEnumValue(
      candidate.finalOutcome,
      EMPTY_OPPORTUNITY_BID_DECISION_FORM_VALUES.finalOutcome,
    ),
    finalRationale: readFormString(candidate.finalRationale),
    recommendationOutcome: readFormString(candidate.recommendationOutcome),
    recommendationSummary: readFormString(candidate.recommendationSummary),
    recommendationSource: readFormString(candidate.recommendationSource),
    recommendedAt: readFormString(candidate.recommendedAt),
  };
}

export function validateOpportunityBidDecisionFormSubmission(
  input: FormData | Record<string, unknown>,
):
  | {
      success: true;
      submission: OpportunityBidDecisionSubmission;
    }
  | {
      success: false;
      state: OpportunityBidDecisionActionState;
    } {
  const rawValues = readOpportunityBidDecisionFormValues(input);
  const parsed = opportunityBidDecisionSubmissionSchema.safeParse(rawValues);

  if (!parsed.success) {
    return {
      success: false,
      state: {
        fieldErrors: mapFieldErrors(parsed.error.issues),
        formError:
          "Correct the highlighted decision fields before recording the final outcome.",
        successMessage: null,
      },
    };
  }

  return {
    success: true,
    submission: {
      decisionTypeKey: parsed.data.decisionTypeKey,
      finalOutcome: parsed.data.finalOutcome,
      finalRationale: parsed.data.finalRationale,
      recommendationOutcome: toOptionalOutcome(parsed.data.recommendationOutcome),
      recommendationSummary: toOptionalString(parsed.data.recommendationSummary),
      recommendationSource: toOptionalString(parsed.data.recommendationSource),
      recommendedAt: parseDateTimeValue(parsed.data.recommendedAt),
    },
  };
}

function mapFieldErrors(
  issues: z.ZodIssue[],
): OpportunityBidDecisionFormFieldErrors {
  const fieldErrors: OpportunityBidDecisionFormFieldErrors = {};

  for (const issue of issues) {
    const fieldName = issue.path[0];

    if (
      typeof fieldName === "string" &&
      !(fieldName in fieldErrors) &&
      fieldName in EMPTY_OPPORTUNITY_BID_DECISION_FORM_VALUES
    ) {
      fieldErrors[fieldName as OpportunityBidDecisionFormFieldName] =
        issue.message;
    }
  }

  return fieldErrors;
}

function parseDateTimeValue(value: string) {
  if (value.length === 0) {
    return null;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
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

function toOptionalOutcome(value: string): BidDecisionOutcome | null {
  return OPPORTUNITY_BID_DECISION_OUTCOME_OPTIONS.includes(
    value as BidDecisionOutcome,
  )
    ? (value as BidDecisionOutcome)
    : null;
}
