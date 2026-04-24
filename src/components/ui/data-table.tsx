import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import type { ReactNode } from "react";

import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/cn";
import { onesourceTokens } from "@/theme/onesource-theme";

export type DataTableDensity = "compact" | "comfortable";
export type DataTableSortDirection = "asc" | "desc";
export const DATA_TABLE_SURFACE_OVERFLOW = "visible";
export const DATA_TABLE_SURFACE_RADIUS_PX = `${onesourceTokens.radius.button}px`;

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
    <Surface
      className={className}
      style={{
        borderRadius: DATA_TABLE_SURFACE_RADIUS_PX,
        overflow: DATA_TABLE_SURFACE_OVERFLOW,
      }}
    >
      <TableContainer style={{ borderRadius: DATA_TABLE_SURFACE_RADIUS_PX }}>
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
                  className={cn(column.headerClassName)}
                  component="th"
                  scope="col"
                  sx={{
                    backgroundColor: onesourceTokens.color.surface.default,
                    color: "text.secondary",
                    fontSize: onesourceTokens.typographyRole.eyebrow.fontSize,
                    fontWeight:
                      onesourceTokens.typographyRole.eyebrow.fontWeight,
                    letterSpacing:
                      onesourceTokens.typographyRole.eyebrow.letterSpacing,
                    px: 2,
                    py: 1.75,
                    textTransform: "uppercase",
                    ...(stickyHeader
                      ? {
                          backdropFilter: "blur(14px)",
                          backgroundColor: alphaFromHex(
                            onesourceTokens.color.background.strong,
                            0.92,
                          ),
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
                        Sorted{" "}
                        {column.sortDirection === "asc"
                          ? "ascending"
                          : "descending"}
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
                  className={cn(getRowClassName?.(row))}
                  tabIndex={0}
                  sx={{
                    transition: "background-color 160ms ease",
                    "&.Mui-selected": {
                      backgroundColor:
                        onesourceTokens.interaction.selectedOverlay,
                    },
                    "&.Mui-selected:hover": {
                      backgroundColor: alphaFromHex(
                        onesourceTokens.color.accent.main,
                        0.16,
                      ),
                    },
                    "&:focus-visible": {
                      backgroundColor:
                        onesourceTokens.interaction.selectedOverlay,
                      outline: `2px solid ${alphaFromHex(
                        onesourceTokens.color.accent.main,
                        0.32,
                      )}`,
                      outlineOffset: "-2px",
                    },
                    "&:hover": {
                      backgroundColor: onesourceTokens.interaction.hoverOverlay,
                    },
                  }}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={cn("text-foreground", column.className)}
                      sx={{
                        color: "text.primary",
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

function alphaFromHex(color: string, opacity: number) {
  const normalized = color.replace("#", "");

  if (normalized.length !== 6) {
    return color;
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}
