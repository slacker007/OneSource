import { z } from "zod";

import {
  OPPORTUNITY_PROPOSAL_CHECKLIST_ITEMS,
  OPPORTUNITY_PROPOSAL_STATUSES,
  canTrackProposalForStage,
  type OpportunityProposalChecklistKey,
  type OpportunityProposalStatus,
} from "./opportunity-proposal";

const opportunityProposalSubmissionSchema = z
  .object({
    currentStageKey: z.string().trim().min(1),
    status: z.enum(OPPORTUNITY_PROPOSAL_STATUSES, {
      error: "Choose a proposal status.",
    }),
    ownerUserId: z.string().trim().max(191),
    complianceChecklistKeys: z.array(
      z.enum(
        OPPORTUNITY_PROPOSAL_CHECKLIST_ITEMS.map(
          (item) => item.key,
        ) as unknown as [OpportunityProposalChecklistKey, ...OpportunityProposalChecklistKey[]],
      ),
    ),
    linkedDocumentIds: z
      .array(z.string().trim().min(1).max(191))
      .max(24, "Link at most 24 documents to one proposal record."),
  })
  .superRefine((value, context) => {
    if (!canTrackProposalForStage(value.currentStageKey)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Proposal tracking starts only after the pursuit is approved.",
        path: ["currentStageKey"],
      });
    }
  });

export type OpportunityProposalFormValues = {
  currentStageKey: string;
  status: OpportunityProposalStatus;
  ownerUserId: string;
  complianceChecklistKeys: OpportunityProposalChecklistKey[];
  linkedDocumentIds: string[];
};

export type OpportunityProposalFormFieldName =
  keyof OpportunityProposalFormValues;

export type OpportunityProposalFormFieldErrors = Partial<
  Record<OpportunityProposalFormFieldName, string>
>;

export type OpportunityProposalActionState = {
  fieldErrors: OpportunityProposalFormFieldErrors;
  formError: string | null;
  successMessage: string | null;
};

export type OpportunityProposalSubmission = {
  completedChecklistKeys: OpportunityProposalChecklistKey[];
  currentStageKey: string;
  linkedDocumentIds: string[];
  ownerUserId: string | null;
  status: OpportunityProposalStatus;
};

export const EMPTY_OPPORTUNITY_PROPOSAL_FORM_VALUES: OpportunityProposalFormValues =
  {
    currentStageKey: "",
    status: "PLANNING",
    ownerUserId: "",
    complianceChecklistKeys: [],
    linkedDocumentIds: [],
  };

export const INITIAL_OPPORTUNITY_PROPOSAL_ACTION_STATE: OpportunityProposalActionState =
  {
    fieldErrors: {},
    formError: null,
    successMessage: null,
  };

export function readOpportunityProposalFormValues(
  input: FormData | Record<string, unknown>,
): OpportunityProposalFormValues {
  const candidate =
    input instanceof FormData
      ? {
          currentStageKey: input.get("currentStageKey"),
          status: input.get("status"),
          ownerUserId: input.get("ownerUserId"),
          complianceChecklistKeys: input.getAll("complianceChecklistKeys"),
          linkedDocumentIds: input.getAll("linkedDocumentIds"),
        }
      : input;

  return {
    currentStageKey: readFormString(candidate.currentStageKey),
    status: readProposalStatus(candidate.status),
    ownerUserId: readFormString(candidate.ownerUserId),
    complianceChecklistKeys: readChecklistKeyArray(
      candidate.complianceChecklistKeys,
    ),
    linkedDocumentIds: readStringArray(candidate.linkedDocumentIds),
  };
}

export function validateOpportunityProposalFormSubmission(
  input: FormData | Record<string, unknown>,
):
  | {
      success: true;
      submission: OpportunityProposalSubmission;
    }
  | {
      success: false;
      state: OpportunityProposalActionState;
    } {
  const rawValues = readOpportunityProposalFormValues(input);
  const parsed = opportunityProposalSubmissionSchema.safeParse(rawValues);

  if (!parsed.success) {
    return {
      success: false,
      state: {
        fieldErrors: mapFieldErrors(parsed.error.issues),
        formError:
          "Correct the highlighted proposal fields before saving the proposal record.",
        successMessage: null,
      },
    };
  }

  return {
    success: true,
    submission: {
      completedChecklistKeys: [
        ...new Set(parsed.data.complianceChecklistKeys),
      ] as OpportunityProposalChecklistKey[],
      currentStageKey: parsed.data.currentStageKey,
      linkedDocumentIds: [...new Set(parsed.data.linkedDocumentIds)],
      ownerUserId: toOptionalString(parsed.data.ownerUserId),
      status: parsed.data.status,
    },
  };
}

function mapFieldErrors(issues: z.ZodIssue[]): OpportunityProposalFormFieldErrors {
  const fieldErrors: OpportunityProposalFormFieldErrors = {};

  for (const issue of issues) {
    const fieldName = issue.path[0];

    if (
      typeof fieldName === "string" &&
      !(fieldName in fieldErrors) &&
      fieldName in EMPTY_OPPORTUNITY_PROPOSAL_FORM_VALUES
    ) {
      fieldErrors[fieldName as OpportunityProposalFormFieldName] = issue.message;
    }
  }

  return fieldErrors;
}

function readProposalStatus(value: unknown): OpportunityProposalStatus {
  return OPPORTUNITY_PROPOSAL_STATUSES.includes(
    value as OpportunityProposalStatus,
  )
    ? (value as OpportunityProposalStatus)
    : EMPTY_OPPORTUNITY_PROPOSAL_FORM_VALUES.status;
}

function readChecklistKeyArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is OpportunityProposalChecklistKey =>
    OPPORTUNITY_PROPOSAL_CHECKLIST_ITEMS.some((checklistItem) => checklistItem.key === item),
  );
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function readFormString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function toOptionalString(value: string) {
  return value.length > 0 ? value : null;
}
