"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { Select } from "@/components/ui/select";
import {
  INITIAL_OPPORTUNITY_PROPOSAL_ACTION_STATE,
  type OpportunityProposalActionState,
} from "@/modules/opportunities/opportunity-proposal-form.schema";
import {
  OPPORTUNITY_PROPOSAL_CHECKLIST_ITEMS,
  OPPORTUNITY_PROPOSAL_STATUS_LABELS,
  OPPORTUNITY_PROPOSAL_STATUSES,
  canTrackProposalForStage,
  type OpportunityProposalChecklistKey,
  type OpportunityProposalStatus,
} from "@/modules/opportunities/opportunity-proposal";
import type {
  OpportunityTaskAssigneeOption,
  OpportunityWorkspaceDocument,
  OpportunityWorkspaceProposal,
} from "@/modules/opportunities/opportunity.types";

type OpportunityProposalManagerProps = {
  currentProposal: OpportunityWorkspaceProposal | null;
  currentStageKey: string | null;
  currentStageLabel: string;
  deleteAction?: (
    state: OpportunityProposalActionState,
    formData: FormData,
  ) => Promise<OpportunityProposalActionState>;
  documents: OpportunityWorkspaceDocument[];
  opportunityId: string;
  ownerOptions: OpportunityTaskAssigneeOption[];
  saveAction: (
    state: OpportunityProposalActionState,
    formData: FormData,
  ) => Promise<OpportunityProposalActionState>;
};

export function OpportunityProposalManager({
  currentProposal,
  currentStageKey,
  currentStageLabel,
  deleteAction,
  documents,
  opportunityId,
  ownerOptions,
  saveAction,
}: OpportunityProposalManagerProps) {
  const router = useRouter();
  const [saveState, saveFormAction, saveIsPending] = useActionState(
    saveAction,
    INITIAL_OPPORTUNITY_PROPOSAL_ACTION_STATE,
  );
  const [deleteState, deleteFormAction, deleteIsPending] = useActionState(
    deleteAction ?? (async () => INITIAL_OPPORTUNITY_PROPOSAL_ACTION_STATE),
    INITIAL_OPPORTUNITY_PROPOSAL_ACTION_STATE,
  );
  const lastRefreshSourceRef = useRef<OpportunityProposalActionState | null>(null);
  const canTrackProposal = canTrackProposalForStage(currentStageKey);
  const proposalSnapshotKey = `${currentProposal?.id ?? currentStageKey ?? "unknown"}:${
    currentProposal?.updatedAt ?? "new"
  }`;

  useEffect(() => {
    if (
      saveState.successMessage &&
      lastRefreshSourceRef.current !== saveState
    ) {
      lastRefreshSourceRef.current = saveState;
      startTransition(() => {
        router.refresh();
      });
    }
  }, [router, saveState]);

  useEffect(() => {
    if (
      deleteState.successMessage &&
      lastRefreshSourceRef.current !== deleteState
    ) {
      lastRefreshSourceRef.current = deleteState;
      startTransition(() => {
        router.refresh();
      });
    }
  }, [currentStageKey, deleteState, router]);

  if (!canTrackProposal && !currentProposal) {
    return (
      <EmptyState
        message="Proposal tracking becomes available once the opportunity moves past qualification and into an approved pursuit."
        title="Proposal tracking not started yet"
      />
    );
  }

  return (
    <div className="space-y-5">
      <ProposalTrackingForm
        key={proposalSnapshotKey}
        currentProposal={currentProposal}
        currentStageKey={currentStageKey}
        currentStageLabel={currentStageLabel}
        documents={documents}
        opportunityId={opportunityId}
        ownerOptions={ownerOptions}
        saveFormAction={saveFormAction}
        saveIsPending={saveIsPending}
        saveState={saveState}
      />

      {currentProposal && deleteAction ? (
        <form action={deleteFormAction}>
          <input name="opportunityId" type="hidden" value={opportunityId} />
          <input name="proposalId" type="hidden" value={currentProposal.id} />
          {deleteState.formError ? (
            <p
              className="mb-3 rounded-[18px] border border-[#dca167]/50 bg-[#fbf2e6] px-4 py-3 text-sm text-[#7e431f]"
              role="alert"
            >
              {deleteState.formError}
            </p>
          ) : null}
          <button
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-[rgba(148,53,53,0.22)] bg-[rgba(148,53,53,0.08)] px-5 py-3 text-sm font-medium text-[rgb(125,39,39)] transition hover:bg-[rgba(148,53,53,0.14)] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={deleteIsPending}
            type="submit"
          >
            {deleteIsPending ? "Removing proposal..." : "Delete proposal record"}
          </button>
        </form>
      ) : null}
    </div>
  );
}

