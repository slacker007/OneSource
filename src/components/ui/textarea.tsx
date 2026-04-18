import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "border-border text-foreground min-h-32 w-full rounded-[18px] border bg-white px-4 py-3 text-sm shadow-[0_12px_28px_rgba(20,37,34,0.05)] transition outline-none placeholder:text-[rgba(94,103,95,0.88)] focus:border-[rgba(32,95,85,0.38)] disabled:cursor-not-allowed disabled:bg-[rgba(15,28,31,0.04)] disabled:text-muted",
        className,
      )}
      {...props}
    />
  );
}
