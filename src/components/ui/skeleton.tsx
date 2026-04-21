import MuiSkeleton, { type SkeletonProps as MuiSkeletonProps } from "@mui/material/Skeleton";

type SkeletonProps = MuiSkeletonProps;

export function Skeleton({ sx, ...props }: SkeletonProps) {
  return (
    <MuiSkeleton
      aria-hidden="true"
      animation="wave"
      sx={
        [
          {
            borderRadius: 1.5,
            transform: "none",
          },
          ...(sx ? [sx] : []),
        ] as MuiSkeletonProps["sx"]
      }
      variant="rounded"
      {...props}
    />
  );
}
