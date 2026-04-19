import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

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
    <div className={cn("ui-state ui-state-danger", className)}>
      <p className="ui-state-eyebrow">{eyebrow}</p>
      <p className="ui-state-title">{title}</p>
      <p className="ui-state-body">{message}</p>
      {action ? <div className="ui-state-actions">{action}</div> : null}
    </div>
  );
}
