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
        "border-border overflow-hidden rounded-[24px] border bg-white",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table aria-label={ariaLabel} className="min-w-full border-collapse">
          <thead className="bg-[rgba(15,28,31,0.04)]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 py-3 text-left text-xs tracking-[0.18em] text-muted uppercase",
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
                        "px-4 py-4 text-sm leading-6 text-foreground",
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
