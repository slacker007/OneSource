import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateUserWithPassword: vi.fn(),
  getCurrentAuthenticatedUser: vi.fn(),
}));

vi.mock("./authenticate-user", () => ({
  authenticateUserWithPassword: mocks.authenticateUserWithPassword,
  getCurrentAuthenticatedUser: mocks.getCurrentAuthenticatedUser,
}));

import { authOptions } from "./auth-options";

describe("authOptions callbacks", () => {
  beforeEach(() => {
    mocks.authenticateUserWithPassword.mockReset();
    mocks.getCurrentAuthenticatedUser.mockReset();
  });

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

  it("clears stale JWT-backed sessions when the backing user no longer exists", async () => {
    const jwtCallback = authOptions.callbacks?.jwt;
    const sessionCallback = authOptions.callbacks?.session;

    mocks.getCurrentAuthenticatedUser.mockResolvedValue(null);

    const token = await jwtCallback!({
      token: {
        sub: "user_123",
        email: "admin@onesource.local",
        name: "Alex Morgan",
        organizationId: "org_123",
        roleKeys: ["admin", "executive"],
      },
      user: undefined,
      account: null,
      profile: undefined,
      trigger: "update",
      isNewUser: false,
      session: undefined,
    });

    const session = await sessionCallback!({
      session: {
        expires: "2026-04-19T12:00:00.000Z",
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

    expect(mocks.getCurrentAuthenticatedUser).toHaveBeenCalledWith("user_123");
    expect(token).not.toHaveProperty("sub");
    expect(token).not.toHaveProperty("organizationId");
    expect(token).not.toHaveProperty("roleKeys");
    expect((session.user as Record<string, unknown>).id).toBeUndefined();
    expect((session.user as Record<string, unknown>).organizationId).toBeUndefined();
    expect((session.user as Record<string, unknown>).roleKeys).toBeUndefined();
  });

  it("refreshes JWT-backed session claims from the current user record", async () => {
    const jwtCallback = authOptions.callbacks?.jwt;
    const sessionCallback = authOptions.callbacks?.session;

    mocks.getCurrentAuthenticatedUser.mockResolvedValue({
      id: "user_123",
      email: "alex.updated@onesource.local",
      name: "Alex Updated",
      organizationId: "org_789",
      roleKeys: ["capture_manager"],
    });

    const token = await jwtCallback!({
      token: {
        sub: "user_123",
        email: "admin@onesource.local",
        name: "Alex Morgan",
        organizationId: "org_123",
        roleKeys: ["admin", "executive"],
      },
      user: undefined,
      account: null,
      profile: undefined,
      trigger: "update",
      isNewUser: false,
      session: undefined,
    });

    const session = await sessionCallback!({
      session: {
        expires: "2026-04-19T12:00:00.000Z",
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

    expect(mocks.getCurrentAuthenticatedUser).toHaveBeenCalledWith("user_123");
    expect(token).toMatchObject({
      sub: "user_123",
      email: "alex.updated@onesource.local",
      name: "Alex Updated",
      organizationId: "org_789",
      roleKeys: ["capture_manager"],
    });
    expect(session.user).toMatchObject({
      id: "user_123",
      email: "alex.updated@onesource.local",
      name: "Alex Updated",
      organizationId: "org_789",
      roleKeys: ["capture_manager"],
    });
  });
});
