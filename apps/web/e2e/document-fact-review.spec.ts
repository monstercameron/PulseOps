import { expect, test } from "@playwright/test";

test("/explorer shows readable findings and fact evidence for a seeded document", async ({
  page,
}) => {
  await page.goto("/explorer");
  await page.getByPlaceholder("Search records...").fill("10020Records.csv");
  await page.getByRole("button", { name: /10020Records\.csv/i }).click();

  await expect(
    page.getByRole("heading", { name: "10020Records.csv" }),
  ).toBeVisible();
  await expect(page.getByText("Ready to review")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Key findings/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Extracted facts/i }),
  ).toBeVisible();
  await expect(page.getByText("Total profit").first()).toBeVisible();
  await expect(page.getByText("$44,168,198.40").first()).toBeVisible();
  await expect(page.getByText("Evidence").first()).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Citations/i }),
  ).toBeVisible();
});

test("/explorer fact review surfaces business labels instead of canonical fact ids", async ({
  page,
}) => {
  await page.goto("/explorer");
  await page.getByPlaceholder("Search records...").fill("supermarket_sales");
  await page
    .getByRole("button", { name: /supermarket_sales - Sheet1\.csv/i })
    .click();

  await expect(
    page.getByRole("heading", { name: "supermarket_sales - Sheet1.csv" }),
  ).toBeVisible();
  await expect(page.getByText("Ready to review")).toBeVisible();
  await expect(page.getByText("Gross income").first()).toBeVisible();
  await expect(page.getByText("Source excerpt").first()).toBeVisible();
  await expect(page.getByText("document.observation.number")).not.toBeVisible();
});
