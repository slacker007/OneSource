"use client";

import { useActionState, useEffect, useRef } from "react";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  formatOpportunityMilestoneDateInputValue,
  INITIAL_OPPORTUNITY_MILESTONE_ACTION_STATE,
  OPPORTUNITY_MILESTONE_STATUS_OPTIONS,
  OPPORTUNITY_MILESTONE_TYPE_OPTIONS,
  type OpportunityMilestoneActionState,
} from "@/modules/opportunities/opportunity-milestone-form.schema";
import type { OpportunityWorkspaceMilestone } from "@/modules/opportunities/opportunity.types";

type OpportunityMilestoneManagerProps = {
  createAction: (
    state: OpportunityMilestoneActionState,
    formData: FormData,
  ) => Promise<OpportunityMilestoneActionState>;
  deleteAction: (
    state: OpportunityMilestoneActionState,
    formData: FormData,
  ) => Promise<OpportunityMilestoneActionState>;
  milestones: OpportunityWorkspaceMilestone[];
  opportunityId: string;
  updateAction: (
    state: OpportunityMilestoneActionState,
    formData: FormData,
  ) => Promise<OpportunityMilestoneActionState>;
};

export function OpportunityMilestoneManager({
  createAction,
  deleteAction,
  milestones,
  opportunityId,
  updateAction,
}: OpportunityMilestoneManagerProps) {
  const [createState, createFormAction, createIsPending] = useActionState(
    createAction,
    INITIAL_OPPORTUNITY_MILESTONE_ACTION_STATE,
  );
  const createFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (createState.successMessage) {
      createFormRef.current?.reset();
    }
  }, [createState.successMessage]);

  return (
    <div className="space-y-5">
      <form
        action={createFormAction}
        className="rounded-[24px] border border-[rgba(15,28,31,0.08)] bg-[rgba(255,249,239,0.86)] px-5 py-5"
        ref={createFormRef}
      >
        <input name="opportunityId" type="hidden" value={opportunityId} />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Add milestone
            </h3>
            <p className="mt-1 text-sm leading-6 text-muted">
              Track capture checkpoints, proposal dates, and decision gates in the
              same guarded workflow as the rest of the workspace.
            </p>
          </div>
          <Badge tone="warning">Dashboard deadlines update automatically</Badge>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <FormField
            error={createState.fieldErrors.title}
            htmlFor="milestone-create-title"
            label="Milestone title"
          >
            <Input
              defaultValue=""
              id="milestone-create-title"
              name="title"
              placeholder="Go/No-Go Board"
            />
          </FormField>

          <FormField
            error={createState.fieldErrors.targetDate}
            htmlFor="milestone-create-target-date"
            label="Target date"
          >
            <Input
              defaultValue=""
              id="milestone-create-target-date"
              name="targetDate"
              type="date"
            />
          </FormField>

          <FormField
            error={createState.fieldErrors.milestoneTypeKey}
            htmlFor="milestone-create-type"
            label="Milestone type"
          >
            <Select
              defaultValue=""
              id="milestone-create-type"
              name="milestoneTypeKey"
            >
              <option value="">General checkpoint</option>
              {OPPORTUNITY_MILESTONE_TYPE_OPTIONS.map((milestoneTypeKey) => (
                <option key={milestoneTypeKey} value={milestoneTypeKey}>
                  {humanizeEnum(milestoneTypeKey)}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            error={createState.fieldErrors.status}
            htmlFor="milestone-create-status"
            label="Status"
          >
            <Select
              defaultValue="PLANNED"
              id="milestone-create-status"
              name="status"
            >
              {OPPORTUNITY_MILESTONE_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {humanizeEnum(status)}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <FormField
          className="mt-4"
          error={createState.fieldErrors.description}
          htmlFor="milestone-create-description"
          label="Description"
        >
          <Textarea
            defaultValue=""
            id="milestone-create-description"
            name="description"
            placeholder="Capture the decision criteria, deliverable, or review expectation."
            rows={4}
          />
        </FormField>

        {createState.formError ? (
          <p
            className="mt-4 rounded-[18px] border border-[#dca167]/50 bg-[#fbf2e6] px-4 py-3 text-sm text-[#7e431f]"
            role="alert"
          >
            {createState.formError}
          </p>
        ) : null}

        {createState.successMessage ? (
          <p
            className="mt-4 rounded-[18px] border border-[rgba(32,95,85,0.25)] bg-[rgba(229,243,239,0.85)] px-4 py-3 text-sm text-[rgb(16,66,57)]"
            role="status"
          >
            {createState.successMessage}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-[rgb(19,78,68)] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_30px_rgba(19,78,68,0.22)] transition hover:bg-[rgb(16,66,57)] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={createIsPending}
            type="submit"
          >
            {createIsPending ? "Creating milestone..." : "Create milestone"}
          </button>
        </div>
      </form>

      {milestones.length > 0 ? (
        <div className="space-y-4">
          {milestones.map((milestone) => (
            <EditableMilestoneCard
              deleteAction={deleteAction}
              key={buildMilestoneVersionKey(milestone)}
              milestone={milestone}
              opportunityId={opportunityId}
              updateAction={updateAction}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          className="bg-white"
          message="Create the first capture checkpoint so deadlines can surface in the workspace and dashboard."
          title="No milestones yet"
        />
      )}
    </div>
  );
}

function EditableMilestoneCard({
  deleteAction,
  milestone,
  opportunityId,
  updateAction,
}: {
  deleteAction: OpportunityMilestoneManagerProps["deleteAction"];
  milestone: OpportunityWorkspaceMilestone;
  opportunityId: string;
  updateAction: OpportunityMilestoneManagerProps["updateAction"];
}) {
  const [updateState, updateFormAction, updateIsPending] = useActionState(
    updateAction,
    INITIAL_OPPORTUNITY_MILESTONE_ACTION_STATE,
  );
  const [deleteState, deleteFormAction, deleteIsPending] = useActionState(
    deleteAction,
    INITIAL_OPPORTUNITY_MILESTONE_ACTION_STATE,
  );

  return (
    <article className="rounded-[24px] border border-[rgba(15,28,31,0.08)] bg-[rgba(244,248,246,0.9)] px-5 py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-foreground">
            {milestone.title}
          </h3>
          <div className="flex flex-wrap gap-2">
            <Badge tone={milestoneTone(milestone.status)}>
              {humanizeEnum(milestone.status)}
            </Badge>
            {milestone.milestoneTypeKey ? (
              <Badge tone="muted">{humanizeEnum(milestone.milestoneTypeKey)}</Badge>
            ) : null}
            {milestone.deadlineReminderState !== "NONE" ? (
              <Badge tone={deadlineReminderTone(milestone.deadlineReminderState)}>
                {deadlineReminderLabel(milestone.deadlineReminderState)}
              </Badge>
            ) : null}
          </div>
        </div>
        <p className="text-sm text-muted">
          Target {formatDate(milestone.targetDate)}
          {milestone.completedAt ? ` · Completed ${formatDate(milestone.completedAt)}` : ""}
        </p>
      </div>

      <div className="mt-5 space-y-4">
        <form action={updateFormAction} className="space-y-4">
          <input name="milestoneId" type="hidden" value={milestone.id} />
          <input name="opportunityId" type="hidden" value={opportunityId} />

          <div className="grid gap-4 xl:grid-cols-2">
            <FormField
              error={updateState.fieldErrors.title}
              htmlFor={`milestone-title-${milestone.id}`}
              label="Milestone title"
            >
              <Input
                defaultValue={milestone.title}
                id={`milestone-title-${milestone.id}`}
                name="title"
              />
            </FormField>

            <FormField
              error={updateState.fieldErrors.targetDate}
              htmlFor={`milestone-target-date-${milestone.id}`}
              label="Target date"
            >
              <Input
                defaultValue={formatOpportunityMilestoneDateInputValue(
                  new Date(milestone.targetDate),
                )}
                id={`milestone-target-date-${milestone.id}`}
                name="targetDate"
                type="date"
              />
            </FormField>

            <FormField
              error={updateState.fieldErrors.milestoneTypeKey}
              htmlFor={`milestone-type-${milestone.id}`}
              label="Milestone type"
            >
              <Select
                defaultValue={milestone.milestoneTypeKey ?? ""}
                id={`milestone-type-${milestone.id}`}
                name="milestoneTypeKey"
              >
                <option value="">General checkpoint</option>
                {OPPORTUNITY_MILESTONE_TYPE_OPTIONS.map((milestoneTypeKey) => (
                  <option key={milestoneTypeKey} value={milestoneTypeKey}>
                    {humanizeEnum(milestoneTypeKey)}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              error={updateState.fieldErrors.status}
              htmlFor={`milestone-status-${milestone.id}`}
              label="Status"
            >
              <Select
                defaultValue={milestone.status}
                id={`milestone-status-${milestone.id}`}
                name="status"
              >
                {OPPORTUNITY_MILESTONE_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {humanizeEnum(status)}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <FormField
            error={updateState.fieldErrors.description}
            htmlFor={`milestone-description-${milestone.id}`}
            label="Description"
          >
            <Textarea
              defaultValue={milestone.description ?? ""}
              id={`milestone-description-${milestone.id}`}
              name="description"
              rows={3}
            />
          </FormField>

          {updateState.formError ? (
            <p
              className="rounded-[18px] border border-[#dca167]/50 bg-[#fbf2e6] px-4 py-3 text-sm text-[#7e431f]"
              role="alert"
            >
              {updateState.formError}
            </p>
          ) : null}

          {updateState.successMessage ? (
            <p
              className="rounded-[18px] border border-[rgba(32,95,85,0.25)] bg-[rgba(229,243,239,0.85)] px-4 py-3 text-sm text-[rgb(16,66,57)]"
              role="status"
            >
              {updateState.successMessage}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3">
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition hover:bg-[rgba(15,28,31,0.03)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={updateIsPending}
              type="submit"
            >
              {updateIsPending ? "Saving..." : "Save milestone"}
            </button>
          </div>
        </form>

        <form action={deleteFormAction} className="flex justify-end">
          <input name="milestoneId" type="hidden" value={milestone.id} />
          <input name="opportunityId" type="hidden" value={opportunityId} />

          <button
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[rgba(126,67,31,0.28)] bg-[#fff8f1] px-4 py-2 text-sm font-medium text-[#7e431f] transition hover:bg-[#faefe0] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={deleteIsPending}
            type="submit"
          >
            {deleteIsPending ? "Deleting..." : "Delete milestone"}
          </button>
        </form>

        {deleteState.formError ? (
          <p
            className="rounded-[18px] border border-[#dca167]/50 bg-[#fbf2e6] px-4 py-3 text-sm text-[#7e431f]"
            role="alert"
          >
            {deleteState.formError}
          </p>
        ) : null}

        {deleteState.successMessage ? (
          <p
            className="rounded-[18px] border border-[rgba(32,95,85,0.25)] bg-[rgba(229,243,239,0.85)] px-4 py-3 text-sm text-[rgb(16,66,57)]"
            role="status"
          >
            {deleteState.successMessage}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function buildMilestoneVersionKey(milestone: OpportunityWorkspaceMilestone) {
  return [
    milestone.id,
    milestone.title,
    milestone.status,
    milestone.targetDate,
    milestone.completedAt ?? "pending",
  ].join(":");
}

function humanizeEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function milestoneTone(status: OpportunityWorkspaceMilestone["status"]) {
  switch (status) {
    case "AT_RISK":
    case "MISSED":
      return "warning" as const;
    case "COMPLETED":
      return "accent" as const;
    default:
      return "muted" as const;
  }
}

function deadlineReminderTone(
  state: OpportunityWorkspaceMilestone["deadlineReminderState"],
) {
  return state === "OVERDUE" ? ("warning" as const) : ("accent" as const);
}

function deadlineReminderLabel(
  state: OpportunityWorkspaceMilestone["deadlineReminderState"],
) {
  return state === "OVERDUE" ? "Overdue" : "Upcoming deadline";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
