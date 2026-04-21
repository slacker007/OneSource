import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import type { ReactNode } from "react";

import { StatePanel } from "@/components/ui/state-panel";

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
    <StatePanel
      action={action}
      className={className}
      eyebrow={eyebrow}
      icon={<InboxOutlinedIcon fontSize="small" />}
      message={message}
      sx={{
        borderStyle: "dashed",
      }}
      title={title}
      tone="neutral"
    />
  );
}
