import "@testing-library/jest-dom/vitest";

process.env.AUTH_SECRET ??= "development-auth-secret-for-vitest-suite";
process.env.DATABASE_URL ??=
  "postgresql://onesource:onesource@127.0.0.1:5432/onesource";
process.env.NEXTAUTH_URL ??= "http://127.0.0.1:3000";
process.env.SAM_GOV_USE_FIXTURES ??= "true";
