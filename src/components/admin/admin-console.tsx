import type {
  AdminAuditEventSummary,
  AdminUserSummary,
  AdminWorkspaceSnapshot,
} from "@/modules/admin/admin.types";

type AdminConsoleProps = {
  sessionUser: {
    name?: string | null;
    email?: string | null;
  };
  snapshot: AdminWorkspaceSnapshot | null;
};

export function AdminConsole({ sessionUser, snapshot }: AdminConsoleProps) {
  const viewerLabel = sessionUser.name ?? sessionUser.email ?? "Unknown admin";

  if (!snapshot) {
    return (
      <main className="from-[rgba(242,233,222,0.7)] to-[rgba(224,234,232,0.7)] flex min-h-screen bg-linear-to-br px-4 py-6 sm:px-6">
        <section className="border-border bg-surface mx-auto flex w-full max-w-5xl flex-col gap-4 rounded-[32px] border px-6 py-8 shadow-[0_24px_80px_rgba(20,37,34,0.12)] sm:px-8">
          <p className="text-muted text-sm tracking-[0.26em] uppercase">
            Admin surface
          </p>
          <h1 className="font-heading text-foreground text-4xl font-semibold tracking-[-0.04em]">
            Admin console
          </h1>
          <p className="text-muted max-w-3xl text-sm leading-7">
            Organization-scoped admin data could not be loaded for this session.
            Re-seed the local database or verify the authenticated user still
            belongs to an active organization.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="from-[rgba(242,233,222,0.7)] to-[rgba(224,234,232,0.7)] flex min-h-screen bg-linear-to-br px-4 py-6 sm:px-6">
      <section className="border-border bg-surface mx-auto flex w-full max-w-6xl flex-col gap-6 rounded-[32px] border px-6 py-8 shadow-[0_24px_80px_rgba(20,37,34,0.12)] sm:px-8">
        <div className="space-y-3">
          <p className="text-muted text-sm tracking-[0.26em] uppercase">
            Admin surface
          </p>
          <h1 className="font-heading text-foreground text-4xl font-semibold tracking-[-0.04em]">
            Admin console
          </h1>
          <p className="text-muted max-w-3xl text-sm leading-7">
            Review assigned roles and recent audit activity for{" "}
            <span className="text-foreground font-medium">
              {snapshot.organizationName}
            </span>
            . This is the first live admin read model wired behind the
            server-enforced admin guard.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard
            label="Active admin"
            value={viewerLabel}
            supportingText={sessionUser.email ?? "Signed-in session"}
          />
          <SummaryCard
            label="Organization users"
            value={String(snapshot.totalUserCount)}
            supportingText="Scoped to the authenticated organization"
          />
          <SummaryCard
            label="Admin assignments"
            value={String(snapshot.adminUserCount)}
            supportingText="Users carrying the admin role"
          />
          <SummaryCard
            label="Audit rows"
            value={String(snapshot.totalAuditLogCount)}
            supportingText="Append-only records in the audit log"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section
            aria-labelledby="assigned-roles-heading"
            className="border-border rounded-[28px] border bg-white p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-muted text-xs tracking-[0.24em] uppercase">
                  User visibility
                </p>
                <h2
                  id="assigned-roles-heading"
                  className="font-heading text-foreground text-2xl font-semibold tracking-[-0.03em]"
                >
                  Assigned roles
                </h2>
                <p className="text-muted text-sm leading-6">
                  Role labels are loaded from organization-scoped assignments so
                  admins can verify who currently has elevated access.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {snapshot.users.length > 0 ? (
                snapshot.users.map((user) => <UserRoleCard key={user.id} user={user} />)
              ) : (
                <EmptyState message="No organization users are available yet." />
              )}
            </div>
          </section>

          <section
            aria-labelledby="recent-audit-heading"
            className="border-border rounded-[28px] border bg-white p-5"
          >
            <div className="space-y-2">
              <p className="text-muted text-xs tracking-[0.24em] uppercase">
                Audit visibility
              </p>
              <h2
                id="recent-audit-heading"
                className="font-heading text-foreground text-2xl font-semibold tracking-[-0.03em]"
              >
                Recent audit activity
              </h2>
              <p className="text-muted text-sm leading-6">
                Newest events render first so admins can inspect who changed
                what without querying the database directly.
              </p>
            </div>

            <div className="mt-5 space-y-4">
              {snapshot.recentAuditEvents.length > 0 ? (
                snapshot.recentAuditEvents.map((event) => (
                  <AuditEventCard key={event.id} event={event} />
                ))
              ) : (
                <EmptyState message="No audit events are available yet." />
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  supportingText,
}: {
  label: string;
  value: string;
  supportingText: string;
}) {
  return (
    <article className="border-border rounded-[24px] border bg-white p-5">
      <p className="text-muted text-xs tracking-[0.22em] uppercase">{label}</p>
      <p className="text-foreground mt-3 text-lg font-semibold">{value}</p>
      <p className="text-muted mt-2 text-sm leading-6">{supportingText}</p>
    </article>
  );
}

function UserRoleCard({ user }: { user: AdminUserSummary }) {
  const displayName = user.name ?? user.email;

  return (
    <article className="border-border rounded-[24px] border bg-[rgba(248,244,234,0.72)] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-foreground text-sm font-semibold">{displayName}</p>
          <p className="text-muted mt-1 text-sm">{user.email}</p>
          <p className="text-muted mt-2 text-xs tracking-[0.18em] uppercase">
            {formatEnumLabel(user.status)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          {user.roles.length > 0 ? (
            user.roles.map((role) => (
              <span
                key={`${user.id}-${role.key}`}
                className="border-border rounded-full border bg-white px-3 py-1 text-xs font-medium text-[rgb(19,78,68)]"
                title={`Assigned ${formatUtcTimestamp(role.assignedAt)}`}
              >
                {role.label}
              </span>
            ))
          ) : (
            <span className="rounded-full bg-[rgba(150,75,53,0.12)] px-3 py-1 text-xs font-medium text-[rgb(133,69,49)]">
              No roles assigned
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function AuditEventCard({ event }: { event: AdminAuditEventSummary }) {
  return (
    <article className="border-border rounded-[24px] border bg-[rgba(242,248,247,0.72)] p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[rgba(32,95,85,0.12)] px-3 py-1 text-xs font-medium text-[rgb(19,78,68)]">
            {event.actionLabel}
          </span>
          <span className="border-border rounded-full border bg-white px-3 py-1 text-xs font-medium text-foreground">
            {event.action}
          </span>
        </div>

        <div className="grid gap-3 text-sm text-muted sm:grid-cols-2">
          <div>
            <p className="text-xs tracking-[0.18em] uppercase">Actor</p>
            <p className="mt-1 text-foreground">{event.actorLabel}</p>
          </div>
          <div>
            <p className="text-xs tracking-[0.18em] uppercase">Occurred</p>
            <p className="mt-1 text-foreground">{formatUtcTimestamp(event.occurredAt)}</p>
          </div>
          <div>
            <p className="text-xs tracking-[0.18em] uppercase">Target</p>
            <p className="mt-1 text-foreground">{event.targetLabel}</p>
          </div>
          <div>
            <p className="text-xs tracking-[0.18em] uppercase">Target type</p>
            <p className="mt-1 text-foreground">{formatEnumLabel(event.targetType)}</p>
          </div>
        </div>

        {event.summary ? (
          <p className="text-sm leading-6 text-foreground">{event.summary}</p>
        ) : null}

        {event.metadataPreview ? (
          <pre className="overflow-x-auto rounded-[18px] bg-[rgba(15,28,31,0.05)] px-3 py-3 text-xs leading-5 whitespace-pre-wrap break-all text-foreground">
            {event.metadataPreview}
          </pre>
        ) : null}
      </div>
    </article>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="border-border rounded-[24px] border border-dashed bg-[rgba(15,28,31,0.02)] px-4 py-6 text-sm text-muted">
      {message}
    </div>
  );
}

function formatEnumLabel(value: string) {
  return value
    .split(/[_\s-]+/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(" ");
}

function formatUtcTimestamp(value: string) {
  return value.replace("T", " ").replace(".000Z", " UTC");
}
