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

export type AdminScoringProfileAgencySummary = {
  id: string;
  label: string;
};

export type AdminScoringCapabilitySummary = {
  id: string;
  key: string;
  label: string;
  category: string | null;
  keywords: string[];
  description: string | null;
};

export type AdminScoringCertificationSummary = {
  id: string;
  key: string;
  label: string;
  code: string | null;
  issuingBody: string | null;
  description: string | null;
};

export type AdminScoringVehicleSummary = {
  id: string;
  code: string;
  name: string;
  vehicleType: string | null;
  awardingAgency: string | null;
  isPreferred: boolean;
  usageNotes: string | null;
};

export type AdminScoringCriterionSummary = {
  id: string;
  key: string;
  label: string;
  description: string | null;
  weight: string;
  isActive: boolean;
};

export type AdminScoringProfileSummary = {
  overview: string | null;
  strategicFocus: string | null;
  targetNaicsCodes: string[];
  activeScoringModelKey: string;
  activeScoringModelVersion: string;
  priorityAgencies: AdminScoringProfileAgencySummary[];
  relationshipAgencies: AdminScoringProfileAgencySummary[];
  capabilities: AdminScoringCapabilitySummary[];
  certifications: AdminScoringCertificationSummary[];
  selectedVehicles: AdminScoringVehicleSummary[];
  scoringCriteria: AdminScoringCriterionSummary[];
};

export type AdminWorkspaceSnapshot = {
  organizationId: string;
  organizationName: string;
  totalUserCount: number;
  adminUserCount: number;
  totalAuditLogCount: number;
  scoringProfile: AdminScoringProfileSummary | null;
  users: AdminUserSummary[];
  recentAuditEvents: AdminAuditEventSummary[];
};
