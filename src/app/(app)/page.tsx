import { AccessOverview } from "@/components/auth/access-overview";
import { AppShellPreview } from "@/components/home/app-shell-preview";
import { requireAuthenticatedAppSession } from "@/lib/auth/authorization";

export const dynamic = "force-dynamic";

export default async function AuthenticatedHomePage() {
  const session = await requireAuthenticatedAppSession();
  const roleKeys = session.user.roleKeys;
  const roleSummary =
    roleKeys.length > 0 ? roleKeys.join(", ") : "No roles assigned";

  return (
    <div className="space-y-6">
      <section className="border-border bg-surface rounded-[28px] border px-5 py-5 shadow-[0_16px_40px_rgba(20,37,34,0.08)] sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-muted text-xs tracking-[0.24em] uppercase">
              Dashboard
            </p>
            <h1 className="font-heading text-foreground text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Government opportunity tracking with audit-ready decisions.
            </h1>
            <p className="text-muted max-w-3xl text-sm leading-7 sm:text-base">
              The authenticated shell is now the shared entry point for the
              workspace. Primary sections are navigable on desktop and mobile
              while later phases fill them with real capture workflows.
            </p>
          </div>

          <div className="border-border rounded-[24px] border bg-white px-4 py-4 text-sm shadow-[0_12px_30px_rgba(20,37,34,0.06)]">
            <p className="text-muted text-xs tracking-[0.2em] uppercase">
              Signed in as
            </p>
            <p className="text-foreground mt-2 font-semibold">
              {session.user.name ?? session.user.email}
            </p>
            <p className="text-muted mt-1">
              {session.user.email} · {roleSummary}
            </p>
          </div>
        </div>
      </section>

      <AppShellPreview snapshot={null} />

      <AccessOverview roleKeys={roleKeys} />
    </div>
  );
}
