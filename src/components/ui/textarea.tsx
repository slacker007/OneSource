import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "ui-field min-h-32 px-3.5 py-2.5 text-sm",
        className,
      )}
      {...props}
    />
  );
}
