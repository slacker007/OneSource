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

function formatDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
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
      name: /organization scoring profile/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("table", {
      name: /weighted scoring criteria/i,
    }),
  ).toBeVisible();
  await expect(page.getByText(/default_capture_v1/i)).toBeVisible();
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
});

test("users can create and edit tracked opportunities from the app", async ({
  page,
}) => {
  const opportunityTitle = `Zero Trust Integration Support Bridge ${Date.now()}`;
  const updatedOpportunityTitle = `${opportunityTitle} Updated`;

  await signIn(page, LOCAL_DEMO_SIGN_IN_EMAIL);

  await page.getByRole("link", { name: /^Opportunities/i }).click();
  await expect(page).toHaveURL(/\/opportunities$/);
  await page.getByRole("link", { name: /create tracked opportunity/i }).click();
  await expect(page).toHaveURL(/\/opportunities\/new$/);

  await page.getByLabel(/opportunity title/i).fill(opportunityTitle);
  await page
    .getByLabel(/description/i)
    .fill("Bridge pursuit covering zero trust engineering and transition support.");
  await page.getByLabel(/solicitation number/i).fill("ZT-2026-001");
  await page.getByLabel(/NAICS code/i).fill("541512");
  await page.getByLabel(/response deadline/i).fill("2026-06-18");
  await expect(page.getByText(/draft saved locally at/i)).toBeVisible();

  await page.reload();
  await expect(page.getByLabel(/opportunity title/i)).toHaveValue(opportunityTitle);
  await page.getByRole("button", { name: /^Create opportunity$/i }).click();

  await expect(page).toHaveURL(/\/opportunities\/.+\/edit\?created=1$/);
  await expect(
    page.getByText(
      /the new tracked opportunity is now persisted and ready for follow-on workspace work/i,
    ),
  ).toBeVisible();
  await expect(page.getByLabel(/opportunity title/i)).toHaveValue(opportunityTitle);

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
  await expect(page.getByRole("heading", { name: updatedOpportunityTitle })).toBeVisible();
});

