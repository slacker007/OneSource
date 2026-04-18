import { requireAppPermission } from "@/lib/auth/authorization";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { session } = await requireAppPermission("manage_workspace_settings");

  return (
    <main className="from-[rgba(242,233,222,0.7)] to-[rgba(224,234,232,0.7)] flex min-h-screen bg-linear-to-br px-4 py-6 sm:px-6">
      <section className="border-border bg-surface mx-auto flex w-full max-w-5xl flex-col gap-6 rounded-[32px] border px-6 py-8 shadow-[0_24px_80px_rgba(20,37,34,0.12)] sm:px-8">
        <div className="space-y-3">
          <p className="text-muted text-sm tracking-[0.26em] uppercase">
            Restricted surface
          </p>
          <h1 className="font-heading text-foreground text-4xl font-semibold tracking-[-0.04em]">
            Workspace settings
          </h1>
          <p className="text-muted max-w-3xl text-sm leading-7">
            This placeholder route exists to prove the authorization boundary
            before the later admin and audit UI slices land. Server-side guards
            only admit users with the administrator role.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <article className="border-border rounded-[24px] border bg-white p-5">
            <p className="text-muted text-xs tracking-[0.22em] uppercase">
              Active user
            </p>
            <p className="text-foreground mt-3 text-lg font-semibold">
              {session.user.name ?? session.user.email}
            </p>
            <p className="text-muted mt-1 text-sm">{session.user.email}</p>
          </article>

          <article className="border-border rounded-[24px] border bg-white p-5">
            <p className="text-muted text-xs tracking-[0.22em] uppercase">
              Guard behavior
            </p>
            <p className="text-foreground mt-3 text-lg font-semibold">
              Direct navigation is blocked for non-admin roles.
            </p>
            <p className="text-muted mt-1 text-sm leading-6">
              Later loops can reuse the same guard helper for admin-only audit
              inspection, user-role visibility, and high-risk settings changes.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
