import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "ui-field px-3.5 py-2.5 text-sm",
        className,
      )}
      {...props}
    />
  );
}
