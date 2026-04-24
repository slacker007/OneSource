import MuiSkeleton, {
  type SkeletonProps as MuiSkeletonProps,
} from "@mui/material/Skeleton";

import { mergeSx } from "@/components/ui/merge-sx";
import { onesourceTokens } from "@/theme/onesource-theme";

type SkeletonProps = MuiSkeletonProps;

export function Skeleton({ sx, ...props }: SkeletonProps) {
  return (
    <MuiSkeleton
      aria-hidden="true"
      animation="wave"
      sx={mergeSx(
        [
          {
            borderRadius: `${onesourceTokens.radius.panel}px`,
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
