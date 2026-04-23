import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  ActiveFilterChipBar,
  type ActiveFilterChip,
} from "@/components/ui/active-filter-chip-bar";
import {
  DATA_TABLE_SURFACE_OVERFLOW,
  DATA_TABLE_SURFACE_RADIUS_PX,
  DataTable,
} from "@/components/ui/data-table";
import { DensityToggle } from "@/components/ui/density-toggle";
import { PreviewPanel } from "@/components/ui/preview-panel";
import { PreviewPanelSkeleton } from "@/components/ui/preview-panel-skeleton";
import { SavedViewControls } from "@/components/ui/saved-view-controls";
import { TableSkeleton } from "@/components/ui/table-skeleton";

describe("UI interaction primitives", () => {
  it("renders removable active filters and view controls", () => {
    const chips: ActiveFilterChip[] = [
      {
        href: "/opportunities?stage=qualified",
        label: "Stage · Qualified",
      },
      {
        href: "/opportunities?due=next_30_days",
        label: "Due · Next 30 days",
      },
    ];

    render(
      <div>
        <SavedViewControls
          items={[
            {
              active: true,
              href: "/opportunities",
              label: "All pursuits",
              supportingText: "Default",
            },
            {
              href: "/opportunities?due=next_30_days&sort=deadline_asc",
              label: "Due soon",
              supportingText: "30 days",
            },
          ]}
        />
        <ActiveFilterChipBar
          chips={chips}
          clearHref="/opportunities"
          emptyLabel="No filters"
        />
        <DensityToggle
          options={[
            { active: true, href: "/opportunities?density=compact", label: "Compact" },
            {
              href: "/opportunities",
              label: "Comfortable",
            },
          ]}
        />
      </div>,
    );

    const allPursuitsLink = screen.getByRole("link", {
      name: /all pursuits\s*default/i,
    });
    const stageFilterChip = screen.getByRole("link", {
      name: /remove stage · qualified/i,
    });
    const clearAllLink = screen.getByRole("link", { name: /clear all/i });
    const compactLink = screen.getByRole("link", { name: /^compact$/i });

    expect(allPursuitsLink).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(stageFilterChip).toHaveAttribute(
      "aria-label",
      "Remove Stage · Qualified",
    );
    expect(stageFilterChip).toHaveAttribute(
      "href",
      "/opportunities?stage=qualified",
    );
    expect(clearAllLink).toHaveAttribute(
      "href",
      "/opportunities",
    );
    expect(compactLink).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("renders selected data-table rows and preview shells", () => {
    render(
      <div>
        <DataTable
          ariaLabel="Test results"
          columns={[
            {
              cell: (row) => row.name,
              header: "Name",
              key: "name",
              sortDirection: "asc",
            },
            {
              cell: (row) => row.status,
              header: "Status",
              key: "status",
            },
          ]}
          density="compact"
          getRowKey={(row) => row.id}
          rows={[
            { id: "row_1", name: "Army Cloud Operations", status: "Qualified" },
            { id: "row_2", name: "VA Intake Automation", status: "Proposal" },
          ]}
          selectedRowId="row_1"
        />
        <PreviewPanel
          description="Opportunity summary and current next steps."
          eyebrow="Preview"
          label="Selected preview"
          metadata={[
            { label: "Stage", value: "Qualified" },
            { label: "Deadline", value: "May 8, 2026" },
          ]}
          title="Army Cloud Operations"
        >
          <p>Capture brief</p>
        </PreviewPanel>
        <TableSkeleton columnCount={3} rowCount={2} />
        <PreviewPanelSkeleton />
      </div>,
    );

    expect(screen.getByRole("table", { name: /test results/i })).toBeInTheDocument();
    expect(screen.getByRole("row", { selected: true })).toHaveTextContent(
      /army cloud operations/i,
    );
    expect(screen.getByText(/sorted ascending/i)).toBeInTheDocument();
    expect(screen.getByRole("row", { selected: true })).toHaveAttribute(
      "tabindex",
      "0",
    );
    expect(
      screen.getByRole("heading", { name: /army cloud operations/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/capture brief/i)[0]).toBeInTheDocument();
    expect(screen.getAllByRole("table")).toHaveLength(1);

    expect(DATA_TABLE_SURFACE_RADIUS_PX).toBe("12px");
    expect(DATA_TABLE_SURFACE_OVERFLOW).toBe("visible");
  });
});
