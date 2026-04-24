import { createWorkspaceUserAction } from "./actions";

import { AdminUserManagement } from "@/components/admin/admin-user-management";
import { requireAppPermission } from "@/lib/auth/authorization";
import { prisma } from "@/lib/prisma";
import { getAdminUserManagementSnapshot } from "@/modules/admin/admin.repository";

export const dynamic = "force-dynamic";

export default async function SettingsUsersPage() {
  const { session } = await requireAppPermission("manage_workspace_settings");
  const snapshot = await getAdminUserManagementSnapshot({
    db: prisma,
    organizationId: session.user.organizationId,
  });

  return (
    <AdminUserManagement
      createUserAction={createWorkspaceUserAction}
      key={buildUserManagementSnapshotKey(snapshot)}
      sessionUser={{
        email: session.user.email,
        id: session.user.id,
        name: session.user.name,
      }}
      snapshot={snapshot}
    />
  );
}

function buildUserManagementSnapshotKey(
  snapshot: Awaited<ReturnType<typeof getAdminUserManagementSnapshot>>,
) {
  if (!snapshot) {
    return "settings-users-missing";
  }

  return `${snapshot.organizationId}:${snapshot.users
    .map((user) => `${user.id}:${user.status}:${user.roleKeys.join(",")}`)
    .join("|")}`;
}
