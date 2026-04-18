"use client";

import Link from "next/link";
import {
  startTransition,
  useActionState,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useState,
  type ChangeEvent,
} from "react";

import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  INITIAL_OPPORTUNITY_FORM_ACTION_STATE,
  parseOpportunityDraftValues,
  type OpportunityFormActionState,
} from "@/modules/opportunities/opportunity-form.schema";
import type {
  OpportunityFormFieldName,
  OpportunityFormSnapshot,
  OpportunityFormValues,
} from "@/modules/opportunities/opportunity.types";

type OpportunityFormProps = {
  action: (
    state: OpportunityFormActionState,
    formData: FormData,
  ) => Promise<OpportunityFormActionState>;
  feedback:
    | {
        tone: "success";
        title: string;
        message: string;
      }
    | null;
  snapshot: OpportunityFormSnapshot;
};

export function OpportunityForm({
  action,
  feedback,
  snapshot,
}: OpportunityFormProps) {
  const [formState, formAction, isPending] = useActionState(
    action,
    INITIAL_OPPORTUNITY_FORM_ACTION_STATE,
  );
  const [values, setValues] = useState(snapshot.initialValues);
  const [draftStatus, setDraftStatus] = useState(
    "Draft autosave will keep a browser-local copy until you save.",
  );
  const [restoredDraft, setRestoredDraft] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const deferredValues = useDeferredValue(values);

  const persistDraft = useEffectEvent((nextValues: OpportunityFormValues) => {
    try {
      window.localStorage.setItem(
        snapshot.draftStorageKey,
        JSON.stringify(nextValues),
      );
      setDraftStatus(`Draft saved locally at ${formatDraftTime(new Date())}.`);
    } catch {
      setDraftStatus("Draft autosave is unavailable in this browser.");
    }
  });

  useEffect(() => {
    let isActive = true;

    void Promise.resolve().then(() => {
      try {
        const storedValue = window.localStorage.getItem(snapshot.draftStorageKey);
        const parsed = storedValue
          ? parseOpportunityDraftValues(JSON.parse(storedValue))
          : null;

        if (
          isActive &&
          parsed &&
          JSON.stringify(parsed) !== JSON.stringify(snapshot.initialValues)
        ) {
          setValues(parsed);
          setRestoredDraft(true);
          setDraftStatus(
            "Restored an unsaved draft from this browser. Save to apply it to the workspace.",
          );
        }
      } catch {
        if (isActive) {
          setDraftStatus("Draft autosave is unavailable in this browser.");
        }
      } finally {
        if (isActive) {
          setHydrated(true);
        }
      }
    });

    return () => {
      isActive = false;
    };
  }, [snapshot.draftStorageKey, snapshot.initialValues]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      persistDraft(deferredValues);
    }, 450);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [deferredValues, hydrated]);

  function handleValueChange(
    field: OpportunityFormFieldName,
    nextValue: string,
  ) {
    setDraftStatus("Saving draft locally...");
    startTransition(() => {
      setValues((currentValues) => ({
        ...currentValues,
        [field]: nextValue,
      }));
    });
  }

  function handleInputChange(
    event:
      | ChangeEvent<HTMLInputElement>
      | ChangeEvent<HTMLSelectElement>
      | ChangeEvent<HTMLTextAreaElement>,
  ) {
    handleValueChange(
      event.target.name as OpportunityFormFieldName,
      event.target.value,
    );
  }

  function handleResetToSavedValues() {
    startTransition(() => {
      setValues(snapshot.initialValues);
      setRestoredDraft(false);
      setDraftStatus("Reverted the form to the last saved values.");
    });

    try {
      window.localStorage.removeItem(snapshot.draftStorageKey);
    } catch {
      setDraftStatus("Draft autosave is unavailable in this browser.");
    }
  }

  function handleSubmit() {
    try {
      window.localStorage.removeItem(snapshot.draftStorageKey);
    } catch {
      setDraftStatus("Draft autosave is unavailable in this browser.");
    }
  }

  const modeLabel =
    snapshot.mode === "create" ? "Create opportunity" : "Edit opportunity";
  const helperCopy =
    snapshot.mode === "create"
      ? "New opportunities start in the Identified stage until stage-transition controls ship in the next PRD slice."
      : "Stage changes stay read-only here for now; dedicated transition controls are tracked separately in `P4-04`.";

  return (
    <section className="space-y-6">
      <header className="border-border bg-surface rounded-[28px] border px-6 py-6 shadow-[0_16px_40px_rgba(20,37,34,0.08)] sm:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge>{modeLabel}</Badge>
              <Badge tone="muted">{snapshot.currentStageLabel}</Badge>
              <Badge tone="warning">Browser draft autosave</Badge>
            </div>
            <h1 className="font-heading text-foreground text-4xl font-semibold tracking-[-0.04em]">
              {snapshot.mode === "create"
                ? "Create a tracked opportunity"
                : values.title || "Edit tracked opportunity"}
            </h1>
            <p className="text-muted max-w-3xl text-sm leading-7">
              {helperCopy}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryCard
              label="Workspace"
              supportingText="Organization-scoped form options"
              value={snapshot.organization.name}
            />
            <SummaryCard
              label="Draft status"
              supportingText={
                restoredDraft ? "Unsaved browser-local edits were restored" : "Local autosave only"
              }
              value={isPending ? "Saving..." : "Ready"}
            />
            <SummaryCard
              label="Source context"
              supportingText={
                snapshot.updatedAt
                  ? `Last updated ${formatIsoDate(snapshot.updatedAt)}`
                  : "No source-linked metadata yet"
              }
              value={humanizeSourceSystem(snapshot.originSourceSystem)}
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

      {restoredDraft ? (
        <Banner
          message="The restored values have not been saved to the database yet."
          title="Unsaved draft restored"
          tone="warning"
        />
      ) : null}

      {formState.formError ? (
        <Banner
          message={formState.formError}
          title="Opportunity form needs attention"
          tone="danger"
        />
      ) : null}

      <section className="border-border bg-surface rounded-[32px] border px-6 py-6 shadow-[0_20px_60px_rgba(20,37,34,0.08)] sm:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-muted text-xs tracking-[0.24em] uppercase">
              Opportunity form
            </p>
            <h2 className="font-heading text-foreground mt-2 text-2xl font-semibold tracking-[-0.03em]">
              Validation-backed tracked opportunity details
            </h2>
          </div>

          <p
            aria-live="polite"
            className="text-sm text-muted"
          >
            {draftStatus}
          </p>
        </div>

        <form
          action={formAction}
          className="mt-6 space-y-6"
          onSubmit={handleSubmit}
        >
          {snapshot.opportunityId ? (
            <input name="opportunityId" type="hidden" value={snapshot.opportunityId} />
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <FormField
              error={formState.fieldErrors.title}
              hint="Required. Use the customer-facing pursuit name rather than an internal shorthand."
              htmlFor="opportunity-form-title"
              label="Opportunity title"
            >
              <Input
                id="opportunity-form-title"
                name="title"
                onChange={handleInputChange}
                placeholder="VA claims intake automation BPA"
                value={values.title}
              />
            </FormField>

            <FormField
              error={formState.fieldErrors.leadAgencyId}
              hint="Optional for now, but selecting the lead agency improves filtering and future scoring inputs."
              htmlFor="opportunity-form-lead-agency"
              label="Lead agency"
            >
              <Select
                id="opportunity-form-lead-agency"
                name="leadAgencyId"
                onChange={handleInputChange}
                value={values.leadAgencyId}
              >
                <option value="">Unassigned</option>
                {snapshot.agencyOptions.map((agency) => (
                  <option key={agency.value} value={agency.value}>
                    {agency.label}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              error={formState.fieldErrors.solicitationNumber}
              hint="Use the solicitation or internal reference if the pursuit is not source-linked."
              htmlFor="opportunity-form-solicitation-number"
              label="Solicitation number"
            >
              <Input
                id="opportunity-form-solicitation-number"
                name="solicitationNumber"
                onChange={handleInputChange}
                placeholder="36C10B26Q0142"
                value={values.solicitationNumber}
              />
            </FormField>

            <FormField
              error={formState.fieldErrors.naicsCode}
              hint="Optional. Use 2 to 6 digits until capability tagging lands in a later phase."
              htmlFor="opportunity-form-naics-code"
              label="NAICS code"
            >
              <Input
                id="opportunity-form-naics-code"
                inputMode="numeric"
                name="naicsCode"
                onChange={handleInputChange}
                placeholder="541512"
                value={values.naicsCode}
              />
            </FormField>

            <FormField
              error={formState.fieldErrors.responseDeadlineAt}
              hint="Optional. When set, this feeds the dashboard and opportunity-list deadline views."
              htmlFor="opportunity-form-response-deadline"
              label="Response deadline"
            >
              <Input
                id="opportunity-form-response-deadline"
                name="responseDeadlineAt"
                onChange={handleInputChange}
                type="date"
                value={values.responseDeadlineAt}
              />
            </FormField>

            <div className="rounded-[24px] border border-dashed border-border bg-white px-5 py-4 text-sm shadow-[0_12px_30px_rgba(20,37,34,0.04)]">
              <p className="text-muted text-xs tracking-[0.24em] uppercase">
                Current stage
              </p>
              <p className="mt-2 font-semibold text-foreground">
                {snapshot.currentStageLabel}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Stage movement stays separate so future required-field gating and rationale capture can land cleanly in `P4-04`.
              </p>
            </div>
          </div>

          <FormField
            error={formState.fieldErrors.description}
            hint="Optional. Capture the short pursuit summary, buying office context, or next-step notes."
            htmlFor="opportunity-form-description"
            label="Description"
          >
            <Textarea
              id="opportunity-form-description"
              name="description"
              onChange={handleInputChange}
              placeholder="Summarize the scope, buying office, and immediate pursuit context."
              value={values.description}
            />
          </FormField>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-3">
              <button
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[rgb(19,78,68)] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_30px_rgba(19,78,68,0.22)] transition hover:bg-[rgb(16,66,57)] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isPending}
                type="submit"
              >
                {isPending
                  ? snapshot.mode === "create"
                    ? "Creating opportunity..."
                    : "Saving changes..."
                  : snapshot.mode === "create"
                    ? "Create opportunity"
                    : "Save changes"}
              </button>

              <button
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-white px-5 py-3 text-sm font-medium text-foreground transition hover:bg-[rgba(15,28,31,0.03)]"
                onClick={handleResetToSavedValues}
                type="button"
              >
                Reset to saved values
              </button>
            </div>

            <Link
              className="text-sm font-medium text-[rgb(19,78,68)] underline-offset-4 hover:underline"
              href="/opportunities"
            >
              Back to opportunity list
            </Link>
          </div>
        </form>
      </section>
    </section>
  );
}

function Banner({
  message,
  title,
  tone,
}: {
  message: string;
  title: string;
  tone: "danger" | "success" | "warning";
}) {
  const toneClassName =
    tone === "success"
      ? "border-[rgba(19,78,68,0.24)] bg-[rgba(227,242,239,0.95)] text-[rgb(19,78,68)]"
      : tone === "warning"
        ? "border-[rgba(182,125,39,0.24)] bg-[rgba(255,247,227,0.96)] text-[rgb(133,97,38)]"
        : "border-[rgba(146,86,57,0.24)] bg-[rgba(253,241,236,0.96)] text-[rgb(133,69,49)]";

  return (
    <div
      className={`rounded-[24px] border px-5 py-4 shadow-[0_12px_30px_rgba(20,37,34,0.05)] ${toneClassName}`}
      role="status"
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm leading-6">{message}</p>
    </div>
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
    <article className="border-border rounded-[24px] border bg-white px-4 py-4 text-sm shadow-[0_12px_30px_rgba(20,37,34,0.06)]">
      <p className="text-muted text-xs tracking-[0.2em] uppercase">{label}</p>
      <p className="mt-2 font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-muted">{supportingText}</p>
    </article>
  );
}

function humanizeSourceSystem(sourceSystem: string | null) {
  if (!sourceSystem) {
    return "Manual entry";
  }

  return sourceSystem
    .split("_")
    .map((segment) => segment.toUpperCase() === "SAM" ? segment.toUpperCase() : segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function formatDraftTime(value: Date) {
  return value.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatIsoDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
