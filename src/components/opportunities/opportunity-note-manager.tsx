"use client";

import { useActionState, useEffect, useRef } from "react";

import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  INITIAL_OPPORTUNITY_NOTE_ACTION_STATE,
  type OpportunityNoteActionState,
} from "@/modules/opportunities/opportunity-note-form.schema";

type OpportunityNoteManagerProps = {
  createAction: (
    state: OpportunityNoteActionState,
    formData: FormData,
  ) => Promise<OpportunityNoteActionState>;
  opportunityId: string;
};

export function OpportunityNoteManager({
  createAction,
  opportunityId,
}: OpportunityNoteManagerProps) {
  const [createState, createFormAction, createIsPending] = useActionState(
    createAction,
    INITIAL_OPPORTUNITY_NOTE_ACTION_STATE,
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
          <h3 className="text-base font-semibold text-foreground">Add note</h3>
          <p className="mt-1 text-sm leading-6 text-muted">
            Record capture assumptions, meeting outcomes, and decision context
            directly in the workspace trail.
          </p>
        </div>
        <Badge tone="accent">Adds a dated activity entry</Badge>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_220px]">
        <FormField
          error={createState.fieldErrors.title}
          htmlFor="note-create-title"
          label="Note title"
        >
          <Input
            defaultValue=""
            id="note-create-title"
            name="title"
            placeholder="Capture summary"
          />
        </FormField>

        <FormField
          error={createState.fieldErrors.isPinned}
          htmlFor="note-create-pinned"
          label="Pin note"
        >
          <Select defaultValue="false" id="note-create-pinned" name="isPinned">
            <option value="false">Standard note</option>
            <option value="true">Pin to top</option>
          </Select>
        </FormField>
      </div>

      <FormField
        className="mt-4"
        error={createState.fieldErrors.body}
        htmlFor="note-create-body"
        label="Details"
      >
        <Textarea
          defaultValue=""
          id="note-create-body"
          name="body"
          placeholder="Capture the latest context, assumptions, or follow-up decisions."
          rows={5}
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
          {createIsPending ? "Saving note..." : "Add note"}
        </button>
      </div>
    </form>
  );
}
