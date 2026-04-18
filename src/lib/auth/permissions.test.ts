import { describe, expect, it } from "vitest";

import {
  getPermissionSnapshot,
  hasAppPermission,
  normalizeSystemRoleKeys,
} from "./permissions";

describe("authorization policy", () => {
  it("ignores duplicate and unknown role keys", () => {
    expect(
      normalizeSystemRoleKeys(["viewer", "unknown_role", "viewer", "admin"]),
    ).toEqual(["viewer", "admin"]);
  });

  it("grants all current permissions to admins", () => {
    const snapshot = getPermissionSnapshot(["admin"]);

    expect(snapshot.allowedPermissions).toHaveLength(snapshot.permissions.length);
    expect(hasAppPermission(["admin"], "manage_workspace_settings")).toBe(true);
  });

  it("keeps executive access read-heavy without admin settings", () => {
    expect(hasAppPermission(["executive"], "view_dashboard")).toBe(true);
    expect(hasAppPermission(["executive"], "view_decision_support")).toBe(true);
    expect(hasAppPermission(["executive"], "manage_source_searches")).toBe(false);
    expect(hasAppPermission(["executive"], "manage_pipeline")).toBe(false);
    expect(hasAppPermission(["executive"], "manage_workspace_settings")).toBe(
      false,
    );
  });

  it("allows business-development users to drive source and pipeline work", () => {
    expect(hasAppPermission(["business_development"], "view_dashboard")).toBe(
      true,
    );
    expect(
      hasAppPermission(["business_development"], "manage_source_searches"),
    ).toBe(true);
    expect(hasAppPermission(["business_development"], "manage_pipeline")).toBe(
      true,
    );
    expect(
      hasAppPermission(["business_development"], "view_decision_support"),
    ).toBe(true);
    expect(
      hasAppPermission(["business_development"], "manage_workspace_settings"),
    ).toBe(false);
  });

  it("keeps viewer access read-only", () => {
    expect(hasAppPermission(["viewer"], "view_dashboard")).toBe(true);
    expect(hasAppPermission(["viewer"], "view_decision_support")).toBe(true);
    expect(hasAppPermission(["viewer"], "manage_source_searches")).toBe(false);
    expect(hasAppPermission(["viewer"], "manage_pipeline")).toBe(false);
    expect(hasAppPermission(["viewer"], "manage_workspace_settings")).toBe(
      false,
    );
  });
});
