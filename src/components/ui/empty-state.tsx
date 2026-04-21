import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

import { Surface } from "@/components/ui/surface";

type EmptyStateProps = {
  action?: ReactNode;
  className?: string;
  eyebrow?: string;
  message: string;
  title: string;
};

export function EmptyState({
  action,
  className,
  eyebrow = "No matching records",
  message,
  title,
}: EmptyStateProps) {
  return (
    <Surface
      className={className}
      sx={{
        borderStyle: "dashed",
        p: 2.5,
      }}
    >
      <Stack spacing={1.25}>
        <Typography
          sx={{
            color: "text.secondary",
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
