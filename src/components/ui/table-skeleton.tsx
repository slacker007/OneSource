import { Skeleton } from "./skeleton";

export function TableSkeleton({
  columnCount = 5,
  rowCount = 6,
}: {
  columnCount?: number;
  rowCount?: number;
}) {
  return (
    <div className="ui-surface overflow-hidden">
      <div className="overflow-x-auto">
        <table aria-hidden="true" className="min-w-full border-collapse">
          <thead className="bg-surface-muted">
            <tr>
              {Array.from({ length: columnCount }, (_, index) => (
                <th className="px-4 py-3" key={index} scope="col">
                  <Skeleton className="h-3 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rowCount }, (_, rowIndex) => (
              <tr className="border-border border-t" key={rowIndex}>
                {Array.from({ length: columnCount }, (_, columnIndex) => (
                  <td className="px-4 py-3.5" key={columnIndex}>
                    <Skeleton
                      className={
                        columnIndex === 0 ? "h-4 w-44" : "h-4 w-24"
                      }
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
