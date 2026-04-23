import type { SxProps, Theme } from "@mui/material/styles";

export function mergeSx(
  base: Array<Exclude<SxProps<Theme>, readonly unknown[]>>,
  sx?: SxProps<Theme>,
) {
  if (!sx) {
    return base as SxProps<Theme>;
  }

  if (Array.isArray(sx)) {
    return [...base, ...sx] as SxProps<Theme>;
  }

  return [...base, sx] as SxProps<Theme>;
}
