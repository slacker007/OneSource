import { expect, test, type Locator, type Page } from "@playwright/test";

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
      name: /sign in to onesource/i,
    }),
  ).toBeVisible();

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(LOCAL_DEMO_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button", { name: /sign out/i })).toBeVisible();
}

async function ensureDesktopNavigationReady(page: Page) {
  await expect(page.getByLabel("Primary navigation")).toBeVisible();
}

function formatDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

async function openWorkspaceSection(
  page: Page,
  navigation: Locator,
  sectionLabel: RegExp,
) {
  const href = await navigation
    .getByRole("link", { name: sectionLabel })
    .getAttribute("href");

  if (!href) {
    throw new Error(
      `The workspace section link ${sectionLabel} was not available.`,
    );
  }

  await page.goto(href);
}

async function selectMuiOption(
  page: Page,
  target: Locator | string,
  optionName: RegExp | string,
) {
  const combobox = typeof target === "string" ? page.locator(target) : target;
  await combobox.click();
  await page.getByRole("option", { name: optionName }).click();
}

async function selectFirstMuiOption(page: Page, target: Locator | string) {
  const combobox = typeof target === "string" ? page.locator(target) : target;
  await combobox.scrollIntoViewIfNeeded();
  await combobox.click();
  const options = page.getByRole("option");
  const optionCount = await options.count();

  for (let index = 0; index < optionCount; index += 1) {
    const option = options.nth(index);
    const optionLabel = (await option.textContent())?.trim() ?? "";

    if (!optionLabel || /blocked/i.test(optionLabel)) {
      continue;
    }

    await option.click();
    return optionLabel;
  }

  throw new Error("No selectable option was available in the MUI listbox.");
}

async function resolveOpportunityFilterContext(page: Page) {
  const desktopQueryInput = page.locator("#desktop-opportunity-query");

  if (await desktopQueryInput.isVisible()) {
    return {
      form: desktopQueryInput.locator("xpath=ancestor::form[1]"),
      prefix: "desktop" as const,
      queryInput: desktopQueryInput,
    };
  }

  const mobileQueryInput = page.locator("#mobile-opportunity-query");

  if (!(await mobileQueryInput.isVisible())) {
    await page
      .getByRole("button", { name: /^(show filters|hide filters|filters)$/i })
      .click();

    if (await desktopQueryInput.isVisible()) {
      return {
        form: desktopQueryInput.locator("xpath=ancestor::form[1]"),
        prefix: "desktop" as const,
        queryInput: desktopQueryInput,
      };
    }

    await expect(mobileQueryInput).toBeVisible();
  }

  return {
    form: mobileQueryInput.locator("xpath=ancestor::form[1]"),
    prefix: "mobile" as const,
    queryInput: mobileQueryInput,
  };
}

async function fillOpportunityQuery(page: Page, value: string) {
  const { queryInput } = await resolveOpportunityFilterContext(page);
  await queryInput.fill(value);
}

async function applyOpportunityFilters(page: Page) {
  const { form } = await resolveOpportunityFilterContext(page);
  const previousUrl = page.url();

  await Promise.all([
    page
      .waitForURL((url) => url.toString() !== previousUrl, {
        timeout: 10_000,
      })
      .catch(() => undefined),
    form.evaluate((node) => (node as HTMLFormElement).requestSubmit()),
  ]);
}

