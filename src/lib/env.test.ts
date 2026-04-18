import { describe, expect, it } from "vitest";

import { parseServerEnv } from "@/lib/env";

describe("parseServerEnv", () => {
  it("accepts a valid postgres connection string and applies defaults", () => {
    const env = parseServerEnv({
      AUTH_SECRET: "development-auth-secret-for-local-testing",
      DATABASE_URL: "postgresql://onesource:onesource@127.0.0.1:5432/onesource",
      NEXTAUTH_URL: "http://127.0.0.1:3000",
    });

    expect(env.DOCUMENT_UPLOAD_DIR).toBe(".data/opportunity-documents");
    expect(env.NODE_ENV).toBe("development");
    expect(env.WORKER_POLL_INTERVAL_MS).toBe(30000);
  });

  it("rejects non-postgres database protocols", () => {
    expect(() =>
      parseServerEnv({
        AUTH_SECRET: "development-auth-secret-for-local-testing",
        DATABASE_URL: "https://example.com/not-a-database",
        NEXTAUTH_URL: "http://127.0.0.1:3000",
      }),
    ).toThrow(/postgres connection string/i);
  });

  it("requires a sufficiently long auth secret", () => {
    expect(() =>
      parseServerEnv({
        AUTH_SECRET: "too-short",
        DATABASE_URL:
          "postgresql://onesource:onesource@127.0.0.1:5432/onesource",
        NEXTAUTH_URL: "http://127.0.0.1:3000",
      }),
    ).toThrow(/auth_secret must be at least 32 characters/i);
  });

  it("requires an absolute auth URL", () => {
    expect(() =>
      parseServerEnv({
        AUTH_SECRET: "development-auth-secret-for-local-testing",
        DATABASE_URL:
          "postgresql://onesource:onesource@127.0.0.1:5432/onesource",
        NEXTAUTH_URL: "/sign-in",
      }),
    ).toThrow(/nextauth_url must be a valid absolute url/i);
  });
});
