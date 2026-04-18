import { describe, expect, it, vi } from "vitest";

import { LOCAL_DEMO_PASSWORD, LOCAL_DEMO_PASSWORD_HASH } from "./local-demo-auth.mjs";
import {
  authenticateUserWithPassword,
  type AuthUserStore,
} from "./authenticate-user";

function createStore(overrides?: Partial<Awaited<ReturnType<AuthUserStore["findByEmail"]>>>) {
  const record = overrides === null
    ? null
    : {
        id: "user_123",
        organizationId: "org_123",
        email: "admin@onesource.local",
        name: "Alex Morgan",
        passwordHash: LOCAL_DEMO_PASSWORD_HASH,
        status: "ACTIVE",
        roles: [{ role: { key: "admin" } }, { role: { key: "executive" } }],
        ...overrides,
      };

  return {
    findByEmail: vi.fn().mockResolvedValue(record),
  } satisfies AuthUserStore;
}

describe("authenticateUserWithPassword", () => {
  it("returns a session-safe user payload for valid credentials", async () => {
    const store = createStore();

    await expect(
      authenticateUserWithPassword(
        {
          email: " Admin@OneSource.local ",
          password: LOCAL_DEMO_PASSWORD,
        },
        store,
      ),
    ).resolves.toEqual({
      id: "user_123",
      organizationId: "org_123",
      email: "admin@onesource.local",
      name: "Alex Morgan",
      roleKeys: ["admin", "executive"],
    });

    expect(store.findByEmail).toHaveBeenCalledWith("admin@onesource.local");
  });

  it("rejects disabled users", async () => {
    const store = createStore({
      status: "DISABLED",
    });

    await expect(
      authenticateUserWithPassword(
        {
          email: "admin@onesource.local",
          password: LOCAL_DEMO_PASSWORD,
        },
        store,
      ),
    ).resolves.toBeNull();
  });

  it("rejects invalid passwords", async () => {
    const store = createStore();

    await expect(
      authenticateUserWithPassword(
        {
          email: "admin@onesource.local",
          password: "IncorrectPassword!123",
        },
        store,
      ),
    ).resolves.toBeNull();
  });

  it("rejects unknown users", async () => {
    const store = createStore(null);

    await expect(
      authenticateUserWithPassword(
        {
          email: "missing@onesource.local",
          password: LOCAL_DEMO_PASSWORD,
        },
        store,
      ),
    ).resolves.toBeNull();
  });
});
