import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import type { ReactNode } from "react";

import { StatePanel } from "@/components/ui/state-panel";

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
    <StatePanel
      action={action}
      className={className}
      eyebrow={eyebrow}
      icon={<ReportProblemOutlinedIcon fontSize="small" />}
      message={message}
      title={title}
      tone="error"
    />
  );
}
