import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { StatePanel } from "@/components/ui/state-panel";

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
    <StatePanel
      action={
        action ?? (
          <Button
            href="/"
            tone="primary"
            variant="solid"
          >
            Return to dashboard
          </Button>
        )
      }
      className={className}
      component="section"
      eyebrow="Permission denied"
      icon={<ShieldOutlinedIcon fontSize="small" />}
      message={message}
      sx={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(250,252,255,0.96))",
      }}
      title={resolvedTitle}
      titleComponent="h1"
      tone="info"
    />
  );
}
