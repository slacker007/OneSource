import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type DataTableColumn<Row> = {
  cell: (row: Row) => ReactNode;
  className?: string;
  header: ReactNode;
  headerClassName?: string;
  key: string;
};

type DataTableProps<Row> = {
  ariaLabel: string;
  className?: string;
  columns: Array<DataTableColumn<Row>>;
  emptyState?: ReactNode;
  getRowKey: (row: Row) => string;
  rows: Row[];
};

export function DataTable<Row>({
  ariaLabel,
  className,
  columns,
  emptyState,
  getRowKey,
  rows,
}: DataTableProps<Row>) {
  return (
    <div
      className={cn(
        "ui-surface overflow-hidden",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table aria-label={ariaLabel} className="min-w-full border-collapse">
          <thead className="bg-surface-muted">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 py-2.5 text-left text-[0.68rem] font-semibold tracking-[0.18em] text-muted uppercase",
                    column.headerClassName,
                  )}
                  scope="col"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr
                  key={getRowKey(row)}
                  className="border-border border-t align-top"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        "px-4 py-3.5 text-sm leading-6 text-foreground",
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
