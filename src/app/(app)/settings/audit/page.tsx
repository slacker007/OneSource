import { AdminAuditSettings } from "@/components/admin/admin-console";
import { requireAppPermission } from "@/lib/auth/authorization";
import { prisma } from "@/lib/prisma";
import { getAdminAuditSettingsSnapshot } from "@/modules/admin/admin.repository";

export const dynamic = "force-dynamic";

export default async function SettingsAuditPage() {
  const { session } = await requireAppPermission("manage_workspace_settings");
  const snapshot = await getAdminAuditSettingsSnapshot({
    db: prisma,
    organizationId: session.user.organizationId,
  });

  return <AdminAuditSettings snapshot={snapshot} />;
}
