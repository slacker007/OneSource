import { AuthenticatedAppShell } from "@/components/layout/authenticated-app-shell";
import { requireAuthenticatedAppSession } from "@/lib/auth/authorization";
import { hasAppPermission } from "@/lib/auth/permissions";

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
  const allowWorkspaceSettings = hasAppPermission(
    session.user.roleKeys,
    "manage_workspace_settings",
  );

  return (
    <AuthenticatedAppShell
      allowDecisionSupport={allowDecisionSupport}
      allowWorkspaceSettings={allowWorkspaceSettings}
      sessionUser={{
        email: session.user.email,
        name: session.user.name,
        roleKeys: session.user.roleKeys,
      }}
    >
      {children}
    </AuthenticatedAppShell>
  );
}
