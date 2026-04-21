import Paper, { type PaperProps } from "@mui/material/Paper";
import { alpha } from "@mui/material/styles";

export type SurfaceTone = "default" | "muted";

type SurfaceProps = PaperProps & {
  tone?: SurfaceTone;
};

export function Surface({ sx, tone = "default", ...props }: SurfaceProps) {
  return (
    <Paper
      elevation={0}
      sx={
        [
          {
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 3.5,
            boxShadow: "0 16px 40px rgba(20, 37, 34, 0.08)",
          },
          ...(tone === "muted"
            ? [
                {
                  bgcolor: alpha("#122128", 0.035),
                },
              ]
            : []),
          ...(sx ? [sx] : []),
        ] as SurfaceProps["sx"]
      }
      {...props}
    />
  );
}
