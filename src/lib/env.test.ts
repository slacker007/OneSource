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
    expect(env.SAM_GOV_SEARCH_ENDPOINT).toBe(
      "https://api.sam.gov/prod/opportunities/v2/search",
    );
    expect(env.SAM_GOV_TIMEOUT_MS).toBe(15000);
    expect(env.SAM_GOV_USE_FIXTURES).toBe(false);
    expect(env.WORKER_POLL_INTERVAL_MS).toBe(30000);
    expect(env.DEADLINE_REMINDER_LOOKAHEAD_DAYS).toBe(7);
    expect(env.SOURCE_SYNC_INTERVAL_MINUTES).toBe(1440);
    expect(env.SOURCE_SYNC_BATCH_SIZE).toBe(3);
    expect(env.DOCUMENT_PARSER_BATCH_SIZE).toBe(10);
    expect(env.DOCUMENT_PARSER_MAX_ATTEMPTS).toBe(3);
    expect(env.OPPORTUNITY_SCORECARD_BATCH_SIZE).toBe(10);
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

  it("parses optional SAM.gov connector settings", () => {
    const env = parseServerEnv({
      AUTH_SECRET: "development-auth-secret-for-local-testing",
      DATABASE_URL: "postgresql://onesource:onesource@127.0.0.1:5432/onesource",
      NEXTAUTH_URL: "http://127.0.0.1:3000",
      SAM_GOV_API_KEY: "test-public-key",
      SAM_GOV_SEARCH_ENDPOINT: "https://api.sam.gov/prod/opportunities/v2/search",
      SAM_GOV_TIMEOUT_MS: "20000",
      SAM_GOV_USE_FIXTURES: "true",
      SOURCE_SYNC_INTERVAL_MINUTES: "120",
      SOURCE_SYNC_BATCH_SIZE: "2",
      DOCUMENT_PARSER_BATCH_SIZE: "4",
      DOCUMENT_PARSER_MAX_ATTEMPTS: "5",
      OPPORTUNITY_SCORECARD_BATCH_SIZE: "6",
    });

    expect(env.SAM_GOV_API_KEY).toBe("test-public-key");
    expect(env.SAM_GOV_TIMEOUT_MS).toBe(20000);
    expect(env.SAM_GOV_USE_FIXTURES).toBe(true);
    expect(env.SOURCE_SYNC_INTERVAL_MINUTES).toBe(120);
    expect(env.SOURCE_SYNC_BATCH_SIZE).toBe(2);
    expect(env.DOCUMENT_PARSER_BATCH_SIZE).toBe(4);
    expect(env.DOCUMENT_PARSER_MAX_ATTEMPTS).toBe(5);
    expect(env.OPPORTUNITY_SCORECARD_BATCH_SIZE).toBe(6);
  });
});
