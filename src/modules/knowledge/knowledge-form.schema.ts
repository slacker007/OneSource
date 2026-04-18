import { z } from "zod";

import {
  KNOWLEDGE_ASSET_TYPES,
  type KnowledgeAssetFormFieldErrors,
  type KnowledgeAssetFormValues,
} from "./knowledge.types";

const knowledgeAssetDraftValuesSchema = z.object({
  assetType: z.enum(KNOWLEDGE_ASSET_TYPES).catch("PAST_PERFORMANCE_SNIPPET"),
  title: z.string().max(160).catch(""),
  summary: z.string().max(600).catch(""),
  body: z.string().max(12000).catch(""),
  tags: z.string().max(600).catch(""),
  opportunityIds: z.array(z.string().max(120)).max(24).catch([]),
});

const knowledgeAssetSubmissionSchema = z.object({
  assetType: z.enum(KNOWLEDGE_ASSET_TYPES, {
    error: "Choose a knowledge asset type.",
  }),
  title: z
    .string()
    .trim()
    .min(3, "Enter a title with at least 3 characters.")
    .max(160, "Keep the title to 160 characters or fewer."),
  summary: z
    .string()
    .trim()
    .max(600, "Keep the summary to 600 characters or fewer."),
  body: z
    .string()
    .trim()
    .min(20, "Enter at least 20 characters of reusable knowledge content.")
    .max(12000, "Keep the body to 12000 characters or fewer."),
  tags: z
    .string()
    .trim()
    .max(600, "Keep the tags field to 600 characters or fewer."),
  opportunityIds: z
    .array(z.string().trim().min(1))
    .max(24, "Link at most 24 opportunities to one knowledge asset."),
});

export type KnowledgeAssetFormSubmission = {
  assetType: (typeof KNOWLEDGE_ASSET_TYPES)[number];
  title: string;
  summary: string | null;
  body: string;
  tags: string[];
  opportunityIds: string[];
};

export type KnowledgeAssetFormActionState = {
  fieldErrors: KnowledgeAssetFormFieldErrors;
  formError: string | null;
};

export const EMPTY_KNOWLEDGE_ASSET_FORM_VALUES: KnowledgeAssetFormValues = {
  assetType: "PAST_PERFORMANCE_SNIPPET",
  title: "",
  summary: "",
  body: "",
  tags: "",
  opportunityIds: [],
};

export const INITIAL_KNOWLEDGE_ASSET_FORM_ACTION_STATE: KnowledgeAssetFormActionState =
  {
    fieldErrors: {},
    formError: null,
  };

export function serializeKnowledgeTags(tags: string[]) {
  return tags.join(", ");
}

export function parseKnowledgeAssetDraftValues(
  input: unknown,
): KnowledgeAssetFormValues | null {
  const parsed = knowledgeAssetDraftValuesSchema.safeParse(input);

  if (!parsed.success) {
    return null;
  }

  return parsed.data;
}

export function readKnowledgeAssetFormValues(
  input: FormData | Record<string, unknown>,
): KnowledgeAssetFormValues {
  const candidate =
    input instanceof FormData
      ? {
          assetType: input.get("assetType"),
          title: input.get("title"),
          summary: input.get("summary"),
          body: input.get("body"),
          tags: input.get("tags"),
          opportunityIds: input.getAll("opportunityIds"),
        }
      : input;

  return {
    assetType: readKnowledgeAssetType(candidate.assetType),
    title: readFormString(candidate.title),
    summary: readFormString(candidate.summary),
    body: readFormString(candidate.body),
    tags: readFormString(candidate.tags),
    opportunityIds: readStringArray(candidate.opportunityIds),
  };
}

export function validateKnowledgeAssetFormSubmission(
  input: FormData | Record<string, unknown>,
):
  | {
      success: true;
      submission: KnowledgeAssetFormSubmission;
    }
  | {
      success: false;
      state: KnowledgeAssetFormActionState;
    } {
  const rawValues = readKnowledgeAssetFormValues(input);
  const parsed = knowledgeAssetSubmissionSchema.safeParse(rawValues);

  if (!parsed.success) {
    return {
      success: false,
      state: {
        fieldErrors: mapFieldErrors(parsed.error.issues),
        formError:
          "Correct the highlighted fields before saving the knowledge asset.",
      },
    };
  }

  return {
    success: true,
    submission: {
      assetType: parsed.data.assetType,
      title: parsed.data.title,
      summary: toOptionalString(parsed.data.summary),
      body: parsed.data.body,
      tags: parseKnowledgeTagsInput(parsed.data.tags),
      opportunityIds: [...new Set(parsed.data.opportunityIds)],
    },
  };
}

export function parseKnowledgeTagsInput(value: string) {
  return [...new Set(
    value
      .split(/[\n,]/)
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
  )];
}

function mapFieldErrors(
  issues: z.ZodIssue[],
): KnowledgeAssetFormFieldErrors {
  const fieldErrors: KnowledgeAssetFormFieldErrors = {};

  for (const issue of issues) {
    const fieldName = issue.path[0];

    if (
      typeof fieldName === "string" &&
      !(fieldName in fieldErrors) &&
      fieldName in EMPTY_KNOWLEDGE_ASSET_FORM_VALUES
    ) {
      fieldErrors[fieldName as keyof KnowledgeAssetFormValues] = issue.message;
    }
  }

  return fieldErrors;
}

function readKnowledgeAssetType(value: unknown) {
  return KNOWLEDGE_ASSET_TYPES.includes(value as (typeof KNOWLEDGE_ASSET_TYPES)[number])
    ? (value as (typeof KNOWLEDGE_ASSET_TYPES)[number])
    : EMPTY_KNOWLEDGE_ASSET_FORM_VALUES.assetType;
}

function readFormString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function toOptionalString(value: string) {
  return value.length > 0 ? value : null;
}
