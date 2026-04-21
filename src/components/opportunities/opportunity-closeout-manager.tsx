"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
} from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Select } from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";
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
      startTransition(() => {
        router.refresh();
      });
    }
  }, [router, state]);

  return (
    <form action={formAction} key={formResetKey}>
      <input name="opportunityId" type="hidden" value={opportunityId} />
      <input name="currentStageKey" type="hidden" value={currentStageKey ?? ""} />

      <Surface sx={{ bgcolor: "background.paper", p: 2.5 }}>
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

        <ActionFeedback
          className="mt-4"
          errorMessage={state.formError}
          errorTitle="Closeout needs attention"
          successMessage={state.successMessage}
          successTitle="Closeout saved"
        />

        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <Button disabled={isPending} type="submit">
            {isPending
              ? "Saving closeout..."
              : currentCloseout
                ? "Update closeout"
                : "Record closeout"}
          </Button>
        </div>
      </Surface>
    </form>
  );
}
