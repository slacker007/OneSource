import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type PermissionDeniedStateProps = {
  action?: ReactNode;
  blockedArea: string;
  className?: string;
  message?: string;
  title?: string;
};

export function PermissionDeniedState({
  action,
  blockedArea,
  className,
  message = "The request was blocked by a server-side permission guard. If this access is expected, ask an administrator to review your role assignment.",
  title,
}: PermissionDeniedStateProps) {
  const resolvedTitle = title ?? `You do not have access to ${blockedArea}.`;

  return (
    <section className={cn("ui-state ui-state-permission", className)}>
      <p className="ui-state-eyebrow">Permission denied</p>
      <h1 className="ui-state-title">{resolvedTitle}</h1>
      <p className="ui-state-body">{message}</p>
      <div className="ui-state-actions">
        {action ?? (
          <Link
            href="/"
            className="inline-flex items-center rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft"
          >
            Return to dashboard
          </Link>
        )}
      </div>
    </section>
  );
}
