import { describe, expect, it } from "vitest";

import { SYSTEM_ROLE_DEFINITIONS } from "@/lib/auth/system-roles";

describe("SYSTEM_ROLE_DEFINITIONS", () => {
  it("covers the core PRD role set with unique keys", () => {
    const roleKeys = SYSTEM_ROLE_DEFINITIONS.map((role) => role.key);

    expect(new Set(roleKeys).size).toBe(roleKeys.length);
    expect(roleKeys).toEqual([
      "admin",
      "executive",
      "business_development",
      "capture_manager",
      "proposal_manager",
      "contributor",
      "viewer",
    ]);
  });
});
