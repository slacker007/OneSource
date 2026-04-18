"use client";

import Link from "next/link";
import {
  useActionState,
  useState,
  type ChangeEvent,
} from "react";

import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  INITIAL_KNOWLEDGE_ASSET_FORM_ACTION_STATE,
  type KnowledgeAssetFormActionState,
} from "@/modules/knowledge/knowledge-form.schema";
import {
  KNOWLEDGE_ASSET_TYPE_LABELS,
  KNOWLEDGE_ASSET_TYPES,
  type KnowledgeAssetFormFieldName,
  type KnowledgeAssetFormSnapshot,
} from "@/modules/knowledge/knowledge.types";

type KnowledgeFormProps = {
  action: (
    state: KnowledgeAssetFormActionState,
    formData: FormData,
  ) => Promise<KnowledgeAssetFormActionState>;
  deleteAction?: (formData: FormData) => Promise<void>;
  feedback:
    | {
        tone: "accent" | "warning";
        title: string;
        message: string;
      }
    | null;
  snapshot: KnowledgeAssetFormSnapshot;
};

export function KnowledgeForm({
  action,
  deleteAction,
  feedback,
  snapshot,
}: KnowledgeFormProps) {
  const [formState, formAction, isPending] = useActionState(
    action,
    INITIAL_KNOWLEDGE_ASSET_FORM_ACTION_STATE,
  );
  const [values, setValues] = useState(snapshot.initialValues);

  function handleChange(
    event:
      | ChangeEvent<HTMLInputElement>
      | ChangeEvent<HTMLSelectElement>
      | ChangeEvent<HTMLTextAreaElement>,
  ) {
    const field = event.target.name as KnowledgeAssetFormFieldName;
    const nextValue = event.target.value;

    setValues((currentValues) => ({
      ...currentValues,
      [field]: nextValue,
    }));
  }

  function handleOpportunityToggle(opportunityId: string, checked: boolean) {
    setValues((currentValues) => ({
      ...currentValues,
      opportunityIds: checked
        ? [...currentValues.opportunityIds, opportunityId]
        : currentValues.opportunityIds.filter((value) => value !== opportunityId),
    }));
  }

  const modeLabel =
    snapshot.mode === "create" ? "Create knowledge asset" : "Edit knowledge asset";

  return (
    <section className="space-y-6">
      <header className="border-border bg-surface rounded-[28px] border px-6 py-6 shadow-[0_16px_40px_rgba(20,37,34,0.08)] sm:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge>{modeLabel}</Badge>
              <Badge tone="muted">
                {KNOWLEDGE_ASSET_TYPE_LABELS[values.assetType]}
              </Badge>
              <Badge tone="warning">
                {values.opportunityIds.length === 1
                  ? "1 linked pursuit"
                  : `${values.opportunityIds.length} linked pursuits`}
              </Badge>
            </div>
            <h1 className="font-heading text-foreground text-4xl font-semibold tracking-[-0.04em]">
              {snapshot.mode === "create"
                ? "Capture reusable knowledge"
                : values.title || "Edit reusable knowledge"}
            </h1>
            <p className="text-muted max-w-3xl text-sm leading-7">
              Use this form to store reusable content and tie it directly to the
              pursuits where the team already knows it is relevant.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryCard
              label="Workspace"
              supportingText="Organization-scoped knowledge library"
              value={snapshot.organization.name}
            />
            <SummaryCard
              label="Status"
              supportingText={
                snapshot.updatedAt
                  ? `Last saved ${formatUtcDate(snapshot.updatedAt)}`
                  : "This asset has not been saved yet"
              }
              value={isPending ? "Saving..." : "Ready"}
            />
            <SummaryCard
              label="Opportunity links"
              supportingText="Selected tracked pursuits"
              value={String(values.opportunityIds.length)}
            />
          </div>
        </div>
      </header>

      {feedback ? (
        <Banner
          message={feedback.message}
          title={feedback.title}
          tone={feedback.tone}
        />
      ) : null}

      {formState.formError ? (
        <Banner
          message={formState.formError}
          title="Knowledge asset needs attention"
          tone="danger"
        />
      ) : null}

      <form action={formAction} className="space-y-6">
        {snapshot.assetId ? (
          <input name="knowledgeAssetId" type="hidden" value={snapshot.assetId} />
        ) : null}

        <section className="border-border bg-surface rounded-[32px] border px-6 py-6 shadow-[0_20px_60px_rgba(20,37,34,0.08)] sm:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-muted text-xs tracking-[0.24em] uppercase">
                Asset details
              </p>
              <h2 className="font-heading text-foreground mt-2 text-2xl font-semibold tracking-[-0.03em]">
                Validation-backed reusable content
              </h2>
            </div>

            <Link
              className="text-sm font-medium text-[rgb(19,78,68)] underline-offset-4 hover:underline"
              href="/knowledge"
            >
              Return to library
            </Link>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <FormField
              error={formState.fieldErrors.assetType}
              htmlFor="knowledge-asset-type"
              label="Knowledge asset type"
            >
              <Select
                id="knowledge-asset-type"
                name="assetType"
                onChange={handleChange}
                value={values.assetType}
              >
                {KNOWLEDGE_ASSET_TYPES.map((assetType) => (
                  <option key={assetType} value={assetType}>
                    {KNOWLEDGE_ASSET_TYPE_LABELS[assetType]}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              error={formState.fieldErrors.title}
              htmlFor="knowledge-title"
              label="Asset title"
            >
              <Input
                id="knowledge-title"
                name="title"
                onChange={handleChange}
                placeholder="Air Force operational planning accelerator"
                value={values.title}
              />
            </FormField>

            <FormField
              className="lg:col-span-2"
              error={formState.fieldErrors.summary}
              hint="Optional short summary shown in the browse table."
              htmlFor="knowledge-summary"
              label="Summary"
            >
              <Textarea
                id="knowledge-summary"
                name="summary"
                onChange={handleChange}
                rows={4}
                value={values.summary}
              />
            </FormField>

            <FormField
              className="lg:col-span-2"
              error={formState.fieldErrors.body}
              hint="Store the reusable snippet, boilerplate paragraph, or win-theme narrative in markdown-friendly text."
              htmlFor="knowledge-body"
              label="Reusable content"
            >
              <Textarea
                id="knowledge-body"
                name="body"
                onChange={handleChange}
                rows={10}
                value={values.body}
              />
            </FormField>

            <FormField
              className="lg:col-span-2"
              error={formState.fieldErrors.tags}
              hint="Separate freeform tags with commas or new lines."
              htmlFor="knowledge-tags"
              label="Tags"
            >
              <Input
                id="knowledge-tags"
                name="tags"
                onChange={handleChange}
                placeholder="claims intake, zero trust, staffing"
                value={values.tags}
              />
            </FormField>
          </div>
        </section>

        <section className="border-border bg-surface rounded-[32px] border px-6 py-6 shadow-[0_20px_60px_rgba(20,37,34,0.08)] sm:px-8">
          <div className="space-y-2">
            <p className="text-muted text-xs tracking-[0.24em] uppercase">
              Opportunity links
            </p>
            <h2 className="font-heading text-foreground text-2xl font-semibold tracking-[-0.03em]">
              Connect this asset to tracked pursuits
            </h2>
            <p className="text-muted text-sm leading-6">
              Linking an asset to one or more opportunities makes the relevance
              explicit now and creates the seed data for workspace suggestions
              in the next knowledge slice.
            </p>
            {formState.fieldErrors.opportunityIds ? (
              <p className="text-xs leading-5 text-[rgb(133,69,49)]">
                {formState.fieldErrors.opportunityIds}
              </p>
            ) : null}
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-2">
            {snapshot.opportunityOptions.map((opportunity) => {
              const isChecked = values.opportunityIds.includes(opportunity.value);

              return (
                <label
                  key={opportunity.value}
                  className="flex items-start gap-3 rounded-[24px] border border-border bg-white px-4 py-4 shadow-[0_10px_24px_rgba(20,37,34,0.04)]"
                >
                  <input
                    checked={isChecked}
                    className="mt-1 h-4 w-4 rounded border-border text-[rgb(19,78,68)]"
                    name="opportunityIds"
                    onChange={(event) =>
                      handleOpportunityToggle(opportunity.value, event.target.checked)
                    }
                    type="checkbox"
                    value={opportunity.value}
                  />
                  <span className="space-y-1">
                    <span className="block text-sm font-medium text-foreground">
                      {opportunity.label}
                    </span>
                    <span className="block text-xs text-muted">
                      {opportunity.currentStageLabel}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-3">
            <button
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[rgb(19,78,68)] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_30px_rgba(19,78,68,0.22)] transition hover:bg-[rgb(16,66,57)] disabled:cursor-not-allowed disabled:bg-[rgba(19,78,68,0.55)]"
              disabled={isPending}
              type="submit"
            >
              {isPending
                ? "Saving knowledge asset..."
                : snapshot.mode === "create"
                  ? "Create knowledge asset"
                  : "Save knowledge asset"}
            </button>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-white px-5 py-3 text-sm font-medium text-foreground transition hover:bg-[rgba(15,28,31,0.03)]"
              href="/knowledge"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>

      {snapshot.mode === "edit" && snapshot.assetId && deleteAction ? (
        <form action={deleteAction}>
          <input
            name="knowledgeAssetId"
            type="hidden"
            value={snapshot.assetId}
          />
          <button
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-[rgba(148,53,53,0.22)] bg-[rgba(148,53,53,0.08)] px-5 py-3 text-sm font-medium text-[rgb(125,39,39)] transition hover:bg-[rgba(148,53,53,0.14)]"
            type="submit"
          >
            Delete knowledge asset
          </button>
        </form>
      ) : null}
    </section>
  );
}

function SummaryCard({
  label,
  supportingText,
  value,
}: {
  label: string;
  supportingText: string;
  value: string;
}) {
  return (
    <article className="rounded-[24px] border border-[rgba(15,28,31,0.08)] bg-white px-4 py-4">
      <p className="text-muted text-xs tracking-[0.18em] uppercase">{label}</p>
      <p className="font-heading text-foreground mt-3 text-3xl font-semibold tracking-[-0.04em]">
        {value}
      </p>
      <p className="text-muted mt-2 text-xs leading-5">{supportingText}</p>
    </article>
  );
}

function Banner({
  message,
  title,
  tone,
}: {
  message: string;
  title: string;
  tone: "accent" | "warning" | "danger";
}) {
  return (
    <section className="rounded-[28px] border border-border bg-white px-6 py-5 shadow-[0_14px_34px_rgba(20,37,34,0.06)]">
      <div className="flex flex-wrap gap-3">
        <Badge tone={tone}>{title}</Badge>
      </div>
      <p className="text-muted mt-3 text-sm leading-6">{message}</p>
    </section>
  );
}

function formatUtcDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}
