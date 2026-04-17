import { describe, expect, it } from "vitest";

import { parseServerEnv } from "@/lib/env";

describe("parseServerEnv", () => {
  it("accepts a valid postgres connection string and applies defaults", () => {
    const env = parseServerEnv({
      DATABASE_URL: "postgresql://onesource:onesource@127.0.0.1:5432/onesource",
    });

    expect(env.NODE_ENV).toBe("development");
    expect(env.WORKER_POLL_INTERVAL_MS).toBe(30000);
  });

  it("rejects non-postgres database protocols", () => {
    expect(() =>
      parseServerEnv({
        DATABASE_URL: "https://example.com/not-a-database",
      }),
    ).toThrow(/postgres connection string/i);
  });
});
