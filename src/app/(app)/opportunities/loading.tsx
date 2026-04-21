import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";

import { LoadingSurface } from "@/components/ui/loading-surface";
import { PreviewPanelSkeleton } from "@/components/ui/preview-panel-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/ui/table-skeleton";

export default function OpportunitiesLoading() {
  return (
    <Stack spacing={3}>
      <LoadingSurface actionCount={3} titleWidth={288} />

      <LoadingSurface
        actionCount={2}
        messageWidths={["100%", "68%"]}
        titleWidth={320}
      >
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              lg: "repeat(2, minmax(0, 1fr))",
              xl: "repeat(4, minmax(0, 1fr))",
            },
            mt: 1,
          }}
        >
          {Array.from({ length: 8 }, (_, index) => (
            <Stack key={index} spacing={1}>
              <Skeleton height={12} width={84} />
              <Skeleton height={48} width="100%" />
            </Stack>
          ))}
        </Box>
      </LoadingSurface>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            xl: "minmax(0,1fr) 24rem",
          },
        }}
      >
        <TableSkeleton />
        <PreviewPanelSkeleton />
      </Box>
    </Stack>
  );
}
