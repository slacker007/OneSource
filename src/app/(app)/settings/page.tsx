import { AdminConsole } from "@/components/admin/admin-console";
import { requireAppPermission } from "@/lib/auth/authorization";
import { prisma } from "@/lib/prisma";
import { getAdminSettingsOverviewSnapshot } from "@/modules/admin/admin.repository";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { session } = await requireAppPermission("manage_workspace_settings");
  const snapshot = await getAdminSettingsOverviewSnapshot({
    db: prisma,
    organizationId: session.user.organizationId,
  });

  return (
    <AdminConsole
      sessionUser={{
        name: session.user.name,
        email: session.user.email,
      }}
      snapshot={snapshot}
    />
  );
}
