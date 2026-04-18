import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const useExternalServer = Boolean(process.env.PLAYWRIGHT_BASE_URL);

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: useExternalServer
    ? undefined
    : {
        command: `DATABASE_URL=${
          process.env.DATABASE_URL ??
          "postgresql://onesource:onesource@127.0.0.1:5432/onesource"
        } AUTH_SECRET=${
          process.env.AUTH_SECRET ??
          "development-auth-secret-for-playwright-local"
        } NEXTAUTH_URL=${
          process.env.NEXTAUTH_URL ?? "http://127.0.0.1:3000"
        } SAM_GOV_USE_FIXTURES=${
          process.env.SAM_GOV_USE_FIXTURES ?? "true"
        } npm run dev`,
        url: "http://127.0.0.1:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
