import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type FormFieldProps = {
  children: ReactNode;
  className?: string;
  error?: string;
  hint?: string;
  htmlFor?: string;
  label: string;
};

export function FormField({
  children,
  className,
  error,
  hint,
  htmlFor,
  label,
}: FormFieldProps) {
  return (
    <label className={cn("block space-y-1.5", className)} htmlFor={htmlFor}>
      <span className="text-foreground text-sm font-semibold">{label}</span>
      {hint ? <p className="text-muted text-xs leading-5">{hint}</p> : null}
      {children}
      {error ? (
        <p className="text-danger text-xs leading-5">{error}</p>
      ) : null}
    </label>
  );
}
