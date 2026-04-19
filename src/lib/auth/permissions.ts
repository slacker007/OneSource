import {
  SYSTEM_ROLE_DEFINITIONS,
  SYSTEM_ROLE_KEYS,
  type SystemRoleKey,
} from "./system-roles";

export type AppPermissionDefinition = {
  key: string;
  label: string;
  description: string;
  allowedRoles: readonly SystemRoleKey[];
};

export const APP_PERMISSION_DEFINITIONS = [
  {
    key: "view_dashboard",
    label: "View dashboard",
    description:
      "Open the OneSource workspace, dashboards, and opportunity summaries.",
    allowedRoles: [...SYSTEM_ROLE_KEYS],
  },
  {
    key: "manage_source_searches",
    label: "Run source searches",
    description:
      "Create and refine external-source searches before opportunities enter the pipeline.",
    allowedRoles: ["admin", "business_development", "capture_manager"],
  },
  {
    key: "manage_pipeline",
    label: "Update pipeline execution",
    description:
      "Edit tracked opportunity details, stage movement, and execution records.",
    allowedRoles: [
      "admin",
      "business_development",
      "capture_manager",
      "proposal_manager",
      "contributor",
    ],
  },
  {
    key: "view_decision_support",
    label: "Review bid decisions",
    description:
      "Inspect scorecards, pursuit recommendations, and executive review context.",
    allowedRoles: [
      "admin",
      "executive",
      "business_development",
      "capture_manager",
      "proposal_manager",
      "viewer",
    ],
  },
  {
    key: "manage_workspace_settings",
    label: "Manage workspace settings",
    description:
      "Access OneSource administration surfaces reserved for administrators.",
    allowedRoles: ["admin"],
  },
] as const satisfies readonly AppPermissionDefinition[];

export type AppPermissionKey = (typeof APP_PERMISSION_DEFINITIONS)[number]["key"];

export type PermissionStatus = {
  key: AppPermissionKey;
  label: string;
  description: string;
  allowed: boolean;
};

const SYSTEM_ROLE_KEY_SET = new Set<string>(SYSTEM_ROLE_KEYS);

export const ROLE_LABELS = new Map(
  SYSTEM_ROLE_DEFINITIONS.map((definition) => [definition.key, definition.name]),
);

export function normalizeSystemRoleKeys(
  roleKeys: readonly string[],
): SystemRoleKey[] {
  return [...new Set(roleKeys)].filter((roleKey): roleKey is SystemRoleKey =>
    SYSTEM_ROLE_KEY_SET.has(roleKey),
  );
}

export function hasAppPermission(
  roleKeys: readonly string[],
  permissionKey: AppPermissionKey,
): boolean {
  const permission = APP_PERMISSION_DEFINITIONS.find(
    (definition) => definition.key === permissionKey,
  );

  if (!permission) {
    return false;
  }

  const normalizedRoleKeys = normalizeSystemRoleKeys(roleKeys);

  return permission.allowedRoles.some((roleKey) =>
    normalizedRoleKeys.includes(roleKey),
  );
}

export function getPermissionStatuses(
  roleKeys: readonly string[],
): PermissionStatus[] {
  return APP_PERMISSION_DEFINITIONS.map((permission) => ({
    key: permission.key,
    label: permission.label,
    description: permission.description,
    allowed: hasAppPermission(roleKeys, permission.key),
  }));
}

export function getPermissionSnapshot(roleKeys: readonly string[]) {
  const normalizedRoleKeys = normalizeSystemRoleKeys(roleKeys);
  const permissions = getPermissionStatuses(normalizedRoleKeys);

  return {
    roleKeys: normalizedRoleKeys,
    roleLabels: normalizedRoleKeys.map(
      (roleKey) => ROLE_LABELS.get(roleKey) ?? roleKey,
    ),
    permissions,
    allowedPermissions: permissions.filter((permission) => permission.allowed),
    deniedPermissions: permissions.filter((permission) => !permission.allowed),
  };
}
