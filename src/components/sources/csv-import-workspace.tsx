"use client";

import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { FormField } from "@/components/ui/form-field";
import { Select } from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";
import {
  buildCsvImportPreview,
  buildInitialCsvImportMapping,
  createCsvImportDraft,
  CSV_IMPORT_FIELD_DEFINITIONS,
  type CsvImportColumnMapping,
  type CsvImportPreviewRow,
  type CsvImportWorkspaceSnapshot,
} from "@/modules/source-integrations/csv-import.service";

type CsvImportWorkspaceProps = {
  action: (formData: FormData) => Promise<void>;
  feedback: {
    error: string | null;
    importedCount: number | null;
    skippedCount: number | null;
    status: string | null;
  };
  workspaceSnapshot: CsvImportWorkspaceSnapshot | null;
};

export function CsvImportWorkspace({
  action,
  feedback,
  workspaceSnapshot,
}: CsvImportWorkspaceProps) {
  const [draftResult, setDraftResult] = useState<ReturnType<
    typeof createCsvImportDraft
  > | null>(null);
  const [mapping, setMapping] = useState<CsvImportColumnMapping | null>(null);
  const [isReadingFile, startReadingFile] = useTransition();

  const preview =
    draftResult?.draft && mapping && workspaceSnapshot
      ? buildCsvImportPreview({
          draft: draftResult.draft,
          errors: draftResult.errors,
          mapping,
          workspace: workspaceSnapshot,
        })
      : null;

  async function handleFileChange(file: File | null) {
    if (!file) {
      setDraftResult(null);
      setMapping(null);
      return;
    }

    const csvText = await file.text();

    startReadingFile(() => {
      const nextDraftResult = createCsvImportDraft({
        csvText,
        fileName: file.name,
        fileSize: file.size,
      });

      setDraftResult(nextDraftResult);
      setMapping(
        nextDraftResult.draft
          ? buildInitialCsvImportMapping(nextDraftResult.draft.headers)
          : null,
      );
    });
  }

  function handleMappingChange(
    fieldKey: keyof CsvImportColumnMapping,
    value: string,
  ) {
    startReadingFile(() => {
      setMapping((currentMapping) =>
        currentMapping
          ? {
              ...currentMapping,
              [fieldKey]: value.length > 0 ? value : null,
            }
          : currentMapping,
      );
    });
  }

  function handleReset() {
    setDraftResult(null);
    setMapping(null);
  }

  const selectedFile = draftResult?.draft ?? null;

  return (
    <Surface component="section" sx={{ px: { xs: 3, sm: 4 }, py: 3 }}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge>CSV intake</Badge>
            <Badge tone="muted">Preview + mapping</Badge>
            <Badge tone="warning">Conservative dedupe</Badge>
          </div>
          <h2 className="font-heading text-foreground text-3xl font-semibold tracking-[-0.04em]">
            Spreadsheet import workspace
          </h2>
          <p className="text-muted max-w-3xl text-sm leading-7">
            Upload a CSV, map its headers into the tracked opportunity fields,
            review validation and duplicate warnings, then import only the clean
            rows through the guarded pipeline flow.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryCard
            label="Connector"
            supportingText={
              workspaceSnapshot?.connector?.isEnabled
                ? "Configured file-import connector"
                : "Seed or enable the CSV connector"
            }
            value={
              workspaceSnapshot?.connector?.sourceDisplayName ?? "Unavailable"
            }
          />
          <SummaryCard
            label="Limit"
            supportingText="Current guarded import cap"
            value="100 rows"
          />
          <SummaryCard
            label="Mode"
            supportingText="Imports only ready rows"
            value={isReadingFile ? "Reading…" : "Ready"}
          />
        </div>
      </div>

      {buildFeedbackBanner(feedback)}

      {!workspaceSnapshot ? (
        <ErrorState
          message="The CSV import workspace could not load organization agencies and duplicate-check context."
          title="CSV import is unavailable"
        />
      ) : (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <Surface sx={{ bgcolor: "background.paper", px: 2.5, py: 2.5 }}>
              <FormField
                hint="The current guarded import accepts one CSV file up to 256 KB and previews at most 100 rows."
                htmlFor="csv-import-file"
                label="Upload CSV file"
              >
                <div className="flex flex-col gap-3">
                  <Button component="label" variant="outlined">
                    {selectedFile ? "Replace CSV file" : "Choose CSV file"}
                    <input
                      accept=".csv,text/csv"
                      className="sr-only"
                      id="csv-import-file"
                      name="csvFile"
                      onChange={(event) => {
                        const file = event.currentTarget.files?.[0] ?? null;
                        void handleFileChange(file);
                      }}
                      type="file"
                    />
                  </Button>
                  <p className="text-muted text-sm">
                    {selectedFile
                      ? `${selectedFile.fileName} selected`
                      : "No file selected yet."}
                  </p>
                </div>
              </FormField>

              {selectedFile ? (
                <Surface tone="muted" sx={{ mt: 2, px: 2, py: 2 }}>
                  <p className="font-medium">{selectedFile.fileName}</p>
                  <p className="text-muted">
                    {selectedFile.rows.length} preview rows detected across{" "}
                    {selectedFile.headers.length} columns.
                  </p>
                </Surface>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  onClick={handleReset}
                  tone="neutral"
                  type="button"
                  variant="outlined"
                >
                  Clear upload
                </Button>
              </div>
            </Surface>

            <Surface sx={{ bgcolor: "background.paper", px: 2.5, py: 2.5 }}>
              <p className="text-muted text-xs tracking-[0.22em] uppercase">
                Mapping contract
              </p>
              <h3 className="font-heading text-foreground mt-2 text-2xl font-semibold tracking-[-0.03em]">
                Header-to-field mapping
              </h3>
              <div className="mt-4 space-y-4">
                {CSV_IMPORT_FIELD_DEFINITIONS.map((field) => (
                  <FormField
                    hint={field.description}
                    htmlFor={`csv-mapping-${field.key}`}
                    key={field.key}
                    label={field.label}
                  >
                    <Select
                      disabled={!draftResult?.draft || !mapping}
                      id={`csv-mapping-${field.key}`}
                      onChange={(event) =>
                        handleMappingChange(
                          field.key,
                          event.currentTarget.value,
                        )
                      }
                      value={mapping?.[field.key] ?? ""}
                    >
                      <option value="">
                        {field.required
                          ? "Select a CSV column"
                          : "Ignore this field"}
                      </option>
                      {(draftResult?.draft?.headers ?? []).map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                ))}
              </div>
            </Surface>
          </div>

          {draftResult?.errors.length ? (
            <ErrorState
              action={
                <ul className="list-disc space-y-1 pl-5 text-sm text-[rgb(133,69,49)]">
                  {draftResult.errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              }
              message="Resolve these file-level issues before importing rows."
              title="CSV file needs attention"
            />
          ) : null}

          {preview?.mappingErrors.length ? (
            <ErrorState
              action={
                <ul className="list-disc space-y-1 pl-5 text-sm text-[rgb(133,69,49)]">
                  {preview.mappingErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              }
              message="Fix the header mapping before importing."
              title="Mapping needs correction"
            />
          ) : null}

          {preview ? (
            <>
              <div className="grid gap-3 sm:grid-cols-4">
                <SummaryCard
                  label="Ready"
                  supportingText="Rows that will import"
                  value={String(preview.summary.readyRows)}
                />
                <SummaryCard
                  label="Invalid"
                  supportingText="Rows missing valid data"
                  value={String(preview.summary.invalidRows)}
                />
                <SummaryCard
                  label="Duplicates"
                  supportingText="Rows matching current pipeline"
                  value={String(preview.summary.duplicateRows)}
                />
                <SummaryCard
                  label="Review"
                  supportingText="Rows requiring manual follow-up"
                  value={String(preview.summary.reviewRows)}
                />
              </div>

              <form action={action} className="space-y-4">
                <input
                  name="csvText"
                  type="hidden"
                  value={draftResult?.draft?.csvText ?? ""}
                />
                <input
                  name="fileName"
                  type="hidden"
                  value={draftResult?.draft?.fileName ?? ""}
                />
                <input
                  name="mapping"
                  type="hidden"
                  value={JSON.stringify(mapping)}
                />

                <div className="flex flex-wrap gap-3">
                  <Button
                    disabled={
                      preview.hasBlockingErrors ||
                      preview.summary.readyRows === 0
                    }
                    type="submit"
                  >
                    {preview.summary.readyRows > 0
                      ? `Import ${preview.summary.readyRows} clean row${
                          preview.summary.readyRows === 1 ? "" : "s"
                        }`
                      : "No clean rows to import"}
                  </Button>
                  <p className="text-muted text-sm leading-6">
                    Rows flagged as invalid, duplicate, or review stay out of
                    the pipeline until the CSV is corrected.
                  </p>
                </div>
              </form>

              <DataTable
                ariaLabel="CSV import preview rows"
                columns={[
                  {
                    key: "row",
                    header: "Row",
                    className: "min-w-[6rem]",
                    cell: (row) => (
                      <div>
                        <p className="font-medium">{row.rowNumber}</p>
                        <p className="text-muted text-xs">
                          {row.statusMessage}
                        </p>
                      </div>
                    ),
                  },
                  {
                    key: "status",
                    header: "Status",
                    className: "min-w-[10rem]",
                    cell: (row) => (
                      <Badge tone={statusToneMap[row.status]}>
                        {statusLabelMap[row.status]}
                      </Badge>
                    ),
                  },
                  {
                    key: "title",
                    header: "Opportunity",
                    className: "min-w-[18rem]",
                    cell: (row) => (
                      <div className="space-y-2">
                        <p className="font-medium">
                          {row.mappedValues.title ?? "No mapped title"}
                        </p>
                        <p className="text-muted text-xs">
                          {row.mappedValues.solicitationNumber ??
                            "No solicitation number"}
                        </p>
                        {row.fieldErrors.title ? (
                          <p className="text-xs text-[rgb(163,78,56)]">
                            {row.fieldErrors.title}
                          </p>
                        ) : null}
                      </div>
                    ),
                  },
                  {
                    key: "agency",
                    header: "Agency + deadline",
                    className: "min-w-[16rem]",
                    cell: (row) => (
                      <div className="space-y-2">
                        <p className="font-medium">
                          {row.mappedValues.agencyLabel ??
                            row.mappedValues.csvAgencyValue ??
                            "No agency value"}
                        </p>
                        <p className="text-muted text-xs">
                          {row.mappedValues.responseDeadlineAt
                            ? `Due ${row.mappedValues.responseDeadlineAt}`
                            : "No response deadline"}
                        </p>
                        {row.fieldErrors.responseDeadlineAt ? (
                          <p className="text-xs text-[rgb(163,78,56)]">
                            {row.fieldErrors.responseDeadlineAt}
                          </p>
                        ) : null}
                      </div>
                    ),
                  },
                  {
                    key: "dedupe",
                    header: "Duplicate review",
                    className: "min-w-[18rem]",
                    cell: (row) => <DuplicateReviewCell row={row} />,
                  },
                ]}
                emptyState={
                  <EmptyState
                    message="Upload a CSV file to review row-level import readiness."
                    title="CSV preview rows"
                  />
                }
                getRowKey={(row) => `${row.rowNumber}-${row.status}`}
                rows={preview.rows}
              />
            </>
          ) : (
            <EmptyState
              message="Upload a CSV to auto-suggest header mappings, inspect validation issues, and preview conservative duplicate checks against the tracked pipeline."
              title="CSV preview"
            />
          )}
        </div>
      )}
    </Surface>
  );
}

function DuplicateReviewCell({ row }: { row: CsvImportPreviewRow }) {
  if (row.duplicateCandidates.length === 0 && row.warnings.length === 0) {
    return <p className="text-muted text-sm">No duplicate signals detected.</p>;
  }

  return (
    <div className="space-y-2">
      {row.duplicateCandidates.map((candidate) => (
        <Surface
          key={`${row.rowNumber}-${candidate.opportunityId}`}
          tone="muted"
          sx={{ px: 1.5, py: 1.5 }}
        >
          <p className="font-medium">{candidate.title}</p>
          <p className="text-muted text-xs">
            {candidate.matchKind === "exact"
              ? "Exact duplicate"
              : "Needs review"}
            {candidate.currentStageLabel
              ? ` • ${candidate.currentStageLabel}`
              : ""}
          </p>
          {candidate.matchReasons.map((reason) => (
            <p className="text-muted text-xs" key={reason}>
              {reason}
            </p>
          ))}
        </Surface>
      ))}
      {row.warnings.map((warning) => (
        <p className="text-xs text-[rgb(120,88,25)]" key={warning}>
          {warning}
        </p>
      ))}
    </div>
  );
}

function buildFeedbackBanner(feedback: CsvImportWorkspaceProps["feedback"]) {
  if (feedback.error) {
    return (
      <ErrorState
        message={feedback.error}
        title="CSV import could not complete"
      />
    );
  }

  if (feedback.status !== "imported") {
    return null;
  }

  return (
    <FeedbackBanner
      className="mt-6"
      message={
        <>
          Imported {feedback.importedCount ?? 0} row
          {(feedback.importedCount ?? 0) === 1 ? "" : "s"} into the tracked
          pipeline. Skipped {feedback.skippedCount ?? 0} row
          {(feedback.skippedCount ?? 0) === 1 ? "" : "s"} during server-side
          validation and duplicate review.
        </>
      }
      title="CSV import completed"
      tone="success"
    />
  );
}

function SummaryCard({
  label,
  supportingText,
  value,
}: {
  label: string;
  supportingText: string;
  value: string;
}) {
  return (
    <Surface sx={{ bgcolor: "background.paper", px: 2, py: 2 }}>
      <p className="text-muted text-xs tracking-[0.18em] uppercase">{label}</p>
      <p className="text-foreground mt-2 text-lg font-semibold">{value}</p>
      <p className="text-muted mt-2 text-xs leading-5">{supportingText}</p>
    </Surface>
  );
}

const statusToneMap = {
  duplicate: "warning",
  invalid: "danger",
  ready: "accent",
  review: "muted",
} as const;

const statusLabelMap = {
  duplicate: "Duplicate",
  invalid: "Invalid",
  ready: "Ready",
  review: "Review",
} as const;
