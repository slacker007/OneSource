"use client";

import { useActionState, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  INITIAL_OPPORTUNITY_STAGE_TRANSITION_ACTION_STATE,
  type OpportunityStageControlSnapshot,
  type OpportunityStageTransitionActionState,
} from "@/modules/opportunities/opportunity-stage-policy";

type OpportunityStageTransitionPanelProps = {
  action: (
    state: OpportunityStageTransitionActionState,
    formData: FormData,
  ) => Promise<OpportunityStageTransitionActionState>;
  opportunityId: string;
  snapshot: OpportunityStageControlSnapshot;
};

export function OpportunityStageTransitionPanel({
  action,
  opportunityId,
  snapshot,
}: OpportunityStageTransitionPanelProps) {
  type SelectedStageKey = OpportunityStageControlSnapshot["options"][number]["stageKey"];

  const [formState, formAction, isPending] = useActionState(
    action,
    INITIAL_OPPORTUNITY_STAGE_TRANSITION_ACTION_STATE,
  );
  const [rationale, setRationale] = useState("");
  const [selectedStageKey, setSelectedStageKey] = useState<SelectedStageKey | "">(
    snapshot.defaultToStageKey ?? snapshot.options[0]?.stageKey ?? "",
  );

  const selectedOption =
    snapshot.options.find((option) => option.stageKey === selectedStageKey) ??
    snapshot.options[0] ??
    null;
  const isSubmitDisabled =
    isPending ||
    !selectedOption ||
    !selectedOption.isAllowed ||
    rationale.trim().length === 0;

  return (
    <article className="border-border rounded-[28px] border bg-white p-6 shadow-[0_16px_40px_rgba(20,37,34,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-muted text-xs tracking-[0.24em] uppercase">
            Pipeline controls
          </p>
          <h2 className="font-heading text-foreground text-2xl font-semibold tracking-[-0.03em]">
            Stage transition
          </h2>
          <p className="text-muted max-w-3xl text-sm leading-6">
            Every stage change requires recorded rationale. Transition gates stay
            server-enforced even if the browser is tampered with.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge tone="muted">{snapshot.currentStageLabel}</Badge>
          <Badge tone="warning">Policy {snapshot.policyVersion}</Badge>
        </div>
      </div>

      {snapshot.options.length === 0 ? (
        <EmptyState
          className="mt-6"
          message="This opportunity is already in a terminal stage, so no further pipeline movement is available from this control."
          title="No stage transitions available"
        />
      ) : (
        <form action={formAction} className="mt-6 space-y-5">
          <input name="opportunityId" type="hidden" value={opportunityId} />

          <div className="grid gap-5 xl:grid-cols-[0.72fr_1.28fr]">
            <div className="space-y-5">
              <FormField htmlFor="stage-transition-target" label="Move to">
                <Select
                  id="stage-transition-target"
                  name="toStageKey"
                  onChange={(event) =>
                    setSelectedStageKey(event.target.value as SelectedStageKey)
                  }
                  value={selectedStageKey}
                >
                  {snapshot.options.map((option) => (
                    <option key={option.stageKey} value={option.stageKey}>
                      {option.stageLabel}
                      {option.isAllowed ? "" : " (blocked)"}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField
                htmlFor="stage-transition-rationale"
                label="Recorded rationale"
              >
                <Textarea
                  id="stage-transition-rationale"
                  name="rationale"
                  onChange={(event) => setRationale(event.target.value)}
                  placeholder="Explain why the opportunity is ready for this stage now."
                  rows={5}
                  value={rationale}
                />
              </FormField>

              <button
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[rgb(19,78,68)] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_30px_rgba(19,78,68,0.22)] transition hover:bg-[rgb(16,66,57)] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitDisabled}
                type="submit"
              >
                {isPending
                  ? "Updating stage..."
                  : selectedOption
                    ? `Move to ${selectedOption.stageLabel}`
                    : "Move stage"}
              </button>
            </div>

            {selectedOption ? (
              <div className="rounded-[24px] border border-[rgba(15,28,31,0.08)] bg-[rgba(246,239,228,0.55)] px-5 py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold text-foreground">
                      {selectedOption.stageLabel}
                    </h3>
                    <p className="text-sm leading-6 text-muted">
                      {selectedOption.description}
                    </p>
                  </div>
                  <Badge tone={selectedOption.isAllowed ? "accent" : "warning"}>
                    {selectedOption.isAllowed ? "Ready" : "Blocked"}
                  </Badge>
                </div>

                <div className="mt-5 space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">
                    Required records
                  </h4>
                  {selectedOption.requirements.length > 0 ? (
                    selectedOption.requirements.map((requirement) => (
                      <div
                        className="rounded-[18px] border border-[rgba(15,28,31,0.08)] bg-white px-4 py-3"
                        key={requirement.key}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-medium text-foreground">
                            {requirement.label}
                          </p>
                          <Badge
                            tone={requirement.isSatisfied ? "accent" : "warning"}
                          >
                            {requirement.isSatisfied ? "Met" : "Missing"}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-muted">
                          {requirement.description}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm leading-6 text-muted">
                      No additional workspace records are required for this
                      stage. Only the recorded rationale is mandatory.
                    </p>
                  )}
                </div>

                {!selectedOption.isAllowed ? (
                  <p
                    className="mt-4 rounded-[18px] border border-[#dca167]/50 bg-[#fbf2e6] px-4 py-3 text-sm text-[#7e431f]"
                    role="status"
                  >
                    Unlock this transition by completing:{" "}
                    {selectedOption.missingRequirementLabels.join(", ")}.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          {formState.formError ? (
            <p
              className="rounded-[18px] border border-[#dca167]/50 bg-[#fbf2e6] px-4 py-3 text-sm text-[#7e431f]"
              role="alert"
            >
              {formState.formError}
            </p>
          ) : null}

          {formState.successMessage ? (
            <p
              className="rounded-[18px] border border-[rgba(32,95,85,0.25)] bg-[rgba(229,243,239,0.85)] px-4 py-3 text-sm text-[rgb(16,66,57)]"
              role="status"
            >
              {formState.successMessage}
            </p>
          ) : null}
        </form>
      )}
    </article>
  );
}
