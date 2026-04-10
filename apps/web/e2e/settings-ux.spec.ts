import { expect, test, type Page } from "@playwright/test";

async function gotoSettings(page: Page) {
  await page.goto("/settings?orgId=org_123", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("button", { name: "My account" }),
  ).toBeVisible();
}

test("/settings surfaces account locale and operational controls clearly", async ({
  page,
}, testInfo) => {
  await gotoSettings(page);

  await expect(page.getByText("Language and locale", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Sources & operations" }).click();
  await expect(page.getByText("Data policy", { exact: true })).toBeVisible();
  await expect(page.getByText("Delivery rules", { exact: true })).toBeVisible();
  await expect(page.getByText("Import rules", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("group", { name: "Manual upload retention (days)" }),
  ).toBeVisible();
  await expect(
    page.getByText("Weekly brief email", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("group", { name: "Target family" }).first(),
  ).toBeVisible();

  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath("settings-operational-config.png"),
  });
});

test("/settings keeps the new operational sections readable on mobile", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoSettings(page);

  await page.getByRole("button", { name: "Sources & operations" }).click();
  await expect(page.getByText("Data policy", { exact: true })).toBeVisible();
  await expect(page.getByText("Delivery rules", { exact: true })).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(hasHorizontalOverflow).toBe(false);

  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath("settings-operational-config-mobile.png"),
  });
});
