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

  it("allows capture managers through source, pipeline, and decision-support surfaces", () => {
    expect(hasAppPermission(["capture_manager"], "view_dashboard")).toBe(true);
    expect(hasAppPermission(["capture_manager"], "manage_source_searches")).toBe(
      true,
    );
    expect(hasAppPermission(["capture_manager"], "manage_pipeline")).toBe(true);
    expect(hasAppPermission(["capture_manager"], "view_decision_support")).toBe(
      true,
    );
    expect(
      hasAppPermission(["capture_manager"], "manage_workspace_settings"),
    ).toBe(false);
  });

  it("keeps proposal managers focused on execution and decision review", () => {
    expect(hasAppPermission(["proposal_manager"], "view_dashboard")).toBe(true);
    expect(
      hasAppPermission(["proposal_manager"], "manage_source_searches"),
    ).toBe(false);
    expect(hasAppPermission(["proposal_manager"], "manage_pipeline")).toBe(
      true,
    );
    expect(
      hasAppPermission(["proposal_manager"], "view_decision_support"),
    ).toBe(true);
    expect(
      hasAppPermission(["proposal_manager"], "manage_workspace_settings"),
    ).toBe(false);
  });

  it("allows contributors to update the pipeline without source or settings access", () => {
    expect(hasAppPermission(["contributor"], "view_dashboard")).toBe(true);
    expect(hasAppPermission(["contributor"], "manage_source_searches")).toBe(
      false,
    );
    expect(hasAppPermission(["contributor"], "manage_pipeline")).toBe(true);
    expect(hasAppPermission(["contributor"], "view_decision_support")).toBe(
      false,
    );
    expect(
      hasAppPermission(["contributor"], "manage_workspace_settings"),
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

  it("unions permissions across multiple assigned roles", () => {
    const snapshot = getPermissionSnapshot(["viewer", "proposal_manager"]);

    expect(snapshot.allowedPermissions.map((permission) => permission.key)).toEqual(
      expect.arrayContaining([
        "view_dashboard",
        "view_decision_support",
        "manage_pipeline",
      ]),
    );
    expect(snapshot.deniedPermissions.map((permission) => permission.key)).toEqual(
      expect.arrayContaining([
        "manage_source_searches",
        "manage_workspace_settings",
      ]),
    );
  });
});
