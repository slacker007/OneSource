"use client";

import { useId } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type DrawerProps = {
  children: ReactNode;
  description?: string;
  eyebrow?: string;
  onClose: () => void;
  open: boolean;
  title: string;
};

export function Drawer({
  children,
  description,
  eyebrow,
  onClose,
  open,
  title,
}: DrawerProps) {
  const titleId = useId();
  const descriptionId = useId();

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex lg:hidden">
      <button
        aria-label={`Close ${title}`}
        className="flex-1 bg-[rgba(15,28,31,0.45)]"
        onClick={onClose}
        type="button"
      />
      <aside
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className={cn(
          "border-border flex w-80 max-w-[84vw] flex-col border-l bg-[rgba(15,28,31,0.98)] px-5 py-5 text-stone-100 shadow-[-20px_0_80px_rgba(15,28,31,0.28)]",
        )}
        role="dialog"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            {eyebrow ? (
              <p className="text-sm tracking-[0.24em] text-stone-400 uppercase">
                {eyebrow}
              </p>
            ) : null}
            <p
              className="font-heading mt-2 text-2xl font-semibold"
              id={titleId}
            >
              {title}
            </p>
          </div>
          <button
            aria-label={`Dismiss ${title}`}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        {description ? (
          <p className="mt-3 text-sm leading-6 text-stone-300" id={descriptionId}>
            {description}
          </p>
        ) : null}

        {children}
      </aside>
    </div>
  );
}
