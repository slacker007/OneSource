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
      name: /capture dashboard with live seeded pipeline queries/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /counts by stage/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /upcoming deadlines/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /top opportunities/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /va claims intake automation bpa/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("searchbox", { name: /global search/i }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /sign out/i })).toBeVisible();
  await page.getByRole("link", { name: /^Opportunities/i }).click();
  await expect(page).toHaveURL(/\/opportunities$/);
  await expect(
    page.getByRole("heading", {
      name: /opportunity pipeline/i,
    }),
  ).toBeVisible();
  await page.locator("#opportunity-source").selectOption("manual_entry");
  await page
    .locator("#opportunity-stage")
    .selectOption("proposal_in_development");
  await page.getByRole("button", { name: /apply filters/i }).click();
  await expect(page).toHaveURL(/\/opportunities\?/);
  await expect(page).toHaveURL(/source=manual_entry/);
  await expect(page).toHaveURL(/stage=proposal_in_development/);
  await expect(
    page.getByRole("table", { name: /opportunity pipeline results/i }),
  ).toBeVisible();
  await expect(
    page.getByText(/va claims intake automation bpa/i),
  ).toBeVisible();
  await expect(
    page.getByText(/enterprise knowledge management support services/i),
  ).not.toBeVisible();
  await page.getByRole("link", { name: /^Sources/i }).click();
  await expect(page).toHaveURL(/\/sources$/);
  await expect(
    page.getByRole("heading", {
      name: /external source search/i,
    }),
  ).toBeVisible();
  await page.getByLabel(/keywords/i).fill("cloud operations");
  await page.locator("#ptype-r").check();
  await page.getByLabel(/place of performance state/i).fill("VA");
  await expect(
    page.getByRole("button", { name: /search external opportunities/i }),
  ).toBeVisible();
  await page.getByRole("button", { name: /search external opportunities/i }).click();
  await expect(page).toHaveURL(/\/sources\?/);
  await expect(page).toHaveURL(/keywords=cloud\+operations/);
  await expect(page).toHaveURL(/ptype=r/);
  await expect(page).toHaveURL(/state=VA/);
  await expect(
    page.getByRole("table", { name: /external source search results/i }),
  ).toBeVisible();
  await expect(
    page.getByText(/army cloud operations recompete/i),
  ).toBeVisible();
  await expect(
    page.getByText(/enterprise knowledge management support services/i),
  ).not.toBeVisible();
  await expect(
    page.getByText(/title: cloud operations/i),
  ).toBeVisible();
  await page.getByRole("link", { name: /preview result/i }).click();
  await expect(
    page.getByRole("heading", {
      name: /source-result preview/i,
    }),
  ).toBeVisible();
  const linkButton = page.getByRole("button", {
    name: /link to selected opportunity/i,
  });
  if (await linkButton.isVisible()) {
    await expect(
      page.getByText(/strong duplicate/i).first(),
    ).toBeVisible();
    await linkButton.click();
  }
  await expect(
    page.getByText(
      /this source notice is already linked to the tracked opportunity army cloud operations recompete/i,
    ),
  ).toBeVisible();
  await page.getByRole("link", { name: /^Analytics/i }).click();
  await expect(page).toHaveURL(/\/analytics$/);
  await expect(
    page.getByRole("heading", {
      name: /analytics workspace/i,
    }),
  ).toBeVisible();
  await page.getByRole("link", { name: /^Settings/i }).click();
  await expect(page).toHaveURL(/\/settings$/);
  await expect(
    page.getByRole("heading", {
      name: /admin console/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /assigned roles/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /recent audit activity/i,
    }),
  ).toBeVisible();
  await expect(page.getByText(/admin@onesource\.local/i).first()).toBeVisible();
  await expect(page.getByText(/seed\.bootstrap/i).first()).toBeVisible();
});

test.describe("mobile navigation", () => {
  test.use({
    viewport: {
      width: 390,
      height: 844,
    },
  });

  test("small-screen users can navigate from the shell drawer", async ({
    page,
  }) => {
    await signIn(page, LOCAL_DEMO_SIGN_IN_EMAIL);

    await expect(page).toHaveURL(/\/$/);
    await page.getByRole("button", { name: /open navigation menu/i }).click();
    await expect(
      page.getByRole("navigation", { name: /mobile navigation/i }),
    ).toBeVisible();
    await page.getByRole("link", { name: /^Opportunities/i }).click();
    await expect(page).toHaveURL(/\/opportunities$/);
    await expect(
      page.getByRole("heading", {
        name: /opportunity pipeline/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("table", { name: /opportunity pipeline results/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("searchbox", { name: /global search/i }),
    ).toBeVisible();
  });
});

test("viewer users are blocked from the restricted settings route", async ({
  page,
}) => {
  await signIn(page, LOCAL_DEMO_VIEWER_EMAIL);

  await expect(page).toHaveURL(/\/$/);
  await page.goto("/settings");
  await expect(page).toHaveURL(
    /\/forbidden\?permission=manage_workspace_settings$/,
  );
  await expect(
    page.getByRole("heading", {
      name: /you do not have access to manage workspace settings/i,
    }),
  ).toBeVisible();
});
