import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "border-border text-foreground w-full rounded-[18px] border bg-white px-4 py-3 text-sm shadow-[0_12px_28px_rgba(20,37,34,0.05)] transition outline-none focus:border-[rgba(32,95,85,0.38)] disabled:cursor-not-allowed disabled:bg-[rgba(15,28,31,0.04)] disabled:text-muted",
        className,
      )}
      {...props}
    />
  );
}
