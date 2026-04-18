"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type PreviewResult = {
  agency: string;
  dueDate: string;
  id: string;
  noticeId: string;
  procurementType: string;
  sourceSystem: string;
  status: string;
  title: string;
};

const previewResults: PreviewResult[] = [
  {
    id: "preview_1",
    noticeId: "W912DY-26-R-0041",
    title: "Enterprise knowledge support and migration services",
    agency: "U.S. Army Corps of Engineers",
    procurementType: "Solicitation",
    status: "Active",
    dueDate: "05/04/2026",
    sourceSystem: "sam.gov",
  },
  {
    id: "preview_2",
    noticeId: "FA4861-26-R-0019",
    title: "Knowledge management modernization support",
    agency: "99th Contracting Squadron",
    procurementType: "Sources Sought",
    status: "Active",
    dueDate: "05/11/2026",
    sourceSystem: "sam.gov",
  },
];

const selectedPreview = previewResults[0];

export function SourceIntakePreview() {
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <section className="border-border bg-surface rounded-[28px] border px-5 py-6 shadow-[0_16px_40px_rgba(20,37,34,0.08)] sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge>Source intake</Badge>
              <Badge tone="muted">P4-01a next</Badge>
              <Badge tone="warning">Live connector pending</Badge>
            </div>
            <div className="space-y-2">
              <p className="text-muted text-xs tracking-[0.24em] uppercase">
                Connector preview
              </p>
              <h1 className="font-heading text-foreground text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                Search and import patterns are now standardized before live
                `sam.gov` work lands.
              </h1>
              <p className="text-muted max-w-3xl text-sm leading-7 sm:text-base">
                This route now demonstrates the shared form, badge, dialog,
                empty-state, and error-state primitives that later connector
                slices will reuse for real source search and import review.
              </p>
            </div>
          </div>

          <div className="rounded-[24px] border border-[rgba(15,28,31,0.08)] bg-white px-4 py-4 text-sm shadow-[0_12px_30px_rgba(20,37,34,0.06)]">
            <p className="text-muted text-xs tracking-[0.2em] uppercase">
              Current truth
            </p>
            <p className="text-foreground mt-2 font-semibold">
              Preview-only search surface
            </p>
            <p className="text-muted mt-1 leading-6">
              No external API calls run from this page yet. The UI is truthful
              about what exists today and gives later slices a shared pattern
              baseline.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="border-border rounded-[28px] border bg-white p-5 shadow-[0_14px_40px_rgba(19,36,34,0.06)]">
          <div className="space-y-2">
            <p className="text-muted text-xs tracking-[0.22em] uppercase">
              Search filters
            </p>
            <h2 className="font-heading text-foreground text-2xl font-semibold tracking-[-0.03em]">
              Canonical query form
            </h2>
            <p className="text-muted text-sm leading-6">
              Shared form-field styling is in place for source search filters
              before connector execution is implemented.
            </p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <FormField
              hint="Will map to the source-agnostic `keywords` filter."
              htmlFor="source-keywords"
              label="Keywords"
            >
              <Input
                id="source-keywords"
                readOnly
                value="knowledge management support"
              />
            </FormField>
            <FormField
              hint="Planned multi-select of official `ptype[]` codes."
              htmlFor="source-procurement-type"
              label="Procurement type"
            >
              <Select defaultValue="o" disabled id="source-procurement-type">
                <option value="o">Solicitation</option>
              </Select>
            </FormField>
            <FormField
              hint="Required by the current `sam.gov` search contract."
              htmlFor="source-posted-from"
              label="Posted from"
            >
              <Input id="source-posted-from" readOnly value="04/01/2026" />
            </FormField>
            <FormField
              hint="Required by the current `sam.gov` search contract."
              htmlFor="source-posted-to"
              label="Posted to"
            >
              <Input id="source-posted-to" readOnly value="04/18/2026" />
            </FormField>
            <FormField
              hint="Planned canonical agency filter."
              htmlFor="source-organization"
              label="Organization name"
            >
              <Input
                id="source-organization"
                readOnly
                value="99th Contracting Squadron"
              />
            </FormField>
            <FormField
              hint="Page-size rules will be enforced by connector validation."
              htmlFor="source-page-size"
              label="Page size"
            >
              <Input id="source-page-size" readOnly value="25" />
            </FormField>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="bg-accent rounded-full px-4 py-2 text-sm font-medium text-white shadow-[0_14px_32px_rgba(16,58,53,0.22)]"
              onClick={() => setIsPreviewDialogOpen(true)}
              type="button"
            >
              Preview import review
            </button>
            <button
              className="border-border text-muted rounded-full border bg-[rgba(15,28,31,0.03)] px-4 py-2 text-sm font-medium"
              disabled
              type="button"
            >
              Search connector in P4-01a
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <div className="border-border rounded-[28px] border bg-white p-5 shadow-[0_14px_40px_rgba(19,36,34,0.06)]">
            <p className="text-muted text-xs tracking-[0.22em] uppercase">
              Connector status
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>sam.gov</Badge>
              <Badge tone="muted">typed filters ready</Badge>
              <Badge tone="warning">execution blocked until P7-03</Badge>
            </div>
            <ErrorState
              className="mt-4"
              message="The live connector boundary, retries, validation, and audit-backed execution metadata are still scheduled for later implementation. This surface remains a truthful Phase 3 preview."
              title="Live search execution is not available yet"
            />
          </div>

          <div className="border-border rounded-[28px] border bg-white p-5 shadow-[0_14px_40px_rgba(19,36,34,0.06)]">
            <p className="text-muted text-xs tracking-[0.22em] uppercase">
              Saved searches
            </p>
            <h2 className="font-heading text-foreground mt-2 text-2xl font-semibold tracking-[-0.03em]">
              Empty-state baseline
            </h2>
            <EmptyState
              className="mt-4"
              message="Saved connector queries will appear here once search persistence is wired into the page."
              title="No saved source searches yet"
            />
          </div>
        </section>
      </div>

      <section className="border-border rounded-[28px] border bg-white p-5 shadow-[0_14px_40px_rgba(19,36,34,0.06)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-muted text-xs tracking-[0.22em] uppercase">
              Preview results
            </p>
            <h2 className="font-heading text-foreground text-2xl font-semibold tracking-[-0.03em]">
              Shared result table
            </h2>
            <p className="text-muted text-sm leading-6">
              Data-table styling is now centralized so later list, search, and
              admin pages do not invent incompatible row treatments.
            </p>
          </div>
          <Badge tone="muted">2 illustrative records</Badge>
        </div>

        <DataTable
          ariaLabel="Source preview results"
          className="mt-5"
          columns={[
            {
              key: "noticeId",
              header: "Notice",
              cell: (row) => (
                <div>
                  <p className="font-medium">{row.noticeId}</p>
                  <p className="text-muted text-xs">{row.sourceSystem}</p>
                </div>
              ),
            },
            {
              key: "title",
              header: "Opportunity",
              cell: (row) => (
                <div>
                  <p className="font-medium">{row.title}</p>
                  <p className="text-muted text-xs">{row.agency}</p>
                </div>
              ),
            },
            {
              key: "procurementType",
              header: "Type",
              cell: (row) => <Badge tone="muted">{row.procurementType}</Badge>,
            },
            {
              key: "status",
              header: "Status",
              cell: (row) => <Badge>{row.status}</Badge>,
            },
            {
              key: "dueDate",
              header: "Due date",
              cell: (row) => row.dueDate,
            },
          ]}
          emptyState={
            <EmptyState
              message="Connector result rows will appear here once live execution is wired in."
              title="No source results yet"
            />
          }
          getRowKey={(row) => row.id}
          rows={previewResults}
        />
      </section>

      <Dialog
        description="This dialog demonstrates the shared import-preview treatment before live deduplication and promotion flows arrive."
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <button
              className="border-border rounded-full border bg-white px-4 py-2 text-sm font-medium"
              onClick={() => setIsPreviewDialogOpen(false)}
              type="button"
            >
              Close preview
            </button>
            <button
              className="rounded-full bg-[rgba(15,28,31,0.08)] px-4 py-2 text-sm font-medium text-muted"
              disabled
              type="button"
            >
              Promote in P4-01b
            </button>
          </div>
        }
        onClose={() => setIsPreviewDialogOpen(false)}
        open={isPreviewDialogOpen}
        title="Import preview"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[24px] border border-[rgba(15,28,31,0.08)] bg-white p-4">
            <p className="text-muted text-xs tracking-[0.18em] uppercase">
              Selected record
            </p>
            <p className="font-heading text-foreground mt-3 text-2xl font-semibold">
              {selectedPreview.title}
            </p>
            <p className="text-muted mt-2 text-sm leading-6">
              {selectedPreview.agency}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>{selectedPreview.status}</Badge>
              <Badge tone="muted">{selectedPreview.procurementType}</Badge>
            </div>
          </div>
          <div className="rounded-[24px] border border-[rgba(15,28,31,0.08)] bg-white p-4">
            <p className="text-muted text-xs tracking-[0.18em] uppercase">
              Promotion contract
            </p>
            <ul className="mt-3 space-y-3 text-sm leading-6 text-foreground">
              <li>Preserve source lineage, raw payloads, and normalized data.</li>
              <li>Record the import decision separately from the canonical opportunity.</li>
              <li>Apply deduplication and promotion controls in `P4-01b`.</li>
            </ul>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
