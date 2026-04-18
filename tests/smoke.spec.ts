import { expect, test } from "@playwright/test";

import {
  LOCAL_DEMO_PASSWORD,
  LOCAL_DEMO_SIGN_IN_EMAIL,
} from "../src/lib/auth/local-demo-auth.mjs";

test("authenticated homepage smoke test", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(
    page.getByRole("heading", {
      name: /sign in to the capture workspace/i,
    }),
  ).toBeVisible();

  await page.getByLabel("Email").fill(LOCAL_DEMO_SIGN_IN_EMAIL);
  await page.getByLabel("Password").fill(LOCAL_DEMO_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page).toHaveTitle(/OneSource/i);
  await expect(
    page.getByRole("heading", {
      name: /government opportunity tracking with audit-ready decisions/i,
    }),
  ).toBeVisible();
  await expect(page.getByText(/auth gate active/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /sign out/i })).toBeVisible();
});
