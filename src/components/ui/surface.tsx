import Paper, { type PaperProps } from "@mui/material/Paper";

import { onesourceTokens } from "@/theme/onesource-theme";

export type SurfaceTone = "default" | "muted" | "warm";
export type SurfaceDensity = "comfortable" | "compact";

type SurfaceProps = PaperProps & {
  density?: SurfaceDensity;
  tone?: SurfaceTone;
};

export function Surface({
  density = "comfortable",
  sx,
  tone = "default",
  ...props
}: SurfaceProps) {
  return (
    <Paper
      elevation={0}
      sx={
        [
          {
            bgcolor:
              tone === "muted"
                ? onesourceTokens.color.surface.muted
                : tone === "warm"
                  ? onesourceTokens.color.surface.warm
                  : onesourceTokens.color.surface.raised,
            border: "1px solid",
            borderColor: onesourceTokens.color.border.subtle,
            borderRadius: `${onesourceTokens.radius.panel}px`,
            boxShadow:
              density === "compact"
                ? onesourceTokens.elevation.surface
                : onesourceTokens.elevation.raised,
          },
          ...(sx ? [sx] : []),
        ] as SurfaceProps["sx"]
      }
      {...props}
    />
  );
}
