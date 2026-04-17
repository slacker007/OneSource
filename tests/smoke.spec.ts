import { expect, test } from "@playwright/test";

test("homepage smoke test", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/OneSource/i);
  await expect(
    page.getByRole("heading", {
      name: /government opportunity tracking with audit-ready decisions/i,
    }),
  ).toBeVisible();
  await expect(page.getByText(/foundation active/i)).toBeVisible();
});
