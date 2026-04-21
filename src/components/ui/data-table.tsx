import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { alpha } from "@mui/material/styles";
import type { ReactNode } from "react";

import { Surface } from "@/components/ui/surface";
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
  const compact = density === "compact";

  return (
    <Surface className={className} sx={{ overflow: "hidden" }}>
      <TableContainer>
        <Table
          aria-label={ariaLabel}
          size={compact ? "small" : "medium"}
          stickyHeader={stickyHeader}
          sx={{
            minWidth: "100%",
            tableLayout: "auto",
            "& .MuiTableCell-root": {
              borderBottomColor: "divider",
              verticalAlign: "top",
            },
          }}
        >
          {caption ? (
            <caption
              style={{
                border: 0,
                clip: "rect(0 0 0 0)",
                height: "1px",
                margin: "-1px",
                overflow: "hidden",
                padding: 0,
                position: "absolute",
                whiteSpace: "nowrap",
                width: "1px",
              }}
            >
              {caption}
            </caption>
          ) : null}
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  className={cn(
                    column.headerClassName,
                  )}
                  component="th"
                  scope="col"
                  sx={{
                    backgroundColor: alpha("#122128", 0.035),
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    px: 2,
                    py: 1.75,
                    textTransform: "uppercase",
                    ...(stickyHeader
                      ? {
                          backdropFilter: "blur(14px)",
                          backgroundColor: alpha("#f7f4ec", 0.92),
                        }
                      : {}),
                  }}
                >
                  <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
                    <span>{column.header}</span>
                    {column.sortDirection ? (
                      <Box
                        aria-hidden="true"
                        component="span"
                        sx={{ color: "text.primary", fontSize: "0.78rem" }}
                      >
                        {column.sortDirection === "asc" ? "↑" : "↓"}
                      </Box>
                    ) : null}
                    {column.sortDirection ? (
                      <Box
                        component="span"
                        sx={{
                          border: 0,
                          clip: "rect(0 0 0 0)",
                          height: "1px",
                          margin: "-1px",
                          overflow: "hidden",
                          padding: 0,
                          position: "absolute",
                          whiteSpace: "nowrap",
                          width: "1px",
                        }}
                      >
                        Sorted {column.sortDirection === "asc" ? "ascending" : "descending"}
                      </Box>
                    ) : null}
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <TableRow
                  key={getRowKey(row)}
                  aria-selected={selectedRowId === getRowKey(row)}
                  hover
                  selected={selectedRowId === getRowKey(row)}
                  className={cn(
                    getRowClassName?.(row),
                  )}
                  tabIndex={0}
                  sx={{
                    transition: "background-color 160ms ease",
                    "&.Mui-selected": {
                      backgroundColor: alpha("#1e5d66", 0.1),
                    },
                    "&.Mui-selected:hover": {
                      backgroundColor: alpha("#1e5d66", 0.14),
                    },
                    "&:focus-visible": {
                      backgroundColor: alpha("#1e5d66", 0.12),
                      outline: `2px solid ${alpha("#1e5d66", 0.32)}`,
                      outlineOffset: "-2px",
                    },
                    "&:hover": {
                      backgroundColor: alpha("#122128", 0.035),
                    },
                  }}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={cn(
                        "text-foreground",
                        column.className,
                      )}
                      sx={{
                        fontSize: compact ? "0.92rem" : "0.95rem",
                        lineHeight: 1.65,
                        px: 2,
                        py: compact ? 1.5 : 2.25,
                      }}
                    >
                      {column.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} sx={{ p: 2 }}>
                  {emptyState}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Surface>
  );
}
