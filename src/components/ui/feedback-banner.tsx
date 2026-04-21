import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import { alpha } from "@mui/material/styles";
import type { ReactNode } from "react";

export type FeedbackBannerTone = "info" | "success" | "warning" | "danger";

type FeedbackBannerProps = {
  action?: ReactNode;
  className?: string;
  message: ReactNode;
  title: ReactNode;
  tone?: FeedbackBannerTone;
};

const severityByTone = {
  danger: "error",
  info: "info",
  success: "success",
  warning: "warning",
} as const;

export function FeedbackBanner({
  action,
  className,
  message,
  title,
  tone = "info",
}: FeedbackBannerProps) {
  return (
    <Alert
      className={className}
      role="alert"
      severity={severityByTone[tone]}
      sx={{
        alignItems: "flex-start",
        borderRadius: 3,
        border: (theme) =>
          `1px solid ${alpha(theme.palette[severityByTone[tone]].main, 0.2)}`,
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
