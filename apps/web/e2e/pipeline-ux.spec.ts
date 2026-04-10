import { expect, test, type Page } from "@playwright/test";

async function gotoPipeline(page: Page) {
  await page.goto("/pipeline", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("button", { name: "Upload file" }).first(),
  ).toBeVisible();
}

async function showNeedsAttention(page: Page) {
  const filterChip = page
    .getByRole("button", { name: /Needs attention \(\d+\)/ })
    .first();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await filterChip.click();

    try {
      await page.waitForFunction(
        () => window.location.search.includes("status=failed"),
        undefined,
        { timeout: 5000 },
      );
      return;
    } catch (error) {
      if (attempt === 2) {
        throw error;
      }
    }
  }
}

test("/pipeline explains intake health and recent file progress clearly", async ({
  page,
}, testInfo) => {
  await gotoPipeline(page);

  await expect(
    page.getByRole("button", { name: "Show blocked files" }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Upload file" }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("What needs attention now", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Current view", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Recent file progress", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Intake paths" }),
  ).toBeVisible();
  await expect(
    page.getByText("Processing rules", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("In intake", { exact: true }).first()).toBeVisible();
  await expect(
    page.getByText("Ready for review", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Pipeline owns intake and readiness.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("3 files need attention before they can move forward.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText("Next move", { exact: true }).first()).toBeVisible();

  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath("pipeline-operations.png"),
  });
});

test("/pipeline filters keep blocked files isolated without leaving the page use case", async ({
  page,
}, testInfo) => {
  await gotoPipeline(page);
  await showNeedsAttention(page);

  await expect(
    page.getByText(/Needs attention only\./i),
  ).toBeVisible();
  await expect(
    page.getByText("Start with the blocked files so they do not hide downstream insight."),
  ).toBeVisible();
  await expect(
    page.getByText(/need attention before they can move forward/i).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Show all files" }).first(),
  ).toBeVisible();

  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath("pipeline-filtered-attention.png"),
  });
});

test("/pipeline keeps upload entry obvious on mobile", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoPipeline(page);

  await expect(
    page.getByRole("button", { name: "Show blocked files" }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Upload file" }).first(),
  ).toBeVisible();
  await expect(page.getByText("Current view", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Upload file" }).first().click();
  await expect(
    page.getByRole("dialog", { name: "Upload files" }),
  ).toBeVisible();

  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath("pipeline-mobile.png"),
  });
});
