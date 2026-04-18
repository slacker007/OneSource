"use client";

import { AppErrorBoundary } from "@/components/layout/app-error-boundary";

export default function RootError({
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
      scopeLabel="Public application"
      title="Application recovery"
    />
  );
}
