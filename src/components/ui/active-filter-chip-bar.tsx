import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type ActiveFilterChip = {
  href?: string;
  label: string;
  leadingVisual?: ReactNode;
};

export function ActiveFilterChipBar({
  chips,
  className,
  clearHref,
  emptyLabel = "No active filters",
}: {
  chips: ActiveFilterChip[];
  className?: string;
  clearHref?: string;
  emptyLabel?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        className,
      )}
    >
      {chips.length > 0 ? (
        <>
          {chips.map((chip) =>
            chip.href ? (
              <Link
                aria-label={`Remove ${chip.label}`}
                className="inline-flex min-h-9 items-center gap-2 rounded-[var(--radius-pill)] border border-border bg-surface-strong px-3 py-2 text-sm text-foreground transition hover:border-border-strong hover:bg-[color:color-mix(in_srgb,var(--surface-muted)_64%,white_36%)]"
                href={chip.href}
                key={chip.label}
              >
                {chip.leadingVisual}
                <span>{chip.label}</span>
                <span aria-hidden="true" className="text-muted">
                  ×
                </span>
              </Link>
            ) : (
              <span
                className="inline-flex min-h-9 items-center gap-2 rounded-[var(--radius-pill)] border border-border bg-surface-strong px-3 py-2 text-sm text-foreground"
                key={chip.label}
              >
                {chip.leadingVisual}
                <span>{chip.label}</span>
              </span>
            ),
          )}

          {clearHref ? (
            <Link
              className="inline-flex min-h-9 items-center rounded-[var(--radius-pill)] px-2 text-sm font-medium text-accent transition hover:text-accent-strong hover:underline"
              href={clearHref}
            >
              Clear all
            </Link>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-muted">{emptyLabel}</p>
      )}
    </div>
  );
}
