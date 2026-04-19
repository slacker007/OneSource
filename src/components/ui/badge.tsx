import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

const toneClasses = {
  accent: "border-transparent bg-accent-soft text-accent-strong",
  muted: "border-border bg-surface text-foreground",
  info: "border-transparent bg-info-soft text-info",
  success: "border-transparent bg-success-soft text-success",
  warning: "border-transparent bg-warning-soft text-warning",
  danger: "border-transparent bg-danger-soft text-danger",
} as const;

type BadgeProps = {
  children: ReactNode;
  className?: string;
  tone?: keyof typeof toneClasses;
} & HTMLAttributes<HTMLSpanElement>;

export function Badge({
  children,
  className,
  tone = "accent",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold tracking-[0.16em] uppercase",
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
