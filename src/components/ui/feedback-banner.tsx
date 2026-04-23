import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import type { AriaRole, ReactNode } from "react";

export type FeedbackBannerTone = "info" | "success" | "warning" | "danger";

type FeedbackBannerProps = {
  ariaLive?: "assertive" | "off" | "polite";
  action?: ReactNode;
  className?: string;
  message: ReactNode;
  role?: AriaRole;
  title: ReactNode;
  tone?: FeedbackBannerTone;
};

const severityByTone = {
  danger: "error",
  info: "info",
  success: "success",
  warning: "warning",
} as const;

const borderColorByTone = {
  danger: "error.light",
  info: "info.light",
  success: "success.light",
  warning: "warning.light",
} as const;

export function FeedbackBanner({
  ariaLive,
  action,
  className,
  message,
  role,
  title,
  tone = "info",
}: FeedbackBannerProps) {
  const resolvedRole = role ?? (tone === "success" ? "status" : "alert");
  const resolvedAriaLive =
    ariaLive ?? (resolvedRole === "status" ? "polite" : "assertive");

  return (
    <Alert
      aria-live={resolvedAriaLive}
      className={className}
      role={resolvedRole}
      severity={severityByTone[tone]}
      sx={{
        alignItems: "flex-start",
        border: 1,
        borderColor: borderColorByTone[tone],
        borderRadius: 3,
        boxShadow: "0 16px 40px rgba(20, 37, 34, 0.08)",
        px: 2,
        py: 1.5,
        "& .MuiAlert-action": {
          alignItems: "center",
          ml: 1.5,
        },
        "& .MuiAlert-icon": {
          mt: 0.125,
        },
        "& .MuiAlert-message": {
          width: "100%",
        },
      }}
      action={action}
      variant="filled"
    >
      <AlertTitle sx={{ fontSize: "0.92rem", fontWeight: 700, mb: 0.5 }}>
        {title}
      </AlertTitle>
      {message}
    </Alert>
  );
}
