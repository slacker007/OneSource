"use client";

import { useId } from "react";
import type { ReactNode } from "react";

type DialogProps = {
  children: ReactNode;
  description?: string;
  footer?: ReactNode;
  onClose: () => void;
  open: boolean;
  title: string;
};

export function Dialog({
  children,
  description,
  footer,
  onClose,
  open,
  title,
}: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        aria-label={`Close ${title}`}
        className="absolute inset-0 bg-[rgba(15,28,31,0.5)]"
        onClick={onClose}
        type="button"
      />
      <div
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className="border-border relative z-10 w-full max-w-2xl rounded-[32px] border bg-[rgba(255,249,239,0.98)] p-6 shadow-[0_30px_90px_rgba(15,28,31,0.22)]"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h2
              className="font-heading text-foreground text-3xl font-semibold tracking-[-0.04em]"
              id={titleId}
            >
              {title}
            </h2>
            {description ? (
              <p className="text-muted max-w-2xl text-sm leading-6" id={descriptionId}>
                {description}
              </p>
            ) : null}
          </div>
          <button
            aria-label={`Dismiss ${title}`}
            className="border-border rounded-full border bg-white px-3 py-2 text-sm font-medium"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <div className="mt-6">{children}</div>

        {footer ? <div className="mt-6 border-border border-t pt-4">{footer}</div> : null}
      </div>
    </div>
  );
}
