"use client";

import { AppErrorBoundary } from "@/components/layout/app-error-boundary";

export default function AppRouteError({
  error,
  reset,
}: {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
}) {
  return (
    <AppErrorBoundary
      error={error}
      reset={reset}
      scopeLabel="Authenticated workspace"
      title="Workspace recovery"
    />
  );
}
