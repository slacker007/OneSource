"use client";

import Checkbox from "@mui/material/Checkbox";
import { useActionState, useState, type ChangeEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";
import { Textarea } from "@/components/ui/textarea";
import {
  INITIAL_KNOWLEDGE_ASSET_FORM_ACTION_STATE,
  type KnowledgeAssetFormActionState,
} from "@/modules/knowledge/knowledge-form.schema";
import {
  KNOWLEDGE_ASSET_TYPE_LABELS,
  KNOWLEDGE_ASSET_TYPES,
  type KnowledgeFacetOption,
  type KnowledgeAssetFormFieldName,
  type KnowledgeAssetFormSnapshot,
} from "@/modules/knowledge/knowledge.types";

type KnowledgeFormProps = {
  action: (
    state: KnowledgeAssetFormActionState,
    formData: FormData,
  ) => Promise<KnowledgeAssetFormActionState>;
  deleteAction?: (formData: FormData) => Promise<void>;
  feedback: {
    tone: "accent" | "warning";
    title: string;
    message: string;
  } | null;
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
        : currentValues.opportunityIds.filter(
            (value) => value !== opportunityId,
          ),
    }));
  }

  function handleMultiSelectToggle({
    checked,
    field,
    value,
  }: {
    checked: boolean;
    field: "agencyIds" | "capabilityKeys" | "contractTypes" | "vehicleCodes";
    value: string;
  }) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: checked
        ? [...currentValues[field], value]
        : currentValues[field].filter((currentValue) => currentValue !== value),
    }));
  }

  const modeLabel =
    snapshot.mode === "create"
      ? "Create knowledge asset"
      : "Edit knowledge asset";
  const structuredTagCount =
    values.agencyIds.length +
    values.capabilityKeys.length +
    values.contractTypes.length +
    values.vehicleCodes.length;

  return (
    <section className="space-y-6">
      <Surface component="header" sx={{ px: { sm: 4, xs: 3 }, py: 3 }}>
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
              <Badge tone="accent">
                {structuredTagCount === 1
                  ? "1 structured retrieval tag"
                  : `${structuredTagCount} structured retrieval tags`}
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
            <SummaryCard
              label="Retrieval tags"
              supportingText="Structured agency, capability, contract-type, and vehicle coverage"
              value={String(structuredTagCount)}
            />
          </div>
        </div>
      </Surface>

      {feedback ? (
        <FeedbackBanner
          message={feedback.message}
          role="status"
          title={feedback.title}
          tone={feedback.tone === "warning" ? "warning" : "info"}
        />
      ) : null}

      {formState.formError ? (
        <FeedbackBanner
          ariaLive="assertive"
          message={formState.formError}
          role="alert"
          title="Knowledge asset needs attention"
          tone="danger"
        />
      ) : null}

      <form action={formAction} className="space-y-6">
        {snapshot.assetId ? (
          <input
            name="knowledgeAssetId"
            type="hidden"
            value={snapshot.assetId}
          />
        ) : null}

        <Surface component="section" sx={{ px: { sm: 4, xs: 3 }, py: 3 }}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-muted text-xs tracking-[0.24em] uppercase">
                Asset details
              </p>
              <h2 className="font-heading text-foreground mt-2 text-2xl font-semibold tracking-[-0.03em]">
                Validation-backed reusable content
              </h2>
            </div>

            <Button href="/knowledge" tone="neutral" variant="text">
              Return to library
            </Button>
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
        </Surface>

        <Surface component="section" sx={{ px: { sm: 4, xs: 3 }, py: 3 }}>
          <div className="space-y-2">
            <p className="text-muted text-xs tracking-[0.24em] uppercase">
              Structured retrieval
            </p>
            <h2 className="font-heading text-foreground text-2xl font-semibold tracking-[-0.03em]">
              Tag the reusable context this asset covers
            </h2>
            <p className="text-muted text-sm leading-6">
              These structured tags power fast browse filters now and the
              upcoming in-workspace suggestion ranking in the next knowledge
              slice.
            </p>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <FacetCheckboxFieldset
              description="Select the agencies where this language has proven relevance."
              emptyMessage="No agencies are available in the current workspace."
              error={formState.fieldErrors.agencyIds}
              field="agencyIds"
              onToggle={handleMultiSelectToggle}
              options={snapshot.agencyOptions}
              selectedValues={values.agencyIds}
              title="Agencies"
            />
            <FacetCheckboxFieldset
              description="Choose the organizational capabilities this content supports."
              emptyMessage="No active capabilities are configured yet."
              error={formState.fieldErrors.capabilityKeys}
              field="capabilityKeys"
              onToggle={handleMultiSelectToggle}
              options={snapshot.capabilityOptions}
              selectedValues={values.capabilityKeys}
              title="Capabilities"
            />
            <FacetCheckboxFieldset
              description="Mark the procurement or notice types this content fits."
              emptyMessage="No contract types have been observed yet in this workspace."
              error={formState.fieldErrors.contractTypes}
              field="contractTypes"
              onToggle={handleMultiSelectToggle}
              options={snapshot.contractTypeOptions}
              selectedValues={values.contractTypes}
              title="Contract types"
            />
            <FacetCheckboxFieldset
              description="Choose the vehicles where this language is ready to reuse."
              emptyMessage="No contract vehicles are configured in this workspace."
              error={formState.fieldErrors.vehicleCodes}
              field="vehicleCodes"
              onToggle={handleMultiSelectToggle}
              options={snapshot.vehicleOptions}
              selectedValues={values.vehicleCodes}
              title="Vehicles"
            />
          </div>
        </Surface>

        <Surface component="section" sx={{ px: { sm: 4, xs: 3 }, py: 3 }}>
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
              const isChecked = values.opportunityIds.includes(
                opportunity.value,
              );

              return (
                <Surface
                  component="label"
                  key={opportunity.value}
                  sx={{ borderRadius: 3, px: 2, py: 2 }}
                >
                  <Checkbox
                    checked={isChecked}
                    name="opportunityIds"
                    onChange={(event) =>
                      handleOpportunityToggle(
                        opportunity.value,
                        event.target.checked,
                      )
                    }
                    value={opportunity.value}
                    sx={{ mt: -0.5 }}
                  />
                  <span className="space-y-1">
                    <span className="text-foreground block text-sm font-medium">
                      {opportunity.label}
                    </span>
                    <span className="text-muted block text-xs">
                      {opportunity.currentStageLabel}
                    </span>
                  </span>
                </Surface>
              );
            })}
          </div>
        </Surface>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-3">
            <Button disabled={isPending} type="submit">
              {isPending
                ? "Saving knowledge asset..."
                : snapshot.mode === "create"
                  ? "Create knowledge asset"
                  : "Save knowledge asset"}
            </Button>
            <Button href="/knowledge" tone="neutral" variant="outlined">
              Cancel
            </Button>
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
          <Button tone="danger" type="submit" variant="soft">
            Delete knowledge asset
          </Button>
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
    <Surface component="article" sx={{ borderRadius: 3, px: 2, py: 2 }}>
      <p className="text-muted text-xs tracking-[0.18em] uppercase">{label}</p>
      <p className="font-heading text-foreground mt-3 text-3xl font-semibold tracking-[-0.04em]">
        {value}
      </p>
      <p className="text-muted mt-2 text-xs leading-5">{supportingText}</p>
    </Surface>
  );
}

