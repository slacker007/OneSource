import Link from "next/link";

import { cn } from "@/lib/cn";

export type DensityToggleOption = {
  active?: boolean;
  href: string;
  label: string;
};

export function DensityToggle({
  className,
  label = "Density",
  options,
}: {
  className?: string;
  label?: string;
  options: DensityToggleOption[];
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <p className="text-muted text-xs font-medium tracking-[0.18em] uppercase">
        {label}
      </p>
      <div className="inline-flex items-center rounded-[var(--radius-pill)] border border-border bg-surface-muted p-1">
        {options.map((option) => (
          <Link
            aria-current={option.active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-8 items-center rounded-[var(--radius-pill)] px-3 text-sm font-medium transition",
              option.active
                ? "bg-surface-strong text-foreground shadow-[0_8px_18px_rgba(18,33,40,0.08)]"
                : "text-muted hover:text-foreground",
            )}
            href={option.href}
            key={option.label}
          >
            {option.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
