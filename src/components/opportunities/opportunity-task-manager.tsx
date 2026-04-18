"use client";

import { useActionState, useEffect, useRef } from "react";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  formatOpportunityTaskDateInputValue,
  INITIAL_OPPORTUNITY_TASK_ACTION_STATE,
  OPPORTUNITY_TASK_PRIORITY_OPTIONS,
  OPPORTUNITY_TASK_STATUS_OPTIONS,
  type OpportunityTaskActionState,
} from "@/modules/opportunities/opportunity-task-form.schema";
import type {
  OpportunityTaskAssigneeOption,
  OpportunityWorkspaceTask,
} from "@/modules/opportunities/opportunity.types";

type OpportunityTaskManagerProps = {
  assigneeOptions: OpportunityTaskAssigneeOption[];
  createAction: (
    state: OpportunityTaskActionState,
    formData: FormData,
  ) => Promise<OpportunityTaskActionState>;
  deleteAction: (
    state: OpportunityTaskActionState,
    formData: FormData,
  ) => Promise<OpportunityTaskActionState>;
  opportunityId: string;
  tasks: OpportunityWorkspaceTask[];
  updateAction: (
    state: OpportunityTaskActionState,
    formData: FormData,
  ) => Promise<OpportunityTaskActionState>;
};

export function OpportunityTaskManager({
  assigneeOptions,
  createAction,
  deleteAction,
  opportunityId,
  tasks,
  updateAction,
}: OpportunityTaskManagerProps) {
  const [createState, createFormAction, createIsPending] = useActionState(
    createAction,
    INITIAL_OPPORTUNITY_TASK_ACTION_STATE,
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
        className="rounded-[24px] border border-[rgba(15,28,31,0.08)] bg-[rgba(244,248,246,0.9)] px-5 py-5"
        ref={createFormRef}
      >
        <input name="opportunityId" type="hidden" value={opportunityId} />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Add execution task
            </h3>
            <p className="mt-1 text-sm leading-6 text-muted">
              Create pursuit work items with assignee, due date, status, and
              priority without leaving the workspace.
            </p>
          </div>
          <Badge tone="accent">Personal views update automatically</Badge>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <FormField
            error={createState.fieldErrors.title}
            htmlFor="task-create-title"
            label="Task title"
          >
            <Input
              defaultValue=""
              id="task-create-title"
              name="title"
              placeholder="Complete incumbent analysis brief"
            />
          </FormField>

          <FormField
            error={createState.fieldErrors.assigneeUserId}
            htmlFor="task-create-assignee"
            label="Assignee"
          >
            <Select
              defaultValue=""
              id="task-create-assignee"
              name="assigneeUserId"
            >
              <option value="">Unassigned</option>
              {assigneeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            error={createState.fieldErrors.dueAt}
            htmlFor="task-create-due-at"
            label="Due date"
          >
            <Input defaultValue="" id="task-create-due-at" name="dueAt" type="date" />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              error={createState.fieldErrors.status}
              htmlFor="task-create-status"
              label="Status"
            >
              <Select
                defaultValue="NOT_STARTED"
                id="task-create-status"
                name="status"
              >
                {OPPORTUNITY_TASK_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {humanizeEnum(status)}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              error={createState.fieldErrors.priority}
              htmlFor="task-create-priority"
              label="Priority"
            >
              <Select
                defaultValue="MEDIUM"
                id="task-create-priority"
                name="priority"
              >
                {OPPORTUNITY_TASK_PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority} value={priority}>
                    {humanizeEnum(priority)}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
        </div>

        <FormField
          className="mt-4"
          error={createState.fieldErrors.description}
          htmlFor="task-create-description"
          label="Description"
        >
          <Textarea
            defaultValue=""
            id="task-create-description"
            name="description"
            placeholder="Summarize the deliverable, dependencies, or decision support needed."
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
            {createIsPending ? "Creating task..." : "Create task"}
          </button>
        </div>
      </form>

      {tasks.length > 0 ? (
        <div className="space-y-4">
          {tasks.map((task) => (
            <EditableTaskCard
              assigneeOptions={assigneeOptions}
              deleteAction={deleteAction}
              key={buildTaskVersionKey(task)}
              opportunityId={opportunityId}
              task={task}
              updateAction={updateAction}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          className="bg-white"
          message="Create the first execution record to unblock later milestones and decision gates."
          title="No tasks yet"
        />
      )}
    </div>
  );
}

function EditableTaskCard({
  assigneeOptions,
  deleteAction,
  opportunityId,
  task,
  updateAction,
}: {
  assigneeOptions: OpportunityTaskAssigneeOption[];
  deleteAction: OpportunityTaskManagerProps["deleteAction"];
  opportunityId: string;
  task: OpportunityWorkspaceTask;
  updateAction: OpportunityTaskManagerProps["updateAction"];
}) {
  const [updateState, updateFormAction, updateIsPending] = useActionState(
    updateAction,
    INITIAL_OPPORTUNITY_TASK_ACTION_STATE,
  );
  const [deleteState, deleteFormAction, deleteIsPending] = useActionState(
    deleteAction,
    INITIAL_OPPORTUNITY_TASK_ACTION_STATE,
  );

  return (
    <article className="rounded-[24px] border border-[rgba(15,28,31,0.08)] bg-[rgba(246,239,228,0.55)] px-5 py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-foreground">{task.title}</h3>
          <div className="flex flex-wrap gap-2">
            <Badge tone={priorityTone(task.priority)}>{humanizeEnum(task.priority)}</Badge>
            <Badge tone="muted">{humanizeEnum(task.status)}</Badge>
          </div>
        </div>
        <p className="text-sm text-muted">
          {task.dueAt ? `Due ${formatDate(task.dueAt)}` : "No due date"}
        </p>
      </div>

      <div className="mt-5 space-y-4">
        <form action={updateFormAction} className="space-y-4">
          <input name="opportunityId" type="hidden" value={opportunityId} />
          <input name="taskId" type="hidden" value={task.id} />

          <div className="grid gap-4 xl:grid-cols-2">
            <FormField
              error={updateState.fieldErrors.title}
              htmlFor={`task-title-${task.id}`}
              label="Task title"
            >
              <Input
                defaultValue={task.title}
                id={`task-title-${task.id}`}
                name="title"
              />
            </FormField>

            <FormField
              error={updateState.fieldErrors.assigneeUserId}
              htmlFor={`task-assignee-${task.id}`}
              label="Assignee"
            >
              <Select
                defaultValue={task.assigneeUserId ?? ""}
                id={`task-assignee-${task.id}`}
                name="assigneeUserId"
              >
                <option value="">Unassigned</option>
                {assigneeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              error={updateState.fieldErrors.dueAt}
              htmlFor={`task-due-at-${task.id}`}
              label="Due date"
            >
              <Input
                defaultValue={formatOpportunityTaskDateInputValue(
                  task.dueAt ? new Date(task.dueAt) : null,
                )}
                id={`task-due-at-${task.id}`}
                name="dueAt"
                type="date"
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                error={updateState.fieldErrors.status}
                htmlFor={`task-status-${task.id}`}
                label="Status"
              >
                <Select
                  defaultValue={task.status}
                  id={`task-status-${task.id}`}
                  name="status"
                >
                  {OPPORTUNITY_TASK_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {humanizeEnum(status)}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField
                error={updateState.fieldErrors.priority}
                htmlFor={`task-priority-${task.id}`}
                label="Priority"
              >
                <Select
                  defaultValue={task.priority}
                  id={`task-priority-${task.id}`}
                  name="priority"
                >
                  {OPPORTUNITY_TASK_PRIORITY_OPTIONS.map((priority) => (
                    <option key={priority} value={priority}>
                      {humanizeEnum(priority)}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
          </div>

          <FormField
            error={updateState.fieldErrors.description}
            htmlFor={`task-description-${task.id}`}
            label="Description"
          >
            <Textarea
              defaultValue={task.description ?? ""}
              id={`task-description-${task.id}`}
              name="description"
              rows={4}
            />
          </FormField>

          <p className="text-sm text-muted">
            Owner: {task.assigneeName ?? "Unassigned"}
            {task.createdByName ? ` · Created by ${task.createdByName}` : ""}
          </p>

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

          <div className="flex flex-wrap justify-between gap-3">
            <button
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[rgb(19,78,68)] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_30px_rgba(19,78,68,0.22)] transition hover:bg-[rgb(16,66,57)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={updateIsPending}
              type="submit"
            >
              {updateIsPending ? "Saving task..." : "Save task"}
            </button>
          </div>
        </form>

        <form action={deleteFormAction}>
          <input name="opportunityId" type="hidden" value={opportunityId} />
          <input name="taskId" type="hidden" value={task.id} />
          <button
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-[rgba(133,69,49,0.2)] bg-white px-5 py-3 text-sm font-medium text-[rgb(133,69,49)] transition hover:bg-[rgba(251,242,230,0.8)] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={deleteIsPending}
            type="submit"
          >
            {deleteIsPending ? "Deleting task..." : "Delete task"}
          </button>
        </form>
      </div>

      {deleteState.formError ? (
        <p
          className="mt-4 rounded-[18px] border border-[#dca167]/50 bg-[#fbf2e6] px-4 py-3 text-sm text-[#7e431f]"
          role="alert"
        >
          {deleteState.formError}
        </p>
      ) : null}
    </article>
  );
}

function buildTaskVersionKey(task: OpportunityWorkspaceTask) {
  return [
    task.id,
    task.title,
    task.description ?? "",
    task.assigneeUserId ?? "",
    task.status,
    task.priority,
    task.dueAt ?? "",
  ].join("|");
}

function humanizeEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function priorityTone(priority: OpportunityWorkspaceTask["priority"]) {
  switch (priority) {
    case "CRITICAL":
      return "warning" as const;
    case "HIGH":
      return "accent" as const;
    default:
      return "muted" as const;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