test("users can open the opportunity workspace and review seeded sections", async ({
  page,
}) => {
  const createdTaskTitle = `Prepare capture brief ${Date.now()}`;
  const createdMilestoneTitle = `Executive checkpoint ${Date.now()}`;
  const createdNoteTitle = `Capture note ${Date.now()}`;
  const decisionRationale = `Leadership confirmed pursuit priority and staffing alignment ${Date.now()}.`;
  const createdMilestoneDate = new Date();
  createdMilestoneDate.setUTCDate(createdMilestoneDate.getUTCDate() + 7);

  await signIn(page, LOCAL_DEMO_SIGN_IN_EMAIL);
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/opportunities");
  await expect(page).toHaveURL(/\/opportunities$/);
  await page.locator("#opportunity-query").fill("Enterprise Knowledge Management");
  await page.getByRole("button", { name: /apply filters/i }).click();

  await expect(page).toHaveURL(/q=Enterprise\+Knowledge\+Management/);
  await expect(
    page.getByText(/enterprise knowledge management support services/i).first(),
  ).toBeVisible();

  await page.getByRole("link", { name: /open workspace/i }).click();

  await expect(page).toHaveURL(/\/opportunities\/.+$/);
  await expect(
    page.getByRole("heading", {
      name: /enterprise knowledge management support services/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /^Overview$/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /^Scoring$/i }),
  ).toBeVisible();
  await expect(page.getByText(/weight/i).first()).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /^Decision history$/i }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /^Tasks$/i })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /^Documents$/i }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /^Notes$/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /^History$/i })).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /^complete incumbent analysis brief$/i,
    }),
  ).toBeVisible();
  await expect(page.getByText(/^overdue$/i).first()).toBeVisible();
  await expect(page.getByText(/upcoming deadline/i).first()).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /^Performance Work Statement$/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /^Capture Summary$/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /^Bid decision recorded as GO$/i }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /^Stage transition$/i }),
  ).toBeVisible();
  await page.locator("#decision-create-type").selectOption("executive_review");
  await page.locator("#decision-create-outcome").selectOption("GO");
  await page.locator("#decision-create-rationale").fill(decisionRationale);
  await page.getByRole("button", { name: /^record decision$/i }).click();
  await expect(
    page.getByText(/bid decision recorded and added to workspace history/i),
  ).toBeVisible();
  await expect(
    page
      .getByText(
        new RegExp(
          decisionRationale.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "i",
        ),
      )
      .first(),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /^Executive Review$/i }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /^Bid decision recorded as GO$/i,
    }).first(),
  ).toBeVisible();
  await page.locator("#task-create-title").fill(createdTaskTitle);
  const assigneeOptionLabel = (
    await page.locator("#task-create-assignee option").allTextContents()
  ).find((label) => /alex morgan|admin@onesource\.local/i.test(label));
  if (!assigneeOptionLabel) {
    throw new Error("Could not find the signed-in user in the task assignee list.");
  }
  await page.locator("#task-create-assignee").selectOption({
    label: assigneeOptionLabel,
  });
  await page.locator("#task-create-due-at").fill("2026-05-10");
  await page.locator("#task-create-status").selectOption("IN_PROGRESS");
  await page.locator("#task-create-priority").selectOption("HIGH");
  await page
    .locator("#task-create-description")
    .fill("Prepare the concise executive-ready capture brief.");
  await page.getByRole("button", { name: /^create task$/i }).click();
  await expect(
    page.getByText(/task created and added to the workspace/i),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: createdTaskTitle, exact: true }),
  ).toBeVisible();
  await page.locator("#milestone-create-title").fill(createdMilestoneTitle);
  await page
    .locator("#milestone-create-target-date")
    .fill(formatDateInputValue(createdMilestoneDate));
  await page.locator("#milestone-create-type").selectOption("decision_checkpoint");
  await page.locator("#milestone-create-status").selectOption("AT_RISK");
  await page
    .locator("#milestone-create-description")
    .fill("Confirm the executive review packet and pursuit posture.");
  await page.getByRole("button", { name: /^create milestone$/i }).click();
  await expect(
    page.getByText(/milestone created and added to the workspace/i),
  ).toBeVisible();
  await expect(
    page
      .getByRole("heading", { name: createdMilestoneTitle, exact: true })
      .first(),
  ).toBeVisible();
  await page.locator("#note-create-title").fill(createdNoteTitle);
  await page.locator("#note-create-pinned").selectOption("true");
  await page
    .locator("#note-create-body")
    .fill("Customer signals remain positive and the capture plan should stay pinned for the team.");
  await page.getByRole("button", { name: /^add note$/i }).click();
  await expect(
    page.getByText(/note saved to the workspace history/i),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: createdNoteTitle, exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: new RegExp(`^Note added: ${createdNoteTitle}$`, "i") }),
  ).toBeVisible();

  await page.getByRole("link", { name: /^Tasks/i }).click();
  await expect(page).toHaveURL(/\/tasks$/);
  await expect(
    page.getByRole("heading", { name: /personal execution queue/i }),
  ).toBeVisible();
  await expect(page.getByText(createdTaskTitle)).toBeVisible();
  await expect(
    page.getByText(/enterprise knowledge management support services/i).first(),
  ).toBeVisible();
  await expect(page.getByText(/^overdue$/i).first()).toBeVisible();
  await page.getByRole("link", { name: /^Dashboard/i }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", { name: /upcoming deadlines/i }),
  ).toBeVisible();
  await expect(page.getByText(createdMilestoneTitle)).toBeVisible();

  await page.goto("/opportunities");
  await expect(page).toHaveURL(/\/opportunities$/);
  await page.locator("#opportunity-query").fill("Enterprise Knowledge Management");
  await page.getByRole("button", { name: /apply filters/i }).click();
  await page.getByRole("link", { name: /open workspace/i }).click();

  const targetStageSelect = page.locator("#stage-transition-target");
  const targetStageValue = await targetStageSelect
    .locator("option")
    .first()
    .getAttribute("value");
  const targetStageLabel = await targetStageSelect
    .locator("option")
    .first()
    .textContent();
  if (!targetStageValue || !targetStageLabel) {
    throw new Error("No stage-transition target option was available in the workspace.");
  }
  const escapedTargetStageLabel = targetStageLabel.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
  await targetStageSelect.selectOption(targetStageValue);
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
      new RegExp(`stage updated to ${escapedTargetStageLabel}`, "i"),
    ),
  ).toBeVisible();
  await expect(
    page
      .getByRole("heading", {
        name: new RegExp(`^Moved to ${escapedTargetStageLabel}$`, "i"),
      })
      .first(),
  ).toBeVisible();
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
