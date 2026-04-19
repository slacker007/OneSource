import Link from "next/link";

import { cn } from "@/lib/cn";

export type SavedViewControlItem = {
  active?: boolean;
  href: string;
  label: string;
  supportingText?: string;
};

export function SavedViewControls({
  className,
  items,
  label = "Views",
}: {
  className?: string;
  items: SavedViewControlItem[];
  label?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-muted text-xs font-medium tracking-[0.18em] uppercase">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Link
            aria-current={item.active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-10 items-center gap-2 rounded-[var(--radius-pill)] border px-3 py-2 text-sm transition",
              item.active
                ? "border-accent bg-accent-soft text-foreground"
                : "border-border bg-surface-strong text-muted hover:border-border-strong hover:text-foreground",
            )}
            href={item.href}
            key={item.label}
          >
            <span className="font-medium">{item.label}</span>
            {item.supportingText ? (
              <span className="text-xs text-muted">{item.supportingText}</span>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
}
