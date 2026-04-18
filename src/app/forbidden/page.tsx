import Link from "next/link";

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
      <section className="border-border w-full max-w-lg rounded-[32px] border bg-[rgba(252,249,244,0.96)] p-8 shadow-[0_28px_80px_rgba(14,32,35,0.28)] backdrop-blur">
        <p className="text-muted text-sm tracking-[0.28em] uppercase">
          Permission denied
        </p>
        <h1 className="font-heading text-foreground mt-4 text-4xl font-semibold tracking-[-0.04em]">
          You do not have access to {blockedPermission}.
        </h1>
        <p className="text-muted mt-4 text-sm leading-7">
          The request was blocked by a server-side role guard. If this access is
          expected, ask an administrator to review your role assignment.
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex rounded-full bg-[rgb(19,78,68)] px-5 py-3 text-sm font-medium text-white"
          >
            Return to dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
