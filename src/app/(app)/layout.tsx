import { AuthenticatedAppShell } from "@/components/layout/authenticated-app-shell";
import { requireAuthenticatedAppSession } from "@/lib/auth/authorization";
import { hasAppPermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import {
  getAppShellSnapshot,
  type AppShellRepositoryClient,
} from "@/modules/shell/app-shell.repository";

export const dynamic = "force-dynamic";

export default async function AuthenticatedAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireAuthenticatedAppSession();
  const allowDecisionSupport = hasAppPermission(
    session.user.roleKeys,
    "view_decision_support",
  );
  const allowManagePipeline = hasAppPermission(
    session.user.roleKeys,
    "manage_pipeline",
  );
  const allowManageSourceSearches = hasAppPermission(
    session.user.roleKeys,
    "manage_source_searches",
  );
  const allowWorkspaceSettings = hasAppPermission(
    session.user.roleKeys,
    "manage_workspace_settings",
  );
  const shellSnapshot = await getAppShellSnapshot({
    db: prisma as unknown as AppShellRepositoryClient,
    organizationId: session.user.organizationId,
    permissions: {
      allowDecisionSupport,
      allowManagePipeline,
      allowManageSourceSearches,
      allowWorkspaceSettings,
    },
    userId: session.user.id,
  });

  return (
    <AuthenticatedAppShell
      allowDecisionSupport={allowDecisionSupport}
      allowWorkspaceSettings={allowWorkspaceSettings}
      sessionUser={{
        email: session.user.email,
        name: session.user.name,
        organizationId: session.user.organizationId,
        roleKeys: session.user.roleKeys,
        userId: session.user.id,
      }}
      shellSnapshot={shellSnapshot}
    >
      {children}
    </AuthenticatedAppShell>
  );
}