function FacetCheckboxFieldset({
  description,
  emptyMessage,
  error,
  field,
  onToggle,
  options,
  selectedValues,
  title,
}: {
  description: string;
  emptyMessage: string;
  error?: string;
  field: "agencyIds" | "capabilityKeys" | "contractTypes" | "vehicleCodes";
  onToggle: (input: {
    checked: boolean;
    field: "agencyIds" | "capabilityKeys" | "contractTypes" | "vehicleCodes";
    value: string;
  }) => void;
  options: KnowledgeFacetOption[];
  selectedValues: string[];
  title: string;
}) {
  return (
    <Surface component="section" sx={{ borderRadius: 3, px: 2, py: 2 }}>
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-foreground text-sm font-medium">{title}</p>
          <Badge tone="muted">
            {selectedValues.length === 1
              ? "1 selected"
              : `${selectedValues.length} selected`}
          </Badge>
        </div>
        <p className="text-muted text-xs leading-5">{description}</p>
        {error ? (
          <p className="text-xs leading-5 text-[rgb(133,69,49)]">{error}</p>
        ) : null}
      </div>

      {options.length === 0 ? (
        <p className="text-muted text-sm">{emptyMessage}</p>
      ) : (
        <div className="grid gap-3">
          {options.map((option) => {
            const isChecked = selectedValues.includes(option.value);

            return (
              <Surface
                component="label"
                key={`${field}-${option.value}`}
                sx={{
                  bgcolor: "rgba(15, 28, 31, 0.02)",
                  borderRadius: 2.5,
                  px: 2,
                  py: 1.5,
                }}
              >
                <Checkbox
                  checked={isChecked}
                  name={field}
                  onChange={(event) =>
                    onToggle({
                      checked: event.target.checked,
                      field,
                      value: option.value,
                    })
                  }
                  value={option.value}
                  sx={{ mt: -0.5 }}
                />
                <span className="space-y-1">
                  <span className="text-foreground block text-sm font-medium">
                    {option.label}
                  </span>
                  {option.description ? (
                    <span className="text-muted block text-xs">
                      {option.description}
                    </span>
                  ) : null}
                </span>
              </Surface>
            );
          })}
        </div>
      )}
    </Surface>
  );
}

function formatUtcDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}
