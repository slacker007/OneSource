import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import { Skeleton } from "./skeleton";
import { Surface } from "./surface";

export function TableSkeleton({
  columnCount = 5,
  rowCount = 6,
}: {
  columnCount?: number;
  rowCount?: number;
}) {
  return (
    <Surface sx={{ overflow: "hidden" }}>
      <TableContainer>
        <Table aria-hidden="true" size="small" sx={{ minWidth: "100%" }}>
          <TableHead>
            <TableRow>
              {Array.from({ length: columnCount }, (_, index) => (
                <TableCell key={index} scope="col" sx={{ px: 2, py: 1.75 }}>
                  <Skeleton className="h-3 w-20" />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: rowCount }, (_, rowIndex) => (
              <TableRow key={rowIndex}>
                {Array.from({ length: columnCount }, (_, columnIndex) => (
                  <TableCell key={columnIndex} sx={{ px: 2, py: 2 }}>
                    <Skeleton
                      className={
                        columnIndex === 0 ? "h-4 w-44" : "h-4 w-24"
                      }
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Surface>
  );
}
