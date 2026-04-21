"use client";

import { useActionState, useEffect, useRef } from "react";

import { ActionFeedback } from "@/components/ui/action-feedback";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  INITIAL_OPPORTUNITY_DOCUMENT_ACTION_STATE,
  OPPORTUNITY_DOCUMENT_TYPE_OPTIONS,
  type OpportunityDocumentActionState,
} from "@/modules/opportunities/opportunity-document-form.schema";

type OpportunityDocumentManagerProps = {
  createAction: (
    state: OpportunityDocumentActionState,
    formData: FormData,
  ) => Promise<OpportunityDocumentActionState>;
  opportunityId: string;
};

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  "": "General",
  capture_plan: "Capture Plan",
  proposal_storyboard: "Proposal Storyboard",
  proposal_submission: "Proposal Submission",
  qualification_brief: "Qualification Brief",
  statement_of_work: "Statement Of Work",
};

export function OpportunityDocumentManager({
  createAction,
  opportunityId,
}: OpportunityDocumentManagerProps) {
  const [createState, createFormAction, createIsPending] = useActionState(
    createAction,
    INITIAL_OPPORTUNITY_DOCUMENT_ACTION_STATE,
  );
  const createFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (createState.successMessage) {
      createFormRef.current?.reset();
    }
  }, [createState.successMessage]);

  return (
    <form
      action={createFormAction}
      className="mt-6 rounded-[24px] border border-[rgba(15,28,31,0.08)] bg-[rgba(244,248,246,0.9)] px-5 py-5"
      ref={createFormRef}
    >
      <input name="opportunityId" type="hidden" value={opportunityId} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Upload document
          </h3>
          <p className="mt-1 text-sm leading-6 text-muted">
            Store capture artifacts in the workspace with persisted metadata and
            background text extraction for supported text-like formats.
          </p>
        </div>
        <Badge tone="accent">Local file stored on upload</Badge>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_220px]">
        <FormField
          error={createState.fieldErrors.title}
          htmlFor="document-create-title"
          label="Document title"
        >
          <Input
            defaultValue=""
            id="document-create-title"
            name="title"
            placeholder="Capture plan draft"
          />
        </FormField>

        <FormField
          error={createState.fieldErrors.documentType}
          htmlFor="document-create-type"
          label="Document type"
        >
          <Select
            defaultValue=""
            id="document-create-type"
            name="documentType"
          >
            {OPPORTUNITY_DOCUMENT_TYPE_OPTIONS.map((option) => (
              <option key={option || "general"} value={option}>
                {DOCUMENT_TYPE_LABELS[option] ?? option}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <FormField
        className="mt-4"
        error={createState.fieldErrors.file}
        htmlFor="document-create-file"
        label="File"
      >
        <Input
          accept=".txt,.md,.markdown,.csv,.tsv,.json,.xml,.yaml,.yml,.html,.htm,.pdf,.doc,.docx,.ppt,.pptx,.xlsx,.xls,.zip"
          id="document-create-file"
          name="file"
          type="file"
        />
      </FormField>

      <p className="mt-3 text-xs leading-6 text-muted">
        Supported text-like uploads are queued for asynchronous extraction by
        the background worker. Unsupported binary formats are still stored with
        explicit metadata so later parser upgrades can revisit them safely.
      </p>

      <ActionFeedback
        className="mt-4"
        errorMessage={createState.formError}
        errorTitle="Upload needs attention"
        successMessage={createState.successMessage}
        successTitle="Document stored"
      />

      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <button
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-[rgb(19,78,68)] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_30px_rgba(19,78,68,0.22)] transition hover:bg-[rgb(16,66,57)] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={createIsPending}
          type="submit"
        >
          {createIsPending ? "Uploading..." : "Upload document"}
        </button>
      </div>
    </form>
  );
}
