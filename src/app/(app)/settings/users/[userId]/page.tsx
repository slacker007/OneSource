import { notFound } from "next/navigation";

import {
  disableWorkspaceUserAction,
  reactivateWorkspaceUserAction,
  updateWorkspaceUserRolesAction,
} from "../actions";

import { AdminUserDetail } from "@/components/admin/admin-user-detail";
import { requireAppPermission } from "@/lib/auth/authorization";
import { prisma } from "@/lib/prisma";
import { getAdminUserDetailSnapshot } from "@/modules/admin/admin.repository";

export const dynamic = "force-dynamic";

type SettingsUserDetailPageProps = {
  params: Promise<{
    userId: string;
  }>;
};

export default async function SettingsUserDetailPage({
  params,
}: SettingsUserDetailPageProps) {
  const { session } = await requireAppPermission("manage_workspace_settings");
  const resolvedParams = await params;
  const snapshot = await getAdminUserDetailSnapshot({
    db: prisma,
    organizationId: session.user.organizationId,
    userId: resolvedParams.userId,
  });

  if (!snapshot) {
    notFound();
  }

  return (
    <AdminUserDetail
      disableUserAction={disableWorkspaceUserAction}
      key={buildUserDetailSnapshotKey(snapshot)}
      reactivateUserAction={reactivateWorkspaceUserAction}
      sessionUser={{
        email: session.user.email,
        id: session.user.id,
        name: session.user.name,
      }}
      snapshot={snapshot}
      updateUserRolesAction={updateWorkspaceUserRolesAction}
    />
  );
}

function buildUserDetailSnapshotKey(
  snapshot: Awaited<ReturnType<typeof getAdminUserDetailSnapshot>>,
) {
  if (!snapshot) {
    return "settings-user-detail-missing";
  }

  return `${snapshot.organizationId}:${snapshot.user.id}:${snapshot.user.status}:${snapshot.user.roleKeys.join(",")}:${snapshot.user.updatedAt}`;
}
