import { describe, expect, it } from "vitest";

import { authOptions } from "./auth-options";

describe("authOptions callbacks", () => {
  it("persists app-specific fields into the JWT and session", async () => {
    const jwtCallback = authOptions.callbacks?.jwt;
    const sessionCallback = authOptions.callbacks?.session;

    expect(jwtCallback).toBeDefined();
    expect(sessionCallback).toBeDefined();

    const token = await jwtCallback!({
      token: {},
      user: {
        id: "user_123",
        email: "admin@onesource.local",
        name: "Alex Morgan",
        organizationId: "org_123",
        roleKeys: ["admin", "executive"],
      },
      account: null,
      profile: undefined,
      trigger: "signIn",
      isNewUser: false,
      session: undefined,
    });

    const session = await sessionCallback!({
      session: {
        expires: "2026-04-18T08:00:00.000Z",
        user: {
          email: null,
          name: null,
          image: null,
        },
      },
      token,
      user: undefined,
      newSession: undefined,
      trigger: "update",
    });

    expect(token).toMatchObject({
      sub: "user_123",
      organizationId: "org_123",
      roleKeys: ["admin", "executive"],
    });
    expect(session.user).toMatchObject({
      id: "user_123",
      email: "admin@onesource.local",
      name: "Alex Morgan",
      organizationId: "org_123",
      roleKeys: ["admin", "executive"],
    });
  });
});
