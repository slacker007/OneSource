"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/ui/error-state";

type AppErrorBoundaryProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
  scopeLabel: string;
  title: string;
};

export function AppErrorBoundary({
  error,
  reset,
  scopeLabel,
  title,
}: AppErrorBoundaryProps) {
  useEffect(() => {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        service: "web",
        level: "error",
        message: `${scopeLabel} error boundary captured an exception.`,
        detail: {
          digest: error.digest ?? null,
          message: error.message,
          name: error.name,
        },
      }),
    );
  }, [error, scopeLabel]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(209,229,220,0.72),_rgba(250,247,242,0.95)_55%)] px-6 py-16">
      <div className="w-full max-w-2xl rounded-[32px] border border-border bg-surface px-6 py-8 shadow-[0_24px_80px_rgba(20,37,34,0.12)] sm:px-8">
        <p className="text-muted text-xs tracking-[0.24em] uppercase">
          {scopeLabel}
        </p>
        <h1 className="font-heading mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">
          {title}
        </h1>
        <div className="mt-6">
          <ErrorState
            title="The current page could not finish rendering"
            message="OneSource caught the failure in a route-level error boundary. Reset the view to retry this route, or return to the previous page if the problem persists."
            action={
              <button
                className="rounded-full bg-[rgb(19,78,68)] px-4 py-2 text-xs font-medium tracking-[0.16em] text-white uppercase"
                onClick={() => reset()}
                type="button"
              >
                Retry route
              </button>
            }
          />
        </div>
        <p className="text-muted mt-4 text-xs leading-6">
          Error digest: <span className="font-mono">{error.digest ?? "n/a"}</span>
        </p>
      </div>
    </main>
  );
}
