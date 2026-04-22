import MuiSkeleton, { type SkeletonProps as MuiSkeletonProps } from "@mui/material/Skeleton";

import { mergeSx } from "@/components/ui/merge-sx";

type SkeletonProps = MuiSkeletonProps;

export function Skeleton({ sx, ...props }: SkeletonProps) {
  return (
    <MuiSkeleton
      aria-hidden="true"
      animation="wave"
      sx={mergeSx(
        [
          {
            borderRadius: 1.5,
            transform: "none",
          },
        ],
        sx,
      )}
      variant="rounded"
      {...props}
    />
  );
}
