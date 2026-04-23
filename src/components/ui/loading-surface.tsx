import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";

type LoadingSurfaceProps = {
  actionCount?: number;
  className?: string;
  children?: ReactNode;
  messageWidths?: Array<number | string>;
  titleWidth?: number | string;
};

export function LoadingSurface({
  actionCount = 0,
  children,
  className,
  messageWidths = ["100%", "72%"],
  titleWidth = "40%",
}: LoadingSurfaceProps) {
  return (
    <Surface className={className} sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Stack spacing={1.25}>
          <Skeleton height={10} width={112} />
          <Skeleton height={38} width={titleWidth} />
          {messageWidths.map((width, index) => (
            <Skeleton height={16} key={`${width}-${index}`} width={width} />
          ))}
        </Stack>

        {actionCount > 0 ? (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1.5,
            }}
          >
            {Array.from({ length: actionCount }, (_, index) => (
              <Skeleton height={40} key={index} width={132} />
            ))}
          </Box>
        ) : null}

        {children ? <Box>{children}</Box> : null}
      </Stack>
    </Surface>
  );
}
