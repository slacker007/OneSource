import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type EmptyStateProps = {
  action?: ReactNode;
  className?: string;
  message: string;
  title: string;
};

export function EmptyState({
  action,
  className,
  message,
  title,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "border-border rounded-[24px] border border-dashed bg-[rgba(15,28,31,0.02)] px-5 py-6",
        className,
      )}
    >
      <p className="text-foreground text-sm font-semibold">{title}</p>
      <p className="text-muted mt-2 text-sm leading-6">{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