function ProposalTrackingForm({
  currentProposal,
  currentStageKey,
  currentStageLabel,
  documents,
  opportunityId,
  ownerOptions,
  saveFormAction,
  saveIsPending,
  saveState,
}: {
  currentProposal: OpportunityWorkspaceProposal | null;
  currentStageKey: string | null;
  currentStageLabel: string;
  documents: OpportunityWorkspaceDocument[];
  opportunityId: string;
  ownerOptions: OpportunityTaskAssigneeOption[];
  saveFormAction: (formData: FormData) => void;
  saveIsPending: boolean;
  saveState: OpportunityProposalActionState;
}) {
  const [selectedStatus, setSelectedStatus] = useState<OpportunityProposalStatus>(
    currentProposal?.status ?? defaultProposalStatus(currentStageKey),
  );
  const [selectedOwnerUserId, setSelectedOwnerUserId] = useState(
    currentProposal?.ownerUserId ?? "",
  );
  const [selectedChecklistKeys, setSelectedChecklistKeys] = useState<
    OpportunityProposalChecklistKey[]
  >(readCompletedChecklistKeys(currentProposal));
  const [selectedLinkedDocumentIds, setSelectedLinkedDocumentIds] = useState<string[]>(
    readLinkedDocumentIds(currentProposal),
  );
  const completedChecklistKeys = new Set(selectedChecklistKeys);
  const linkedDocumentIds = new Set(selectedLinkedDocumentIds);

  function handleChecklistChange(event: ChangeEvent<HTMLInputElement>) {
    setSelectedChecklistKeys((currentKeys) =>
      toggleStringSelection(
        currentKeys,
        event.target.value as OpportunityProposalChecklistKey,
        event.target.checked,
      ),
    );
  }

  function handleLinkedDocumentChange(event: ChangeEvent<HTMLInputElement>) {
    setSelectedLinkedDocumentIds((currentDocumentIds) =>
      toggleStringSelection(
        currentDocumentIds,
        event.target.value,
        event.target.checked,
      ),
    );
  }

  return (
    <form
      action={saveFormAction}
      className="rounded-[24px] border border-[rgba(15,28,31,0.08)] bg-[rgba(244,248,246,0.9)] px-5 py-5"
    >
      <input name="opportunityId" type="hidden" value={opportunityId} />
      <input name="currentStageKey" type="hidden" value={currentStageKey ?? ""} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            {currentProposal ? "Update proposal tracking" : "Start proposal tracking"}
          </h3>
          <p className="mt-1 text-sm leading-6 text-muted">
            Track the proposal owner, current execution status, readiness
            checklist, and the artifacts tied to the active response package.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="muted">{currentStageLabel}</Badge>
          {currentProposal ? <Badge tone="accent">{currentProposal.statusLabel}</Badge> : null}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[220px_1fr]">
        <FormField
          error={saveState.fieldErrors.status}
          htmlFor="proposal-status"
          label="Proposal status"
        >
          <Select
            id="proposal-status"
            name="status"
            onChange={(event) =>
              setSelectedStatus(event.currentTarget.value as OpportunityProposalStatus)
            }
            value={selectedStatus}
          >
            {OPPORTUNITY_PROPOSAL_STATUSES.map((status) => (
              <option key={status} value={status}>
                {OPPORTUNITY_PROPOSAL_STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          error={saveState.fieldErrors.ownerUserId}
          htmlFor="proposal-owner"
          label="Proposal owner"
        >
          <Select
            id="proposal-owner"
            name="ownerUserId"
            onChange={(event) => setSelectedOwnerUserId(event.currentTarget.value)}
            value={selectedOwnerUserId}
          >
            <option value="">Unassigned</option>
            {ownerOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <section className="mt-6 space-y-3">
        <div>
          <p className="text-muted text-xs tracking-[0.24em] uppercase">
            Compliance Checklist
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Keep the core response checkpoints explicit so review readiness is
            visible in the workspace, not hidden in chat or email.
          </p>
          {saveState.fieldErrors.complianceChecklistKeys ? (
            <p className="mt-2 text-xs leading-5 text-[rgb(133,69,49)]">
              {saveState.fieldErrors.complianceChecklistKeys}
            </p>
          ) : null}
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {OPPORTUNITY_PROPOSAL_CHECKLIST_ITEMS.map((item) => (
            <label
              key={item.key}
              className="border-border flex items-start gap-3 rounded-[24px] border bg-white px-4 py-4 shadow-[0_10px_24px_rgba(20,37,34,0.04)]"
            >
              <input
                checked={completedChecklistKeys.has(item.key)}
                className="border-border mt-1 h-4 w-4 rounded text-[rgb(19,78,68)]"
                name="complianceChecklistKeys"
                onChange={handleChecklistChange}
                type="checkbox"
                value={item.key}
              />
              <span className="space-y-1">
                <span className="text-foreground block text-sm font-medium">
                  {item.label}
                </span>
                <span className="text-muted block text-xs leading-5">
                  {item.description}
                </span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="mt-6 space-y-3">
        <div>
          <p className="text-muted text-xs tracking-[0.24em] uppercase">
            Linked Documents
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Link the workspace artifacts that define the current response
            package, review cycle, or final submission.
          </p>
          {saveState.fieldErrors.linkedDocumentIds ? (
            <p className="mt-2 text-xs leading-5 text-[rgb(133,69,49)]">
              {saveState.fieldErrors.linkedDocumentIds}
            </p>
          ) : null}
        </div>

        {documents.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {documents.map((document) => (
              <label
                key={document.id}
                className="border-border flex items-start gap-3 rounded-[24px] border bg-white px-4 py-4 shadow-[0_10px_24px_rgba(20,37,34,0.04)]"
              >
                <input
                  checked={linkedDocumentIds.has(document.id)}
                  className="border-border mt-1 h-4 w-4 rounded text-[rgb(19,78,68)]"
                  name="linkedDocumentIds"
                  onChange={handleLinkedDocumentChange}
                  type="checkbox"
                  value={document.id}
                />
                <span className="space-y-1">
                  <span className="text-foreground block text-sm font-medium">
                    {document.title}
                  </span>
                  <span className="text-muted block text-xs">
                    {humanizeDocumentType(document.documentType)}
                  </span>
                </span>
              </label>
            ))}
          </div>
        ) : (
          <EmptyState
            message="Upload or retain at least one workspace document before linking proposal artifacts here."
            title="No documents available to link"
          />
        )}
      </section>

      {saveState.formError ? (
        <p
          className="mt-4 rounded-[18px] border border-[#dca167]/50 bg-[#fbf2e6] px-4 py-3 text-sm text-[#7e431f]"
          role="alert"
        >
          {saveState.formError}
        </p>
      ) : null}

      {saveState.successMessage ? (
        <p
          className="mt-4 rounded-[18px] border border-[rgba(32,95,85,0.25)] bg-[rgba(229,243,239,0.85)] px-4 py-3 text-sm text-[rgb(16,66,57)]"
          role="status"
        >
          {saveState.successMessage}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <button
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-[rgb(19,78,68)] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_30px_rgba(19,78,68,0.22)] transition hover:bg-[rgb(16,66,57)] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={saveIsPending}
          type="submit"
        >
          {saveIsPending
            ? "Saving proposal..."
            : currentProposal
              ? "Save proposal"
              : "Start proposal tracking"}
        </button>
      </div>
    </form>
  );
}

function defaultProposalStatus(currentStageKey: string | null) {
  if (currentStageKey === "submitted" || currentStageKey === "awarded") {
    return "SUBMITTED";
  }

  if (currentStageKey === "proposal_in_development") {
    return "IN_PROGRESS";
  }

  return "PLANNING";
}

function humanizeDocumentType(documentType: string | null) {
  if (!documentType) {
    return "General workspace artifact";
  }

  return documentType
    .split("_")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function readCompletedChecklistKeys(
  currentProposal: OpportunityWorkspaceProposal | null,
): OpportunityProposalChecklistKey[] {
  return (
    currentProposal?.checklistItems
      .filter((item) => item.isComplete)
      .map((item) => item.checklistKey) ?? []
  );
}

function readLinkedDocumentIds(
  currentProposal: OpportunityWorkspaceProposal | null,
) {
  return currentProposal?.linkedDocuments.map((document) => document.id) ?? [];
}

function toggleStringSelection<T extends string>(
  currentValues: T[],
  value: T,
  isSelected: boolean,
) {
  if (isSelected) {
    return currentValues.includes(value) ? currentValues : [...currentValues, value];
  }

  return currentValues.filter((currentValue) => currentValue !== value);
}
