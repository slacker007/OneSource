"use client";

import { useActionState, useEffect, useRef } from "react";

import { ActionFeedback } from "@/components/ui/action-feedback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Select } from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";
import { Textarea } from "@/components/ui/textarea";
import {
  INITIAL_OPPORTUNITY_BID_DECISION_ACTION_STATE,
  OPPORTUNITY_BID_DECISION_OUTCOME_OPTIONS,
  OPPORTUNITY_BID_DECISION_TYPE_OPTIONS,
  type OpportunityBidDecisionActionState,
} from "@/modules/opportunities/opportunity-bid-decision-form.schema";
import type {
  BidDecisionOutcome,
  OpportunityWorkspaceScorecard,
} from "@/modules/opportunities/opportunity.types";

type OpportunityBidDecisionManagerProps = {
  action: (
    state: OpportunityBidDecisionActionState,
    formData: FormData,
  ) => Promise<OpportunityBidDecisionActionState>;
  currentDecisionTypeKey?: string | null;
  opportunityId: string;
  recommendationSourceLabel: string | null;
  scorecard: OpportunityWorkspaceScorecard | null;
};

export function OpportunityBidDecisionManager({
  action,
  currentDecisionTypeKey,
  opportunityId,
  recommendationSourceLabel,
  scorecard,
}: OpportunityBidDecisionManagerProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    INITIAL_OPPORTUNITY_BID_DECISION_ACTION_STATE,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const defaultOutcome = scorecard?.recommendationOutcome ?? "DEFER";

  useEffect(() => {
    if (state.successMessage) {
      formRef.current?.reset();
    }
  }, [state.successMessage]);

  return (
    <form action={formAction} ref={formRef}>
      <input name="opportunityId" type="hidden" value={opportunityId} />
      <input
        name="recommendationOutcome"
        type="hidden"
        value={scorecard?.recommendationOutcome ?? ""}
      />
      <input
        name="recommendationSummary"
        type="hidden"
        value={scorecard?.recommendationSummary ?? scorecard?.summary ?? ""}
      />
      <input
        name="recommendationSource"
        type="hidden"
        value={recommendationSourceLabel ?? ""}
      />
      <input
        name="recommendedAt"
        type="hidden"
        value={scorecard?.calculatedAt ?? ""}
      />

      <Surface
        sx={{
          bgcolor: "rgba(255,255,255,0.06)",
          borderColor: "rgba(255,255,255,0.12)",
          p: 2.5,
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-white">
              Record final decision
            </h3>
            <p className="mt-1 text-sm leading-6 text-white/78">
              Capture the human pursuit decision separately from the deterministic
              recommendation so later reviews can compare both.
            </p>
          </div>
          <Badge className="border-white/20 bg-white/10 text-white" tone="muted">
            Recommendation {scorecard?.recommendationOutcome ?? "Pending"}
          </Badge>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <FormField
          error={state.fieldErrors.decisionTypeKey}
          htmlFor="decision-create-type"
          label="Decision checkpoint"
        >
          <Select
            defaultValue={currentDecisionTypeKey ?? "initial_pursuit"}
            id="decision-create-type"
            name="decisionTypeKey"
          >
            {OPPORTUNITY_BID_DECISION_TYPE_OPTIONS.map((decisionTypeKey) => (
              <option key={decisionTypeKey} value={decisionTypeKey}>
                {humanizeEnum(decisionTypeKey)}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          error={state.fieldErrors.finalOutcome}
          htmlFor="decision-create-outcome"
          label="Final decision"
        >
          <Select
            defaultValue={defaultOutcome}
            id="decision-create-outcome"
            name="finalOutcome"
          >
            {OPPORTUNITY_BID_DECISION_OUTCOME_OPTIONS.map((outcome) => (
              <option key={outcome} value={outcome}>
                {humanizeOutcome(outcome)}
              </option>
            ))}
          </Select>
        </FormField>
        </div>

        <FormField
          className="mt-4"
          error={state.fieldErrors.finalRationale}
          htmlFor="decision-create-rationale"
          label="Recorded rationale"
        >
          <Textarea
            defaultValue=""
            id="decision-create-rationale"
            name="finalRationale"
            placeholder="Document why leadership accepted, deferred, or rejected pursuit despite the current score."
            rows={4}
          />
        </FormField>

        <ActionFeedback
          className="mt-4"
          errorMessage={state.formError}
          errorTitle="Decision needs attention"
          successMessage={state.successMessage}
          successTitle="Decision recorded"
        />

        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <Button
            disabled={isPending}
            sx={{
              bgcolor: "common.white",
              color: "rgb(16,58,53)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.92)" },
            }}
            type="submit"
          >
            {isPending ? "Recording decision..." : "Record decision"}
          </Button>
        </div>
      </Surface>
    </form>
  );
}

function humanizeEnum(value: string) {
  return value
    .split(/[_-]/g)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(" ");
}

function humanizeOutcome(value: BidDecisionOutcome) {
  return value === "NO_GO" ? "No Go" : humanizeEnum(value);
}
