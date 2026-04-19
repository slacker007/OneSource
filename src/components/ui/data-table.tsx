import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type DataTableDensity = "compact" | "comfortable";
export type DataTableSortDirection = "asc" | "desc";

type DataTableColumn<Row> = {
  cell: (row: Row) => ReactNode;
  className?: string;
  header: ReactNode;
  headerClassName?: string;
  key: string;
  sortDirection?: DataTableSortDirection | null;
};

type DataTableProps<Row> = {
  ariaLabel: string;
  caption?: ReactNode;
  className?: string;
  columns: Array<DataTableColumn<Row>>;
  density?: DataTableDensity;
  emptyState?: ReactNode;
  getRowKey: (row: Row) => string;
  getRowClassName?: (row: Row) => string | undefined;
  rows: Row[];
  selectedRowId?: string | null;
  stickyHeader?: boolean;
};

export function DataTable<Row>({
  ariaLabel,
  caption,
  className,
  columns,
  density = "comfortable",
  emptyState,
  getRowKey,
  getRowClassName,
  rows,
  selectedRowId,
  stickyHeader = true,
}: DataTableProps<Row>) {
  const cellPaddingClass =
    density === "compact" ? "px-4 py-2.5 text-[0.92rem]" : "px-4 py-3.5 text-sm";

  return (
    <div className={cn("ui-surface overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table aria-label={ariaLabel} className="min-w-full border-collapse">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead className="bg-surface-muted">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 py-3 text-left text-[0.68rem] font-semibold tracking-[0.18em] text-muted uppercase",
                    stickyHeader &&
                      "sticky top-0 z-10 bg-[color:color-mix(in_srgb,var(--surface-muted)_88%,white_12%)] backdrop-blur",
                    column.headerClassName,
                  )}
                  scope="col"
                >
                  <div className="flex items-center gap-2">
                    <span>{column.header}</span>
                    {column.sortDirection ? (
                      <span
                        aria-hidden="true"
                        className="text-[0.78rem] text-foreground"
                      >
                        {column.sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    ) : null}
                    {column.sortDirection ? (
                      <span className="sr-only">
                        Sorted {column.sortDirection === "asc" ? "ascending" : "descending"}
                      </span>
                    ) : null}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr
                  key={getRowKey(row)}
                  aria-selected={selectedRowId === getRowKey(row)}
                  tabIndex={0}
                  className={cn(
                    "border-border border-t align-top transition-colors hover:bg-[color:color-mix(in_srgb,var(--surface-muted)_68%,white_32%)] focus-visible:bg-[color:color-mix(in_srgb,var(--accent-soft)_55%,white_45%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 focus-visible:ring-inset",
                    selectedRowId === getRowKey(row) &&
                      "bg-[color:color-mix(in_srgb,var(--accent-soft)_55%,white_45%)]",
                    getRowClassName?.(row),
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        cellPaddingClass + " leading-6 text-foreground",
                        column.className,
                      )}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr className="border-border border-t">
                <td className="p-4" colSpan={columns.length}>
                  {emptyState}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
