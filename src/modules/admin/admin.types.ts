import type { AuditActorType, UserStatus } from "@prisma/client";

export type AdminUserRoleSummary = {
  key: string;
  label: string;
  assignedAt: string;
};

export type AdminUserSummary = {
  id: string;
  name: string | null;
  email: string;
  status: UserStatus;
  roleKeys: string[];
  roleLabels: string[];
  roles: AdminUserRoleSummary[];
};

export type AdminAuditEventSummary = {
  id: string;
  occurredAt: string;
  action: string;
  actionLabel: string;
  actorType: AuditActorType;
  actorLabel: string;
  targetLabel: string;
  targetType: string;
  summary: string | null;
  metadataPreview: string | null;
};

export type AdminWorkspaceSnapshot = {
  organizationId: string;
  organizationName: string;
  totalUserCount: number;
  adminUserCount: number;
  totalAuditLogCount: number;
  users: AdminUserSummary[];
  recentAuditEvents: AdminAuditEventSummary[];
};
