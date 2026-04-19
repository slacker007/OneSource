import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type PreviewPanelMetadataItem = {
  label: string;
  value: ReactNode;
};

export function PreviewPanel({
  actions,
  children,
  className,
  description,
  eyebrow,
  metadata = [],
  title,
}: {
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  description?: ReactNode;
  eyebrow?: ReactNode;
  metadata?: PreviewPanelMetadataItem[];
  title: ReactNode;
}) {
  return (
    <aside
      className={cn(
        "ui-surface flex h-full flex-col gap-5 px-5 py-5 sm:px-6",
        className,
      )}
    >
      <div className="space-y-3">
        {eyebrow ? (
          <p className="text-muted text-xs tracking-[0.2em] uppercase">{eyebrow}</p>
        ) : null}
        <div className="space-y-2">
          <h2 className="font-heading text-foreground text-2xl font-semibold tracking-[-0.03em]">
            {title}
          </h2>
          {description ? (
            <div className="text-muted text-sm leading-6">{description}</div>
          ) : null}
        </div>
      </div>

      {metadata.length > 0 ? (
        <dl className="grid gap-3 border-border border-y py-4 sm:grid-cols-2">
          {metadata.map((item) => (
            <div key={item.label}>
              <dt className="text-muted text-[0.68rem] font-semibold tracking-[0.18em] uppercase">
                {item.label}
              </dt>
              <dd className="mt-1 text-sm leading-6 text-foreground">{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}

      {children ? <div className="space-y-4 text-sm">{children}</div> : null}
    </aside>
  );
}
