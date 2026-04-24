import { AdminSavedSearchSettings } from "@/components/admin/admin-console";
import { requireAppPermission } from "@/lib/auth/authorization";
import { prisma } from "@/lib/prisma";
import { getAdminSavedSearchSettingsSnapshot } from "@/modules/admin/admin.repository";

export const dynamic = "force-dynamic";

export default async function SettingsSavedSearchesPage() {
  const { session } = await requireAppPermission("manage_workspace_settings");
  const snapshot = await getAdminSavedSearchSettingsSnapshot({
    db: prisma,
    organizationId: session.user.organizationId,
  });

  return <AdminSavedSearchSettings snapshot={snapshot} />;
}
