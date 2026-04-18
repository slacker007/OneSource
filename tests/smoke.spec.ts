import { expect, test, type Page } from "@playwright/test";

import {
  LOCAL_DEMO_PASSWORD,
  LOCAL_DEMO_SIGN_IN_EMAIL,
  LOCAL_DEMO_VIEWER_EMAIL,
} from "../src/lib/auth/local-demo-auth.mjs";

async function signIn(page: Page, email: string) {
  await page.goto("/");

  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(
    page.getByRole("heading", {
      name: /sign in to the capture workspace/i,
    }),
  ).toBeVisible();

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(LOCAL_DEMO_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
}

test("authenticated homepage smoke test", async ({ page }) => {
  await signIn(page, LOCAL_DEMO_SIGN_IN_EMAIL);

  await expect(page).toHaveURL(/\/$/);
  await expect(page).toHaveTitle(/OneSource/i);
  await expect(
    page.getByRole("heading", {
      name: /government opportunity tracking with audit-ready decisions/i,
    }),
  ).toBeVisible();
  await expect(page.getByText(/authz guard active/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /sign out/i })).toBeVisible();
  await page.getByRole("link", { name: /open protected settings surface/i }).click();
  await expect(page).toHaveURL(/\/settings$/);
  await expect(
    page.getByRole("heading", {
      name: /workspace settings/i,
    }),
  ).toBeVisible();
});

test("viewer users are blocked from the restricted settings route", async ({
  page,
}) => {
  await signIn(page, LOCAL_DEMO_VIEWER_EMAIL);

  await expect(page).toHaveURL(/\/$/);
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/forbidden\?permission=manage_workspace_settings$/);
  await expect(
    page.getByRole("heading", {
      name: /you do not have access to manage workspace settings/i,
    }),
  ).toBeVisible();
});
