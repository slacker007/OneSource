"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
} from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/ui/form-field";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  INITIAL_OPPORTUNITY_CLOSEOUT_ACTION_STATE,
  type OpportunityCloseoutActionState,
} from "@/modules/opportunities/opportunity-closeout-form.schema";
import type {
  OpportunityCompetitorOption,
  OpportunityWorkspaceCloseout,
} from "@/modules/opportunities/opportunity.types";

type OpportunityCloseoutManagerProps = {
  action: (
    state: OpportunityCloseoutActionState,
    formData: FormData,
  ) => Promise<OpportunityCloseoutActionState>;
  competitorOptions: OpportunityCompetitorOption[];
  currentCloseout: OpportunityWorkspaceCloseout | null;
  currentStageKey: string | null;
  currentStageLabel: string;
  opportunityId: string;
};

export function OpportunityCloseoutManager({
  action,
  competitorOptions,
  currentCloseout,
  currentStageKey,
  currentStageLabel,
  opportunityId,
}: OpportunityCloseoutManagerProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    action,
    INITIAL_OPPORTUNITY_CLOSEOUT_ACTION_STATE,
  );
  const lastRefreshStateRef = useRef<OpportunityCloseoutActionState | null>(null);
  const isClosedNoBid = currentStageKey === "no_bid";
  const formResetKey = currentCloseout?.id ?? `${currentStageKey ?? "unstaged"}-closeout`;

  useEffect(() => {
    if (state.successMessage && lastRefreshStateRef.current !== state) {
      lastRefreshStateRef.current = state;
      const refreshTimeout = window.setTimeout(() => {
        startTransition(() => {
          router.refresh();
        });
      }, 400);

      return () => {
        window.clearTimeout(refreshTimeout);
      };
    }
  }, [router, state]);

  return (
    <form
      action={formAction}
      className="rounded-[24px] border border-[rgba(15,28,31,0.08)] bg-white px-5 py-5"
      key={formResetKey}
    >
      <input name="opportunityId" type="hidden" value={opportunityId} />
      <input name="currentStageKey" type="hidden" value={currentStageKey ?? ""} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            {currentCloseout ? "Update closeout notes" : "Record closeout notes"}
          </h3>
          <p className="mt-1 text-sm leading-6 text-muted">
            Save the final outcome rationale and postmortem while the decision
            context is still fresh.
          </p>
        </div>
        <Badge tone="muted">{currentStageLabel}</Badge>
      </div>

      <div className="mt-5 space-y-4">
        <FormField
          error={state.fieldErrors.competitorId}
          hint={
            isClosedNoBid
              ? "Optional for no-bid closeouts."
              : "Required for awarded or lost pursuits."
          }
          htmlFor="closeout-competitor"
          label="Recorded competitor"
        >
          <Select
            defaultValue={currentCloseout?.competitorId ?? ""}
            id="closeout-competitor"
            name="competitorId"
          >
            <option value="">
              {isClosedNoBid ? "No competitor recorded" : "Select competitor"}
            </option>
            {competitorOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          error={state.fieldErrors.outcomeReason}
          htmlFor="closeout-outcome-reason"
          label="Outcome reason"
        >
          <Textarea
            defaultValue={currentCloseout?.outcomeReason ?? ""}
            id="closeout-outcome-reason"
            name="outcomeReason"
            placeholder="Document the decisive reason the pursuit ended in this outcome."
            rows={4}
          />
        </FormField>

        <FormField
          error={state.fieldErrors.lessonsLearned}
          htmlFor="closeout-lessons-learned"
          label="Lessons learned"
        >
          <Textarea
            defaultValue={currentCloseout?.lessonsLearned ?? ""}
            id="closeout-lessons-learned"
            name="lessonsLearned"
            placeholder="Capture the concrete lesson the team should reuse or avoid next time."
            rows={5}
          />
        </FormField>
      </div>

      {state.formError ? (
        <p
          className="mt-4 rounded-[18px] border border-[#dca167]/50 bg-[#fbf2e6] px-4 py-3 text-sm text-[#7e431f]"
          role="alert"
        >
          {state.formError}
        </p>
      ) : null}

      {state.successMessage ? (
        <p
          className="mt-4 rounded-[18px] border border-[rgba(32,95,85,0.25)] bg-[rgba(229,243,239,0.85)] px-4 py-3 text-sm text-[rgb(16,66,57)]"
          role="status"
        >
          {state.successMessage}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <button
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-[rgb(19,78,68)] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_30px_rgba(19,78,68,0.22)] transition hover:bg-[rgb(16,66,57)] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {isPending
            ? "Saving closeout..."
            : currentCloseout
              ? "Update closeout"
              : "Record closeout"}
        </button>
      </div>
    </form>
  );
}
