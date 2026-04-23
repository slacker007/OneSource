"use client";

import { useActionState, useEffect, useRef } from "react";

import { ActionFeedback } from "@/components/ui/action-feedback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";
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
    <form action={createFormAction} className="mt-6" ref={createFormRef}>
      <input name="opportunityId" type="hidden" value={opportunityId} />
      <Surface sx={{ bgcolor: "background.paper", p: 2.5 }}>
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

        <ActionFeedback
          className="mt-4"
          errorMessage={createState.formError}
          errorTitle="Note needs attention"
          successMessage={createState.successMessage}
          successTitle="Note saved"
        />

        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <Button disabled={createIsPending} type="submit">
            {createIsPending ? "Saving note..." : "Add note"}
          </Button>
        </div>
      </Surface>
    </form>
  );
}
