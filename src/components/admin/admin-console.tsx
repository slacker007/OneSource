import type {
  AdminWorkspaceSnapshot,
} from "@/modules/admin/admin.types";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";

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
      <section className="space-y-4">
        <p className="text-muted text-sm tracking-[0.26em] uppercase">
          Admin surface
        </p>
        <h1 className="font-heading text-foreground text-4xl font-semibold tracking-[-0.04em]">
          Admin console
        </h1>
        <ErrorState
          message="Organization-scoped admin data could not be loaded for this session. Re-seed the local database or verify the authenticated user still belongs to an active organization."
          title="Admin data is unavailable"
        />
      </section>
    );
  }

  return (
    <section className="border-border bg-surface flex w-full flex-col gap-6 rounded-[32px] border px-6 py-8 shadow-[0_24px_80px_rgba(20,37,34,0.12)] sm:px-8">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge>Admin surface</Badge>
          <Badge tone="muted">shared table pattern</Badge>
          <Badge tone="warning">server-guarded</Badge>
        </div>
        <h1 className="font-heading text-foreground text-4xl font-semibold tracking-[-0.04em]">
          Admin console
        </h1>
        <p className="text-muted max-w-3xl text-sm leading-7">
          Review assigned roles and recent audit activity for{" "}
          <span className="text-foreground font-medium">
            {snapshot.organizationName}
          </span>
          . This surface now reuses the shared badge, table, empty-state, and
          error-state primitives established in `P3-02`.
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

      <div className="grid gap-6">
        <section aria-labelledby="assigned-roles-heading" className="space-y-4">
          <div className="space-y-2">
            <p className="text-muted text-xs tracking-[0.24em] uppercase">
              User visibility
            </p>
            <h2
              className="font-heading text-foreground text-2xl font-semibold tracking-[-0.03em]"
              id="assigned-roles-heading"
            >
              Assigned roles
            </h2>
            <p className="text-muted text-sm leading-6">
              Role assignments stay organization-scoped and now render through a
              shared table treatment that later list and audit surfaces can
              reuse.
            </p>
          </div>

          <DataTable
            ariaLabel="Assigned roles"
            columns={[
              {
                key: "user",
                header: "User",
                cell: (user) => (
                  <div>
                    <p className="font-medium text-foreground">
                      {user.name ?? user.email}
                    </p>
                    <p className="text-muted text-xs">{user.email}</p>
                  </div>
                ),
              },
              {
                key: "status",
                header: "Status",
                cell: (user) => (
                  <Badge tone={user.status === "ACTIVE" ? "accent" : "warning"}>
                    {formatEnumLabel(user.status)}
                  </Badge>
                ),
              },
              {
                key: "roles",
                header: "Assigned roles",
                cell: (user) =>
                  user.roles.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {user.roles.map((role) => (
                        <Badge
                          key={`${user.id}-${role.key}`}
                          title={`Assigned ${formatUtcTimestamp(role.assignedAt)}`}
                          tone="muted"
                        >
                          {role.label}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <Badge tone="warning">No roles assigned</Badge>
                  ),
              },
            ]}
            emptyState={
              <EmptyState
                message="User assignments will appear here once the organization has seeded or created users."
                title="No organization users are available yet"
              />
            }
            getRowKey={(user) => user.id}
            rows={snapshot.users}
          />
        </section>

        <section
          aria-labelledby="recent-audit-heading"
          className="space-y-4"
        >
          <div className="space-y-2">
            <p className="text-muted text-xs tracking-[0.24em] uppercase">
              Audit visibility
            </p>
            <h2
              className="font-heading text-foreground text-2xl font-semibold tracking-[-0.03em]"
              id="recent-audit-heading"
            >
              Recent audit activity
            </h2>
            <p className="text-muted text-sm leading-6">
              Newest events render first so admins can inspect recent mutations
              without leaving the app shell.
            </p>
          </div>

          <DataTable
            ariaLabel="Recent audit activity"
            columns={[
              {
                key: "action",
                header: "Action",
                cell: (event) => (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge>{event.actionLabel}</Badge>
                      <Badge tone="muted">{event.action}</Badge>
                    </div>
                    {event.summary ? (
                      <p className="text-sm leading-6 text-muted">
                        {event.summary}
                      </p>
                    ) : null}
                  </div>
                ),
              },
              {
                key: "actor",
                header: "Actor",
                cell: (event) => (
                  <div>
                    <p className="font-medium text-foreground">
                      {event.actorLabel}
                    </p>
                    <p className="text-muted text-xs">
                      {formatEnumLabel(event.actorType)}
                    </p>
                  </div>
                ),
              },
              {
                key: "target",
                header: "Target",
                cell: (event) => (
                  <div>
                    <p className="font-medium text-foreground">
                      {event.targetLabel}
                    </p>
                    <p className="text-muted text-xs">
                      {formatEnumLabel(event.targetType)}
                    </p>
                  </div>
                ),
              },
              {
                key: "occurredAt",
                header: "Occurred",
                cell: (event) => (
                  <div className="space-y-2">
                    <p>{formatUtcTimestamp(event.occurredAt)}</p>
                    {event.metadataPreview ? (
                      <pre className="overflow-x-auto rounded-[18px] bg-[rgba(15,28,31,0.05)] px-3 py-3 text-xs leading-5 break-all whitespace-pre-wrap">
                        {event.metadataPreview}
                      </pre>
                    ) : null}
                  </div>
                ),
              },
            ]}
            emptyState={
              <EmptyState
                message="Audit rows will appear here once write flows emit organization-scoped events."
                title="No audit events are available yet"
              />
            }
            getRowKey={(event) => event.id}
            rows={snapshot.recentAuditEvents}
          />
        </section>
      </div>
    </section>
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

function formatEnumLabel(value: string) {
  return value
    .split(/[_\s-]+/g)
    .filter(Boolean)
    .map(
      (segment) =>
        segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase(),
    )
    .join(" ");
}

function formatUtcTimestamp(value: string) {
  return value.replace("T", " ").replace(".000Z", " UTC");
}
