"use client";

import Link from "next/link";

import { getPermissionSnapshot } from "@/lib/auth/permissions";

type AccessOverviewProps = {
  roleKeys: string[];
};

export function AccessOverview({ roleKeys }: AccessOverviewProps) {
  const permissionSnapshot = getPermissionSnapshot(roleKeys);

  return (
    <section className="border-border bg-surface mx-auto w-full max-w-7xl rounded-[28px] border px-5 py-5 shadow-[0_16px_40px_rgba(20,37,34,0.08)] sm:px-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-muted text-xs tracking-[0.24em] uppercase">
            Permission snapshot
          </p>
          <h2 className="font-heading text-foreground text-2xl font-semibold tracking-[-0.03em]">
            Server-enforced role access is now active.
          </h2>
          <p className="text-muted max-w-3xl text-sm leading-6">
            The shared authorization policy is applied in server guards and
            mirrored in client helpers so restricted surfaces stay blocked even
            when a user navigates directly.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {permissionSnapshot.roleLabels.map((roleLabel) => (
            <span
              key={roleLabel}
              className="border-border text-foreground rounded-full border bg-white px-3 py-1 text-xs font-medium"
            >
              {roleLabel}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {permissionSnapshot.permissions.map((permission) => {
          const isSettingsPermission =
            permission.key === "manage_workspace_settings";

          return (
            <article
              key={permission.key}
              className="border-border rounded-[22px] border bg-white p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-foreground text-sm font-semibold">
                    {permission.label}
                  </p>
                  <p className="text-muted mt-2 text-sm leading-6">
                    {permission.description}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    permission.allowed
                      ? "bg-[rgba(32,95,85,0.12)] text-[rgb(19,78,68)]"
                      : "bg-[rgba(150,75,53,0.12)] text-[rgb(133,69,49)]"
                  }`}
                >
                  {permission.allowed ? "Allowed" : "Restricted"}
                </span>
              </div>

              {isSettingsPermission && permission.allowed ? (
                <div className="mt-4">
                  <Link
                    href="/settings"
                    className="text-sm font-medium text-[rgb(19,78,68)] underline-offset-4 hover:underline"
                  >
                    Open protected settings surface
                  </Link>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
