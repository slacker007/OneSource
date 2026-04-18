import { describe, expect, it } from "vitest";

import { LOCAL_DEMO_PASSWORD, LOCAL_DEMO_PASSWORD_HASH } from "./local-demo-auth.mjs";
import { verifyPasswordHash } from "./password";

describe("verifyPasswordHash", () => {
  it("accepts the seeded local development password", () => {
    expect(
      verifyPasswordHash(LOCAL_DEMO_PASSWORD, LOCAL_DEMO_PASSWORD_HASH),
    ).toBe(true);
  });

  it("rejects an incorrect password", () => {
    expect(
      verifyPasswordHash("WrongPassword!123", LOCAL_DEMO_PASSWORD_HASH),
    ).toBe(false);
  });

  it("rejects malformed password hashes", () => {
    expect(verifyPasswordHash(LOCAL_DEMO_PASSWORD, "not-a-valid-hash")).toBe(
      false,
    );
  });
});
