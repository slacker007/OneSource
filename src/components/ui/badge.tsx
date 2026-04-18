import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

const toneClasses = {
  accent: "bg-accent-soft text-accent-strong border-transparent",
  muted: "border-border bg-white text-foreground",
  warning: "border-transparent bg-[rgba(168,93,42,0.12)] text-[rgb(133,69,49)]",
  danger: "border-transparent bg-[rgba(148,53,53,0.12)] text-[rgb(125,39,39)]",
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
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-[0.16em] uppercase",
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
