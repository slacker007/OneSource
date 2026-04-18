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
    <label className={cn("block space-y-2", className)} htmlFor={htmlFor}>
      <span className="text-foreground text-sm font-medium">{label}</span>
      {hint ? <p className="text-muted text-xs leading-5">{hint}</p> : null}
      {children}
      {error ? (
        <p className="text-xs leading-5 text-[rgb(133,69,49)]">{error}</p>
      ) : null}
    </label>
  );
}
