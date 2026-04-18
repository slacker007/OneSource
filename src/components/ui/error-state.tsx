import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type ErrorStateProps = {
  action?: ReactNode;
  className?: string;
  message: string;
  title: string;
};

export function ErrorState({
  action,
  className,
  message,
  title,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "rounded-[24px] border border-[rgba(133,69,49,0.18)] bg-[rgba(255,245,239,0.9)] px-5 py-6",
        className,
      )}
    >
      <p className="text-[rgb(115,52,30)] text-sm font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[rgb(133,69,49)]">{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
