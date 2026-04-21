import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";

type PermissionDeniedStateProps = {
  action?: ReactNode;
  blockedArea: string;
  className?: string;
  message?: string;
  title?: string;
};

export function PermissionDeniedState({
  action,
  blockedArea,
  className,
  message = "The request was blocked by a server-side permission guard. If this access is expected, ask an administrator to review your role assignment.",
  title,
}: PermissionDeniedStateProps) {
  const resolvedTitle = title ?? `You do not have access to ${blockedArea}.`;

  return (
    <Surface
      className={className}
      component="section"
      sx={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(250,252,255,0.96))",
        borderColor: alpha("#295b78", 0.18),
        p: 2.5,
      }}
    >
      <Stack spacing={1.25}>
        <Typography
          sx={{
            color: "info.main",
            fontSize: "0.68rem",
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          Permission denied
        </Typography>
        <Typography
          component="h1"
          sx={{
            color: "info.main",
            fontFamily: "var(--font-heading), sans-serif",
            fontSize: "1.28rem",
            fontWeight: 600,
            letterSpacing: "-0.03em",
          }}
        >
          {resolvedTitle}
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
        <div>
        {action ?? (
          <Button
            href="/"
            tone="primary"
            variant="solid"
          >
            Return to dashboard
          </Button>
        )}
        </div>
      </Stack>
    </Surface>
  );
}
