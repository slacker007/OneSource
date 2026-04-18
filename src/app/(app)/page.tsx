import { SignOutButton } from "@/components/auth/sign-out-button";
import { AppShellPreview } from "@/components/home/app-shell-preview";
import { getServerAuthSession } from "@/lib/auth/auth-options";

export const dynamic = "force-dynamic";

export default async function AuthenticatedHomePage() {
  const session = await getServerAuthSession();
  const roleKeys = session?.user.roleKeys ?? [];
  const roleSummary =
    roleKeys.length > 0
      ? roleKeys.join(", ")
      : "No roles assigned";

  return (
    <div className="from-[rgba(242,233,222,0.7)] to-[rgba(224,234,232,0.7)] flex min-h-screen flex-col gap-4 bg-linear-to-br px-4 py-4 sm:px-6">
      <section className="border-border bg-surface mx-auto flex w-full max-w-7xl items-center justify-between gap-4 rounded-[28px] border px-5 py-4 shadow-[0_16px_40px_rgba(20,37,34,0.08)]">
        <div className="space-y-1">
          <p className="text-muted text-xs tracking-[0.24em] uppercase">
            Authenticated session
          </p>
          <p className="text-foreground text-sm font-medium sm:text-base">
            {session?.user.name ?? session?.user.email}
          </p>
          <p className="text-muted text-xs sm:text-sm">
            {session?.user.email} · {roleSummary}
          </p>
        </div>
        <SignOutButton />
      </section>

      <AppShellPreview snapshot={null} />
    </div>
  );
}
