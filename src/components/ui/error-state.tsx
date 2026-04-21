import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import type { ReactNode } from "react";

import { Surface } from "@/components/ui/surface";

type ErrorStateProps = {
  action?: ReactNode;
  className?: string;
  eyebrow?: string;
  message: string;
  title: string;
};

export function ErrorState({
  action,
  className,
  eyebrow = "Attention required",
  message,
  title,
}: ErrorStateProps) {
  return (
    <Surface
      className={className}
      sx={{
        bgcolor: alpha("#9b4138", 0.04),
        borderColor: alpha("#9b4138", 0.2),
        p: 2.5,
      }}
    >
      <Stack spacing={1.25}>
        <Typography
          sx={{
            color: "error.main",
            fontSize: "0.68rem",
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          {eyebrow}
        </Typography>
        <Typography
          component="h2"
          sx={{
            color: "error.main",
            fontFamily: "var(--font-heading), sans-serif",
            fontSize: "1.28rem",
            fontWeight: 600,
            letterSpacing: "-0.03em",
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            color: "text.secondary",
            fontSize: "0.94rem",
            lineHeight: 1.6,
            maxWidth: "62ch",
          }}
        >
          {message}
        </Typography>
        {action ? <div>{action}</div> : null}
      </Stack>
    </Surface>
  );
}
