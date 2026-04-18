import { Prisma, type PrismaClient } from "@prisma/client";

import type { AdminWorkspaceSnapshot } from "./admin.types";

const organizationAdminSnapshotArgs =
  Prisma.validator<Prisma.OrganizationDefaultArgs>()({
  select: {
    id: true,
    name: true,
    _count: {
      select: {
        users: true,
        auditLogs: true,
      },
    },
    users: {
      orderBy: {
        email: "asc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        roles: {
          orderBy: {
            role: {
              name: "asc",
            },
          },
          select: {
            assignedAt: true,
            role: {
              select: {
                key: true,
                name: true,
              },
            },
          },
        },
      },
    },
    auditLogs: {
      orderBy: {
        occurredAt: "desc",
      },
      take: 12,
      select: {
        id: true,
        occurredAt: true,
        action: true,
        actorType: true,
        actorIdentifier: true,
        targetType: true,
        targetId: true,
        targetDisplay: true,
        summary: true,
        metadata: true,
        actorUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    },
  },
});

export type AdminRepositoryClient = Pick<PrismaClient, "organization">;

export type OrganizationAdminRecord = Prisma.OrganizationGetPayload<
  typeof organizationAdminSnapshotArgs
>;

export async function getAdminWorkspaceSnapshot({
  db,
  organizationId,
}: {
  db: AdminRepositoryClient;
  organizationId: string;
}): Promise<AdminWorkspaceSnapshot | null> {
  const organization = await db.organization.findUnique({
    where: {
      id: organizationId,
    },
    ...organizationAdminSnapshotArgs,
  });

  if (!organization) {
    return null;
  }

  const users = organization.users.map((user) => {
    const roles = user.roles.map((assignment) => ({
      key: assignment.role.key,
      label: assignment.role.name,
      assignedAt: assignment.assignedAt.toISOString(),
    }));

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      roleKeys: roles.map((role) => role.key),
      roleLabels: roles.map((role) => role.label),
      roles,
    };
  });

  const adminUserCount = users.filter((user) => user.roleKeys.includes("admin")).length;

  return {
    organizationId: organization.id,
    organizationName: organization.name,
    totalUserCount: organization._count.users,
    adminUserCount,
    totalAuditLogCount: organization._count.auditLogs,
    users,
    recentAuditEvents: organization.auditLogs.map((auditLog) => ({
      id: auditLog.id,
      occurredAt: auditLog.occurredAt.toISOString(),
      action: auditLog.action,
      actionLabel: formatAuditActionLabel(auditLog.action),
      actorType: auditLog.actorType,
      actorLabel:
        auditLog.actorUser?.name ??
        auditLog.actorUser?.email ??
        auditLog.actorIdentifier ??
        formatEnumLabel(auditLog.actorType),
      targetLabel:
        auditLog.targetDisplay ??
        auditLog.targetId ??
        formatEnumLabel(auditLog.targetType),
      targetType: auditLog.targetType,
      summary: auditLog.summary,
      metadataPreview: formatAuditMetadataPreview(auditLog.metadata),
    })),
  };
}

function formatAuditActionLabel(action: string) {
  return action
    .split(".")
    .filter(Boolean)
    .map((segment) => formatEnumLabel(segment))
    .join(" / ");
}

function formatEnumLabel(value: string) {
  return value
    .split(/[_\s-]+/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(" ");
}

function formatAuditMetadataPreview(metadata: Prisma.JsonValue | null) {
  if (metadata === null) {
    return null;
  }

  const serialized = JSON.stringify(metadata);

  if (!serialized) {
    return null;
  }

  return serialized.length > 280 ? `${serialized.slice(0, 277)}...` : serialized;
}
