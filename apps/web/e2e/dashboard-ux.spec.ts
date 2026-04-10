import { expect, test } from "@playwright/test";

test("/dashboard operations view surfaces focus, scope, and real follow-up actions", async ({
  page,
}, testInfo) => {
  await page.goto("/dashboard");

  await expect(
    page.getByRole("button", { name: "Open weekly brief" }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Upload files" }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("What needs attention now", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Current scope", { exact: true })).toBeVisible();
  await expect(page.getByText("Top metrics", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Below on this page", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Open queue", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Operator queue" }),
  ).toBeVisible();
  await expect(page.getByText("Pipeline activity")).toBeVisible();
  await expect(page.getByText("View full activity log ->")).toHaveCount(0);

  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath("dashboard-operations.png"),
  });
});

test("/dashboard business view keeps signals paired with an operational watchlist", async ({
  page,
}, testInfo) => {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Business view" }).click();

  await expect(
    page.getByText("Weekly brief", { exact: true }).last(),
  ).toBeVisible();
  await expect(
    page.getByText("Business signals", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Operational watchlist", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByText(
        /Past-due invoices|Pipeline risk|Pack readiness|Fact coverage/i,
      )
      .first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open brief" }).first(),
  ).toBeVisible();

  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath("dashboard-business.png"),
  });
});

test("/dashboard remains readable on mobile", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");

  await expect(
    page.getByRole("button", { name: "Open weekly brief" }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Upload files" }).first(),
  ).toBeVisible();
  await expect(page.getByText("Current scope", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Operator queue" }),
  ).toBeVisible();

  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath("dashboard-mobile.png"),
  });
});
