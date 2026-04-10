import { expect, test, type Page } from "@playwright/test";

async function gotoPacks(page: Page) {
  await page.goto("/packs", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("button", { name: /Generate latest preview/i }).first(),
  ).toBeVisible();
}

test("/packs explains grouped business analysis clearly", async ({
  page,
}, testInfo) => {
  await gotoPacks(page);

  await expect(
    page.getByText("Pick the business concept to review", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Cash and Margin Brief" }),
  ).toBeVisible();
  await expect(
    page.getByText("What this pack groups together", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Preview health", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Business signals", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Evidence behind this preview", { exact: true }),
  ).toBeVisible();

  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath("packs-ux-overview.png"),
  });
});

test("/packs lets operators switch between business concepts", async ({
  page,
}, testInfo) => {
  await gotoPacks(page);

  await page
    .getByRole("button", { name: /Capacity and Utilization/i })
    .click();
  await expect(
    page.getByRole("heading", { name: "Capacity and Utilization" }),
  ).toBeVisible();
  await expect(
    page.getByText(/crew load, schedule pressure, and staffing risk/i),
  ).toBeVisible();

  await page.getByRole("button", { name: "Draft" }).click();
  await expect(
    page.getByRole("heading", { name: "Parts and Supplier" }),
  ).toBeVisible();
  await expect(
    page.getByText(/vendor concentration, parts pricing, and procurement leverage/i),
  ).toBeVisible();

  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath("packs-ux-concepts.png"),
  });
});

test("/packs stacks cleanly on mobile without horizontal clipping", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoPacks(page);

  await expect(
    page.getByText("Pick the business concept to review", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Cash and Margin Brief/i }),
  ).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(hasHorizontalOverflow).toBe(false);

  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath("packs-ux-mobile.png"),
  });
});
