import Link from "next/link";

import { PermissionDeniedState } from "@/components/ui/permission-denied-state";

type ForbiddenPageProps = {
  searchParams?: Promise<{
    permission?: string;
  }>;
};

export default async function ForbiddenPage({
  searchParams,
}: ForbiddenPageProps) {
  const resolvedSearchParams = await searchParams;
  const blockedPermission =
    resolvedSearchParams?.permission?.replaceAll("_", " ") ?? "this area";

  return (
    <main className="from-[rgba(17,44,47,0.97)] via-[rgba(33,69,67,0.95)] to-[rgba(244,232,214,0.94)] flex min-h-screen items-center justify-center bg-linear-to-br px-4 py-12">
      <PermissionDeniedState
        action={
          <Link
            href="/"
            className="inline-flex items-center rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft"
          >
            Return to dashboard
          </Link>
        }
        blockedArea={blockedPermission}
        className="w-full max-w-lg bg-[rgba(252,249,244,0.96)] p-8 shadow-[0_28px_80px_rgba(14,32,35,0.28)] backdrop-blur"
      />
    </main>
  );
}