test("authenticated homepage smoke test", async ({ page }) => {
  test.setTimeout(90_000);

  const csvImportSeed = Date.now();
  const csvImportTitle = `Zero Trust Boundary Engineering Bridge ${csvImportSeed}`;
  const csvImportSolicitation = `DHS-CISA-26-${csvImportSeed}`;
  const knowledgeAssetTitle = `Transition Narrative ${csvImportSeed}`;
  const managedUserEmail = `ops.admin.${csvImportSeed}@onesource.local`;
  const csvImportFixture = `Opportunity Title,Agency,Solicitation Number,Response Deadline,NAICS Code,Description
${csvImportTitle},Department of Homeland Security,${csvImportSolicitation},2026-07-15,541512,Security engineering and transition support for a zero trust bridge effort.
Enterprise Knowledge Management Support Services,99th Contracting Squadron,FA4861-26-R-0001,2026-05-04,541511,Existing Air Force pursuit that should be detected as a duplicate.
Cloud Intake Pilot,Department of Veterans Affairs,VA-26-009,13/45/2026,5415X,This row should stay invalid because the deadline and NAICS code are malformed.
Army Cloud Operations Recompete,PEO Enterprise Information Systems,,2026-05-20,541512,Title and aligned key fields should force manual review instead of direct import.`;

  await signIn(page, LOCAL_DEMO_SIGN_IN_EMAIL);
  await ensureDesktopNavigationReady(page);
  await expect(
    page
      .getByLabel("Primary navigation")
      .getByRole("link", { name: /^dashboard$/i }),
  ).toHaveCSS("border-radius", "0px");
  await expect(
    page
      .getByLabel("Primary navigation")
      .getByRole("link", { name: /^dashboard$/i }),
  ).toHaveCSS("min-height", "40px");

  await expect(page).toHaveURL(/\/$/);
  await expect(page).toHaveTitle(/OneSource/i);
  await expect(
    page.getByRole("heading", {
      name: /execution overview/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /attention queue/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /upcoming deadlines/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /top pursuits/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /task burden/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /pipeline risk/i,
    }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("heading", {
        name: /va claims intake automation bpa/i,
      })
      .first(),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /recent source activity/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /open command search/i }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /sign out/i })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /^Review deadline queue$/i }).first(),
  ).toHaveCSS("color", "rgb(255, 255, 255)");
  await page.getByRole("link", { name: /^View pipeline$/i }).click();
  await expect(page).toHaveURL(/\/opportunities$/);
  await expect(
    page.getByRole("heading", {
      name: /opportunity pipeline/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /proposal sprint/i }),
  ).toBeVisible();
  await page.goto(
    "/opportunities?source=manual_entry&stage=proposal_in_development",
  );
  await expect(page).toHaveURL(/\/opportunities\?/);
  await expect(page).toHaveURL(/source=manual_entry/);
  await expect(page).toHaveURL(/stage=proposal_in_development/);
  await expect(
    page.getByRole("grid", { name: /opportunity pipeline results/i }),
  ).toBeVisible();
  const opportunityResultsTable = page.getByRole("grid", {
    name: /opportunity pipeline results/i,
  });
  await expect(
    opportunityResultsTable.getByText(/va claims intake automation bpa/i),
  ).toBeVisible();
  await expect(
    opportunityResultsTable.getByText(
      /enterprise knowledge management support services/i,
    ),
  ).not.toBeVisible();
  await opportunityResultsTable
    .getByRole("link", { name: /preview/i })
    .first()
    .click();
  await expect(
    page.getByRole("complementary", { name: /selected pursuit/i }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /close opportunity preview/i })
    .click();
  await page
    .getByLabel("Primary navigation")
    .getByRole("link", { name: /^Knowledge/i })
    .click();
  await expect(page).toHaveURL(/\/knowledge$/);
  await expect(
    page.getByRole("heading", {
      name: /knowledge library/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("table", { name: /knowledge asset results/i }),
  ).toBeVisible();
  await expect(page.getByText("Selected asset", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /copy reusable content/i }),
  ).toBeVisible();
  await expect(
    page.getByText(/air force operational planning past performance/i),
  ).toBeVisible();
  await selectMuiOption(page, "#desktop-knowledge-type", /win theme/i);
  await selectMuiOption(
    page,
    "#desktop-knowledge-capability",
    /cloud platform engineering/i,
  );
  await page.getByRole("button", { name: /apply filters/i }).click();
  await expect(page).toHaveURL(/\/knowledge\?/);
  await expect(page).toHaveURL(/type=WIN_THEME/);
  await expect(page).toHaveURL(/capability=cloud-platform-engineering/);
  await expect(
    page
      .getByRole("table", { name: /knowledge asset results/i })
      .getByText(/army cloud transition win theme/i),
  ).toBeVisible();
  await page.getByRole("link", { name: /create knowledge asset/i }).click();
  await expect(page).toHaveURL(/\/knowledge\/new$/);
  await selectMuiOption(page, "#knowledge-asset-type", /win theme/i);
  await page.getByLabel(/asset title/i).fill(knowledgeAssetTitle);
  await page
    .getByLabel(/summary/i)
    .fill("Reusable zero-trust transition narrative.");
  await page
    .getByLabel(/reusable content/i)
    .fill(
      "This reusable win theme explains how to stabilize a zero-trust transition while improving operational visibility and keeping disruption low for the mission team.",
    );
  await page.getByLabel(/tags/i).fill("zero trust, transition");
  await page
    .locator(
      'label:has-text("PEO Enterprise Information Systems") input[name="agencyIds"]',
    )
    .check();
  await page
    .locator('input[name="capabilityKeys"][value="cloud-platform-engineering"]')
    .check();
  await page
    .locator('input[name="contractTypes"][value="Solicitation"]')
    .check();
  await page
    .locator('input[name="vehicleCodes"][value="OASIS-PLUS-UNR"]')
    .check();
  await page
    .getByRole("checkbox", { name: /army cloud operations recompete/i })
    .check();
  await page.getByRole("button", { name: /create knowledge asset/i }).click();
  await expect(page).toHaveURL(/\/knowledge\/.+\/edit\?created=1$/);
  await expect(page.getByText(/knowledge asset created/i)).toBeVisible();
  await page.getByRole("link", { name: /return to library/i }).click();
  await expect(page).toHaveURL(/\/knowledge$/);
  await page.locator("#desktop-knowledge-query").fill(knowledgeAssetTitle);
  await selectMuiOption(page, "#desktop-knowledge-vehicle", /oasis/i);
  await page.getByRole("button", { name: /apply filters/i }).click();
  await expect(page).toHaveURL(/\/knowledge\?/);
  await expect(page).toHaveURL(/vehicle=OASIS-PLUS-UNR/);
  await expect(
    page
      .getByRole("table", { name: /knowledge asset results/i })
      .getByText(
        new RegExp(
          knowledgeAssetTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "i",
        ),
      ),
  ).toBeVisible();
  await expect(
    page
      .getByRole("table", { name: /knowledge asset results/i })
      .getByText(/army cloud operations recompete/i),
  ).toBeVisible();
  await expect(
    page
      .getByRole("table", { name: /knowledge asset results/i })
      .getByText(/cloud platform engineering/i),
  ).toBeVisible();
  await page.goto("/sources");
  await expect(page).toHaveURL(/\/sources$/);
  await expect(
    page.getByRole("heading", {
      name: /external source search/i,
    }),
  ).toBeVisible();
  await page.getByLabel(/keywords/i).fill("cloud operations");
  await page
    .getByText(/advanced filters, procurement types, and pagination/i)
    .click();
  await page.locator("#ptype-r").check();
  await page.getByLabel(/place of performance state/i).fill("VA");
  await expect(
    page.getByRole("button", { name: /search external opportunities/i }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /search external opportunities/i })
    .click();
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
  await expect(page.getByText(/title: cloud operations/i)).toBeVisible();
  await page.getByRole("link", { name: /^inspect import$/i }).click();
  await expect(page).toHaveURL(/preview=/);
  await expect(
    page.getByRole("link", { name: /close preview/i }),
  ).toBeVisible();
  const linkButton = page.getByRole("button", {
    name: /merge into selected opportunity|link to selected opportunity/i,
  });
  if (await linkButton.isVisible()) {
    await expect(
      page.getByText(/strong duplicate|possible duplicate/i).first(),
    ).toBeVisible();
    await linkButton.click();
  }
  await expect(
    page.getByText(
      /this source notice is already linked to the tracked opportunity army cloud operations recompete/i,
    ),
  ).toBeVisible();
  await page.getByLabel(/upload csv file/i).setInputFiles({
    buffer: Buffer.from(csvImportFixture, "utf8"),
    mimeType: "text/csv",
    name: "opportunity-import-sample.csv",
  });
  await expect(
    page.getByRole("table", { name: /csv import preview rows/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /import 1 clean row/i }),
  ).toBeEnabled();
  await page.getByRole("button", { name: /import 1 clean row/i }).click();
  await expect(
    page.getByText(/imported 1 row into the tracked pipeline/i),
  ).toBeVisible();
  await page
    .getByLabel("Primary navigation")
    .getByRole("link", { name: /^Opportunities/i })
    .click();
  await expect(page).toHaveURL(/\/opportunities$/);
  await page.goto(`/opportunities?q=${encodeURIComponent(csvImportTitle)}`);
  await expect(page).toHaveURL(/\/opportunities\?/);
  const importedOpportunityResultsTable = page.getByRole("grid", {
    name: /opportunity pipeline results/i,
  });
  await expect(
    importedOpportunityResultsTable.getByText(
      new RegExp(csvImportTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
    ),
  ).toBeVisible();
  await page.getByRole("link", { name: /^Analytics/i }).click();
  await expect(page).toHaveURL(/\/analytics$/);
  await expect(
    page.getByRole("heading", {
      name: /decision console/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("table", { name: /decision console rankings/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /decision posture/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /score bands/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /effort versus outcome/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /stage conversion funnel/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /stage aging/i }),
  ).toBeVisible();
  await expect(
    page.getByText(/recommendation alignment/i).first(),
  ).toBeVisible();
  await expect(page.getByText(/85%\+/i)).toBeVisible();
  await selectMuiOption(page, "#decision-ranking", /risk pressure/i);
  await page.getByRole("button", { name: /apply ranking/i }).click();
  await expect(page).toHaveURL(/\/analytics\?/);
  await expect(page).toHaveURL(/ranking=risk/);
  await expect(page.getByText(/risk pressure/i).first()).toBeVisible();
  await expect(
    page.getByText(/enterprise knowledge management support services/i).first(),
  ).toBeVisible();
  const stageQueueLink = page
    .locator("main")
    .getByRole("link", {
      name: /view .* queue/i,
    })
    .first();
  await expect(stageQueueLink).toBeVisible();
  const stageQueueHref = await stageQueueLink.getAttribute("href");
  expect(stageQueueHref).toMatch(/\/opportunities\?stage=/);
  await page.goto(stageQueueHref ?? "/opportunities");
  await expect(page).toHaveURL(/\/opportunities\?stage=/);
  await expect(
    page.getByRole("grid", { name: /opportunity pipeline results/i }),
  ).toBeVisible();
  await page.getByRole("link", { name: /^Settings/i }).click();
  await expect(page).toHaveURL(/\/settings$/);
  await expect(
    page.getByRole("heading", {
      name: /workspace settings/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /open connectors/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /open saved searches/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /open scoring profile/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /open audit activity/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("table", {
      name: /source connector health/i,
    }),
  ).toHaveCount(0);
  await page.goto("/settings/connectors");
  await expect(
    page.getByRole("heading", {
      name: /connector operations/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("table", {
      name: /source connector health/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("table", {
      name: /recent source sync runs/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("table", {
      name: /failed import review/i,
    }),
  ).toBeVisible();
  await expect(page.getByText(/sam\.gov/i).first()).toBeVisible();
  await expect(page.getByText(/rate[- ]limited/i).first()).toBeVisible();
  await expect(page.getByText(/rejected/i).first()).toBeVisible();
  await page
    .getByRole("button", { name: /retry sync/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/settings\/connectors\?/);
  await expect(
    page.getByText(/saved search retry has been queued/i),
  ).toBeVisible();
  await page.goto("/settings/saved-searches");
  await expect(
    page.getByRole("heading", {
      name: /^saved searches$/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("table", {
      name: /saved searches/i,
    }),
  ).toBeVisible();
  await expect(page.getByText(/sam\.gov/i).first()).toBeVisible();
  await page.goto("/settings/scoring");
  await expect(
    page.getByRole("heading", {
      name: /scoring profile/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("table", {
      name: /weighted scoring criteria/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /scoring recalibration/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("table", {
      name: /observed outcome summaries/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: /apply observed-outcome suggestions/i,
    }),
  ).toBeVisible();
  await page.locator("#weight-capability_fit").fill("28.25");
  await page
    .locator("#scoring-recalibration-note")
    .fill(
      "Lowered capability fit slightly after reviewing recent closed outcomes.",
    );
  await page
    .getByRole("button", { name: /save manual recalibration/i })
    .click();
  await expect(page).toHaveURL(/\/settings\/scoring\?/);
  await expect(page).toHaveURL(/scoringRecalibration=success/);
  await expect(
    page.getByText(/manual scoring recalibration was saved/i),
  ).toBeVisible();
  await expect(page.locator("#weight-capability_fit")).toHaveValue("28.25");
  await expect(page.getByText(/model default_capture_v1/i)).toBeVisible();
  await page.goto("/settings/audit");
  await expect(
    page.getByRole("heading", {
      name: /audit activity/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("table", {
      name: /audit activity/i,
    }),
  ).toBeVisible();
  await page
    .getByLabel("Primary navigation")
    .getByRole("link", { name: /^Users & Roles$/i })
    .click();
  await expect(page).toHaveURL(/\/settings\/users$/);
  await expect(
    page
      .getByLabel("Primary navigation")
      .getByRole("link", { name: /^Users & Roles$/i }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    page
      .getByLabel("Primary navigation")
      .getByRole("link", { name: /^Settings$/i }),
  ).not.toHaveAttribute("aria-current", "page");
  await expect(
    page.getByRole("heading", {
      name: /user administration/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("grid", {
      name: /workspace users/i,
    }),
  ).toBeVisible();
  const waitForUsersMutation = () =>
    page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url().includes("/settings/users"),
    );
  await page.getByRole("button", { name: /^Invite user$/i }).click();
  const inviteDialog = page.getByRole("dialog", {
    name: /invite workspace user/i,
  });
  await expect(inviteDialog).toBeVisible();
  await inviteDialog.getByLabel(/^email$/i).fill(managedUserEmail);
  await inviteDialog.getByLabel(/display name/i).fill("Ops Admin");
  await inviteDialog.getByRole("checkbox", { name: /executive/i }).check();
  const inviteMutation = waitForUsersMutation();
  await inviteDialog
    .locator("#invite-workspace-user-form")
    .evaluate((form) => (form as HTMLFormElement).requestSubmit());
  await inviteMutation;
  await expect(inviteDialog).not.toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/\/settings\/users$/);
  await expect(
    page.getByRole("grid", {
      name: /workspace users/i,
    }),
  ).toBeVisible();
  await page.getByLabel(/search users/i).fill(managedUserEmail);
  await expect(
    page
      .getByRole("grid", { name: /workspace users/i })
      .getByText(managedUserEmail),
  ).toBeVisible();
  await page
    .getByRole("grid", { name: /workspace users/i })
    .getByText(managedUserEmail)
    .click();
  const selectedUserPanel = page.getByRole("complementary");
  await selectedUserPanel.getByRole("checkbox", { name: /admin/i }).check();
  const roleMutation = waitForUsersMutation();
  await selectedUserPanel.getByRole("button", { name: /save roles/i }).click();
  await roleMutation;
  await page.reload();
  await page.getByLabel(/search users/i).fill(managedUserEmail);
  await page
    .getByRole("grid", { name: /workspace users/i })
    .getByText(managedUserEmail)
    .click();
  await expect(
    selectedUserPanel.getByRole("checkbox", { name: /admin/i }),
  ).toBeChecked();
  const disableMutation = waitForUsersMutation();
  await selectedUserPanel
    .getByRole("button", { name: /disable user/i })
    .click();
  await disableMutation;
  await page.reload();
  await page.getByLabel(/search users/i).fill(managedUserEmail);
  await page
    .getByRole("grid", { name: /workspace users/i })
    .getByText(managedUserEmail)
    .click();
  await expect(
    selectedUserPanel.getByRole("button", { name: /re-enable user/i }),
  ).toBeVisible();
  const reactivateMutation = waitForUsersMutation();
  await selectedUserPanel
    .getByRole("button", { name: /re-enable user/i })
    .click();
  await reactivateMutation;
  await page.reload();
  await page.getByLabel(/search users/i).fill(managedUserEmail);
  await page
    .getByRole("grid", { name: /workspace users/i })
    .getByText(managedUserEmail)
    .click();
  await expect(
    selectedUserPanel.getByRole("button", { name: /disable user/i }),
  ).toBeVisible();
});

test("users can create and edit tracked opportunities from the app", async ({
  page,
}) => {
  const opportunityTitle = `Zero Trust Integration Support Bridge ${Date.now()}`;
  const updatedOpportunityTitle = `${opportunityTitle} Updated`;

  await signIn(page, LOCAL_DEMO_SIGN_IN_EMAIL);
  await ensureDesktopNavigationReady(page);

  await page
    .getByLabel("Primary navigation")
    .getByRole("link", { name: /^Opportunities/i })
    .click();
  await expect(page).toHaveURL(/\/opportunities$/);
  await page.getByRole("link", { name: /create tracked opportunity/i }).click();
  await expect(page).toHaveURL(/\/opportunities\/new$/);

  await page.getByLabel(/opportunity title/i).fill(opportunityTitle);
  await page
    .getByLabel(/description/i)
    .fill(
      "Bridge pursuit covering zero trust engineering and transition support.",
    );
  await page.getByLabel(/solicitation number/i).fill("ZT-2026-001");
  await page.getByLabel(/NAICS code/i).fill("541512");
  await page.getByLabel(/response deadline/i).fill("2026-06-18");
  await expect(page.getByText(/draft saved locally at/i)).toBeVisible();

  await page.reload();
  await expect(page.getByLabel(/opportunity title/i)).toHaveValue(
    opportunityTitle,
  );
  await page.getByRole("button", { name: /^Create opportunity$/i }).click();

  await expect(page).toHaveURL(/\/opportunities\/.+\/edit\?created=1$/);
  await expect(
    page.getByText(
      /the new tracked opportunity is now persisted and ready for follow-on workspace work/i,
    ),
  ).toBeVisible();
  await expect(page.getByLabel(/opportunity title/i)).toHaveValue(
    opportunityTitle,
  );

  await page.getByLabel(/opportunity title/i).fill(updatedOpportunityTitle);
  await page.getByRole("button", { name: /save changes/i }).click();

  await expect(page).toHaveURL(/updated=1$/);
  await expect(
    page.getByText(
      /changes were saved through the guarded application flow and are now visible to the workspace/i,
    ),
  ).toBeVisible();
  await page.getByRole("link", { name: /back to opportunity list/i }).click();
  await expect(page).toHaveURL(/\/opportunities$/);
  await fillOpportunityQuery(page, updatedOpportunityTitle);
  await applyOpportunityFilters(page);
  const refreshedOpportunityResultsTable = page.getByRole("grid", {
    name: /opportunity pipeline results/i,
  });
  await expect(
    refreshedOpportunityResultsTable.getByText(updatedOpportunityTitle),
  ).toBeVisible();
});

test("users can open the opportunity workspace and review seeded sections", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const createdTaskTitle = `Prepare capture brief ${Date.now()}`;
  const createdMilestoneTitle = `Executive checkpoint ${Date.now()}`;
  const createdNoteTitle = `Capture note ${Date.now()}`;
  const createdDocumentTitle = `Capture Artifact ${Date.now()}`;
  const decisionRationale = `Leadership confirmed pursuit priority and staffing alignment ${Date.now()}.`;
  const createdMilestoneDate = new Date();
  createdMilestoneDate.setUTCDate(createdMilestoneDate.getUTCDate() + 7);

  await signIn(page, LOCAL_DEMO_SIGN_IN_EMAIL);
  await ensureDesktopNavigationReady(page);
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/opportunities?view=all&q=Enterprise+Knowledge+Management");
  await expect(page).toHaveURL(/\/opportunities\?view=all&q=/);

  await expect(page).toHaveURL(/q=Enterprise\+Knowledge\+Management/);
  const opportunityResultsTable = page.getByRole("grid", {
    name: /opportunity pipeline results/i,
  });
  await expect(
    opportunityResultsTable.getByText(
      /enterprise knowledge management support services/i,
    ),
  ).toBeVisible();
  await opportunityResultsTable
    .getByRole("link", { name: /preview/i })
    .first()
    .click();

  const initialWorkspaceHref = await page
    .getByRole("complementary", { name: /selected pursuit/i })
    .getByRole("link", { name: /^Open workspace$/i })
    .getAttribute("href");
  expect(initialWorkspaceHref).toMatch(/\/opportunities\//);
  await page.goto(initialWorkspaceHref ?? "/opportunities");

  await expect(page).toHaveURL(/\/opportunities\/.+$/);
  const workspaceSectionNav = page.getByRole("navigation", {
    name: /opportunity workspace sections/i,
  });
  await expect(
    page.locator("main h1").filter({
      hasText: "Enterprise Knowledge Management Support Services",
    }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /^Summary$/i })).toBeVisible();
  await expect(workspaceSectionNav).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /suggested reusable content/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /^Capture Summary$/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /^Air Force operational planning past performance$/i,
    }),
  ).toBeVisible();
  await expect(page.getByText(/linked to this opportunity/i)).toBeVisible();
  await expect(
    page.getByRole("link", { name: /open filtered library/i }),
  ).toHaveAttribute("href", /\/knowledge\?opportunity=/);
  await openWorkspaceSection(page, workspaceSectionNav, /^Capture/i);
  await expect(page).toHaveURL(/section=capture/);
  await expect(page.getByRole("heading", { name: /^Capture$/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /^Scoring$/i })).toBeVisible();
  await expect(page.getByText(/weight/i).first()).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /^Decision history$/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /^Stage transition$/i }),
  ).toBeVisible();
  await selectMuiOption(page, "#decision-create-type", /executive review/i);
  await selectMuiOption(page, "#decision-create-outcome", /^go$/i);
  await page.locator("#decision-create-rationale").fill(decisionRationale);
  await page.getByRole("button", { name: /^record decision$/i }).click();
  await openWorkspaceSection(page, workspaceSectionNav, /^Tasks/i);
  await expect(page).toHaveURL(/section=tasks/);
  await expect(page.getByRole("heading", { name: /^Tasks$/i })).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /^complete incumbent analysis brief$/i,
    }),
  ).toBeVisible();
  await expect(page.getByText(/^overdue$/i).first()).toBeVisible();
  await page.locator("#task-create-title").fill(createdTaskTitle);
  await selectMuiOption(
    page,
    "#task-create-assignee",
    /alex morgan|admin@onesource\.local/i,
  );
  await page.locator("#task-create-due-at").fill("2026-05-10");
  await selectMuiOption(page, "#task-create-status", /in progress/i);
  await selectMuiOption(page, "#task-create-priority", /^high$/i);
  await page
    .locator("#task-create-description")
    .fill("Prepare the concise executive-ready capture brief.");
  await page.getByRole("button", { name: /^create task$/i }).click();
  await expect(
    page.getByRole("heading", {
      name: new RegExp(`^${createdTaskTitle}$`, "i"),
    }),
  ).toBeVisible({ timeout: 20_000 });
  await page.locator("#milestone-create-title").fill(createdMilestoneTitle);
  await page
    .locator("#milestone-create-target-date")
    .fill(formatDateInputValue(createdMilestoneDate));
  await selectMuiOption(page, "#milestone-create-type", /decision checkpoint/i);
  await selectMuiOption(page, "#milestone-create-status", /at risk/i);
  await page
    .locator("#milestone-create-description")
    .fill("Confirm the executive review packet and pursuit posture.");
  await page.getByRole("button", { name: /^create milestone$/i }).click();
  await expect(
    page.getByRole("heading", {
      name: new RegExp(`^${createdMilestoneTitle}$`, "i"),
    }),
  ).toBeVisible({ timeout: 10_000 });
  await openWorkspaceSection(page, workspaceSectionNav, /^Notes/i);
  await expect(page).toHaveURL(/section=notes/);
  await expect(page.getByRole("heading", { name: /^Notes$/i })).toBeVisible();
  await page.locator("#note-create-title").fill(createdNoteTitle);
  await selectMuiOption(page, "#note-create-pinned", /pin to top/i);
  await page
    .locator("#note-create-body")
    .fill(
      "Customer signals remain positive and the capture plan should stay pinned for the team.",
    );
  await page.getByRole("button", { name: /^add note$/i }).click();
  await openWorkspaceSection(page, workspaceSectionNav, /^Documents/i);
  await expect(page).toHaveURL(/section=documents/);
  await expect(
    page.getByRole("heading", { name: /^Documents$/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /^Performance Work Statement$/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /download stored file/i }).first(),
  ).toBeVisible();
  await page.locator("#document-create-title").fill(createdDocumentTitle);
  await selectMuiOption(page, "#document-create-type", /capture plan/i);
  await page.getByLabel(/^file$/i).setInputFiles({
    buffer: Buffer.from(
      "Capture plan summary\n- Confirm teaming path\n- Prepare executive review package",
      "utf8",
    ),
    mimeType: "text/plain",
    name: "capture-plan.txt",
  });
  await page.getByRole("button", { name: /^upload document$/i }).click();
  await openWorkspaceSection(page, workspaceSectionNav, /^Documents/i);
  await expect(page).toHaveURL(/section=documents/);
  await openWorkspaceSection(page, workspaceSectionNav, /^History/i);
  await expect(page).toHaveURL(/section=history/);
  await expect(page.getByRole("heading", { name: /^History$/i })).toBeVisible();
  await expect(
    page
      .getByRole("heading", {
        name: /^Bid decision recorded as GO$/i,
      })
      .first(),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: new RegExp(`^Task created: ${createdTaskTitle}$`, "i"),
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: new RegExp(`^Milestone created: ${createdMilestoneTitle}$`, "i"),
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: new RegExp(`^Note added: ${createdNoteTitle}$`, "i"),
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: new RegExp(`^Document uploaded: ${createdDocumentTitle}$`, "i"),
    }),
  ).toBeVisible({ timeout: 15_000 });

  await page
    .getByLabel("Primary navigation")
    .getByRole("link", { name: /tasks/i })
    .click();
  await expect(page).toHaveURL(/\/tasks$/);
  await expect(
    page.getByRole("heading", { name: /execution triage/i }),
  ).toBeVisible();
  await expect(page.getByText(createdTaskTitle).first()).toBeVisible();
  await expect(
    page.getByText(/enterprise knowledge management support services/i).first(),
  ).toBeVisible();
  await page.getByRole("link", { name: /^Team Tasks/i }).click();
  await expect(page).toHaveURL(/\/tasks\?view=team_tasks/);
  await expect(page.getByText(createdTaskTitle).first()).toBeVisible();
  await page.getByRole("link", { name: /^Dashboard/i }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", { name: /upcoming deadlines/i }),
  ).toBeVisible();

  await page.goto("/opportunities");
  await expect(page).toHaveURL(/\/opportunities$/);
  await fillOpportunityQuery(page, "Enterprise Knowledge Management");
  await applyOpportunityFilters(page);
  await page
    .getByRole("grid", { name: /opportunity pipeline results/i })
    .getByRole("link", { name: /preview/i })
    .first()
    .click();
  const reopenedWorkspaceHref = await page
    .getByRole("complementary", { name: /selected pursuit/i })
    .getByRole("link", { name: /^Open workspace$/i })
    .getAttribute("href");
  expect(reopenedWorkspaceHref).toMatch(/\/opportunities\//);
  await page.goto(reopenedWorkspaceHref ?? "/opportunities");
  const reopenedWorkspaceSectionNav = page.getByRole("navigation", {
    name: /opportunity workspace sections/i,
  });
  await openWorkspaceSection(page, reopenedWorkspaceSectionNav, /^Capture/i);
  await expect(page).toHaveURL(/section=capture/);

  const targetStageLabel = await selectFirstMuiOption(
    page,
    "#stage-transition-target",
  );
  const escapedTargetStageLabel = targetStageLabel.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
  await page
    .locator("#stage-transition-rationale")
    .fill("Proposal staffing and artifacts are ready for development.");
  await page
    .getByRole("button", {
      name: new RegExp(`move to ${escapedTargetStageLabel}`, "i"),
    })
    .click();
  await expect(
    page.getByText(
      new RegExp(`Stage updated to ${escapedTargetStageLabel}`, "i"),
    ),
  ).toBeVisible();
  await openWorkspaceSection(page, reopenedWorkspaceSectionNav, /^History/i);
  await expect(page).toHaveURL(/section=history/);
  await expect(
    page
      .getByText(/proposal staffing and artifacts are ready for development\./i)
      .first(),
  ).toBeVisible();
});

test("users can record closeout notes on a closed opportunity workspace", async ({
  page,
}) => {
  const outcomeReason = `The team passed because the incumbent relationship edge stayed too strong ${Date.now()}.`;
  const lessonsLearned = `Document the relationship gap before bid review and exit sooner ${Date.now()}.`;

  await signIn(page, LOCAL_DEMO_SIGN_IN_EMAIL);
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/opportunities");
  await expect(page).toHaveURL(/\/opportunities$/);
  await fillOpportunityQuery(page, "Navy Training Range");
  await applyOpportunityFilters(page);

  const navyResultsTable = page.getByRole("grid", {
    name: /opportunity pipeline results/i,
  });
  await expect(
    navyResultsTable.getByText(/navy training range modernization support/i),
  ).toBeVisible();
  const navyOpportunityCard = navyResultsTable
    .getByRole("row")
    .filter({
      hasText: /navy training range modernization support/i,
    })
    .first();
  await navyOpportunityCard.getByRole("link", { name: /preview/i }).click();
  const closedWorkspaceHref = await page
    .getByRole("complementary", { name: /selected pursuit/i })
    .getByRole("link", { name: /^Open workspace$/i })
    .getAttribute("href");
  expect(closedWorkspaceHref).toMatch(/\/opportunities\//);
  await page.goto(closedWorkspaceHref ?? "/opportunities");
  await expect(page).toHaveURL(/\/opportunities\/.+$/);
  const closedWorkspaceSectionNav = page.getByRole("navigation", {
    name: /opportunity workspace sections/i,
  });
  await openWorkspaceSection(page, closedWorkspaceSectionNav, /^Capture/i);
  await expect(page).toHaveURL(/section=capture/);

  await expect(
    page.locator("main h1").filter({
      hasText: "Navy Training Range Modernization Support",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /^Closeout$/i }),
  ).toBeVisible();

  await selectMuiOption(
    page,
    "#closeout-competitor",
    /harbor mission technologies/i,
  );
  await page.locator("#closeout-outcome-reason").fill(outcomeReason);
  await page.locator("#closeout-lessons-learned").fill(lessonsLearned);
  await page
    .getByRole("button", { name: /^(record|update) closeout$/i })
    .click();

  await expect(page.getByRole("status")).toHaveText(
    /closeout notes recorded and added to workspace history/i,
  );
  await openWorkspaceSection(page, closedWorkspaceSectionNav, /^History/i);
  await expect(page).toHaveURL(/section=history/);
  await expect(
    page
      .getByRole("heading", { name: /^Closeout recorded for No Bid$/i })
      .first(),
  ).toBeVisible({ timeout: 10_000 });
});

test("users can update proposal tracking on an active proposal workspace", async ({
  page,
}) => {
  await signIn(page, LOCAL_DEMO_SIGN_IN_EMAIL);
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/opportunities");
  await expect(page).toHaveURL(/\/opportunities$/);
  await page.goto("/opportunities?q=VA+Claims+Intake+Automation");
  await expect(page).toHaveURL(/q=VA\+Claims\+Intake\+Automation/);

  const vaOpportunityCard = page
    .getByRole("grid", {
      name: /opportunity pipeline results/i,
    })
    .getByRole("row")
    .filter({
      hasText: /va claims intake automation bpa/i,
    })
    .first();
  await expect(vaOpportunityCard).toBeVisible();
  await vaOpportunityCard.getByRole("link", { name: /preview/i }).click();
  const proposalWorkspaceHref = await page
    .getByRole("complementary", { name: /selected pursuit/i })
    .getByRole("link", { name: /^Open workspace$/i })
    .getAttribute("href");
  expect(proposalWorkspaceHref).toMatch(/\/opportunities\//);
  await page.goto(proposalWorkspaceHref ?? "/opportunities");
  await expect(page).toHaveURL(/\/opportunities\/.+$/);
  const proposalWorkspaceSectionNav = page.getByRole("navigation", {
    name: /opportunity workspace sections/i,
  });
  await openWorkspaceSection(page, proposalWorkspaceSectionNav, /^Proposal/i);
  await expect(page).toHaveURL(/section=proposal/);

  await expect(
    page.locator("main h1").filter({
      hasText: "VA Claims Intake Automation BPA",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /^Proposal tracking$/i }),
  ).toBeVisible();

  const proposalStatus = page.locator("#proposal-status");
  await selectMuiOption(page, proposalStatus, /submitted/i);
  await expect(proposalStatus).toContainText(/submitted/i);
  const proposalOwner = page.locator("#proposal-owner");
  await selectMuiOption(page, proposalOwner, /casey brooks/i);
  await expect(proposalOwner).toContainText(/casey brooks/i);
  await page
    .getByRole("checkbox", { name: /final compliance review complete/i })
    .check();
  await page
    .getByRole("checkbox", { name: /requirement matrix reviewed/i })
    .check();
  await page.getByRole("button", { name: /^save proposal$/i }).click();

  await expect(page.locator("#proposal-status")).toContainText(/submitted/i);
  await expect(page.locator("#proposal-owner")).toContainText(/casey brooks/i);
  await expect(
    page.getByRole("checkbox", { name: /final compliance review complete/i }),
  ).toBeChecked();
  await expect(
    page.getByRole("checkbox", {
      name: /requirement matrix reviewed/i,
    }),
  ).toBeChecked();
});

test("desktop shell exposes the persistent drawer, command utilities, and notifications", async ({
  page,
}) => {
  await signIn(page, LOCAL_DEMO_SIGN_IN_EMAIL);

  await expect(page).toHaveURL(/\/$/);
  const primaryNavigation = page.getByLabel("Primary navigation");
  await expect(primaryNavigation.getByText(/^capture command$/i)).toBeVisible();
  await expect(primaryNavigation.getByText(/^intelligence$/i)).toBeVisible();
  await expect(
    page.getByRole("button", { name: /expand navigation rail/i }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /collapse navigation rail/i }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /open command search/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /open notifications/i }),
  ).toBeVisible();

  await page.keyboard.press("Control+k");
  await expect(
    page.getByRole("dialog", { name: /command center/i }),
  ).toBeVisible();
  await page
    .getByRole("searchbox", { name: /command search/i })
    .fill("create pursuit");
  await page
    .getByRole("button", { name: /pin create pursuit to pinned work/i })
    .first()
    .click();
  await page.getByRole("button", { name: /dismiss command center/i }).click();

  await page.keyboard.press("Control+k");
  await expect(page.getByText(/^pinned work$/i)).toBeVisible();
  await page
    .getByRole("link", { name: /create pursuit/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/opportunities\/new$/);
  await expect(
    page.getByRole("heading", { name: /create a tracked opportunity/i }),
  ).toBeVisible();

  await page
    .getByLabel("Primary navigation")
    .getByRole("link", { name: /^Knowledge/i })
    .click();
  await expect(page).toHaveURL(/\/knowledge$/);
  await expect(
    page.getByRole("heading", { name: /knowledge library/i }),
  ).toBeVisible();

  await page.getByRole("link", { name: /^Tasks/i }).click();
  await expect(page).toHaveURL(/\/tasks$/);
  await expect(
    page.getByRole("heading", { name: /execution triage/i }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /^My Tasks/i })).toBeVisible();

  await page.getByRole("button", { name: /open notifications/i }).click();
  await expect(
    page.getByRole("dialog", { name: /notifications/i }),
  ).toBeVisible();
  await expect(page.getByText(/saved search issue/i).first()).toBeVisible();
  await page.getByRole("button", { name: /dismiss notifications/i }).click();
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
    await page
      .getByRole("link", { name: /preview/i })
      .first()
      .click();
    await expect(
      page.getByRole("complementary", { name: /selected pursuit/i }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: /close opportunity preview/i })
      .click();
    await expect(
      page.getByRole("button", { name: /open command search/i }),
    ).toBeVisible();
  });
});

test.describe("tablet route sweep", () => {
  test.use({
    viewport: {
      width: 960,
      height: 1280,
    },
  });

  test("major authenticated routes stay readable without horizontal overflow", async ({
    page,
  }) => {
    await signIn(page, LOCAL_DEMO_SIGN_IN_EMAIL);

    const routeChecks = [
      { heading: /execution overview/i, route: "/" },
      { heading: /opportunity pipeline/i, route: "/opportunities" },
      { heading: /execution triage/i, route: "/tasks" },
      { heading: /knowledge library/i, route: "/knowledge" },
      { heading: /external source search/i, route: "/sources" },
      { heading: /decision console/i, route: "/analytics" },
      { heading: /workspace settings/i, route: "/settings" },
      { heading: /connector operations/i, route: "/settings/connectors" },
      { heading: /^saved searches$/i, route: "/settings/saved-searches" },
      { heading: /scoring profile/i, route: "/settings/scoring" },
      { heading: /audit activity/i, route: "/settings/audit" },
      { heading: /user administration/i, route: "/settings/users" },
    ];

    for (const routeCheck of routeChecks) {
      await page.goto(routeCheck.route);
      await expect(
        page.getByRole("heading", { name: routeCheck.heading }).first(),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /open command search/i }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
      ).toBe(true);
    }

    await page.goto("/opportunities");
    const routeResultsTable = page.getByRole("grid", {
      name: /opportunity pipeline results/i,
    });
    await expect(routeResultsTable).toBeVisible();
    await routeResultsTable
      .getByRole("link", { name: /preview/i })
      .first()
      .click();
    const selectedPreview = page.getByRole("complementary");
    await expect(selectedPreview).toBeVisible();
    await selectedPreview
      .getByRole("link", { name: /^Open workspace$/i })
      .click();
    await expect(
      page.getByRole("heading", { name: /^Summary$/i }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    ).toBe(true);
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
  await page.goto("/settings/users");
  await expect(page).toHaveURL(
    /\/forbidden\?permission=manage_workspace_settings$/,
  );
  for (const blockedRoute of [
    "/settings/connectors",
    "/settings/saved-searches",
    "/settings/scoring",
    "/settings/audit",
  ]) {
    await page.goto(blockedRoute);
    await expect(page).toHaveURL(
      /\/forbidden\?permission=manage_workspace_settings$/,
    );
  }
});
