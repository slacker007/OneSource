import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";

import { Skeleton } from "./skeleton";
import { Surface } from "./surface";

export function PreviewPanelSkeleton() {
  return (
    <Surface
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2.5,
        height: "100%",
        px: { sm: 3, xs: 2.5 },
        py: 2.5,
      }}
    >
      <Stack spacing={1.5}>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </Stack>
      <Box>
        <Divider />
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { sm: "repeat(2, minmax(0, 1fr))", xs: "1fr" },
            py: 2.25,
          }}
        >
        {Array.from({ length: 4 }, (_, index) => (
          <Stack key={index} spacing={1}>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-full" />
          </Stack>
        ))}
        </Box>
        <Divider />
      </Box>
      <Stack direction="row" sx={{ columnGap: 1.5 }}>
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-32" />
      </Stack>
      <Stack spacing={1.5}>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </Stack>
    </Surface>
  );
}
