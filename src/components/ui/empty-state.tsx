import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

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
    <div className={cn("ui-state ui-state-neutral border-dashed", className)}>
      <p className="ui-state-eyebrow">{eyebrow}</p>
      <p className="ui-state-title">{title}</p>
      <p className="ui-state-body">{message}</p>
      {action ? <div className="ui-state-actions">{action}</div> : null}
    </div>
  );
}
