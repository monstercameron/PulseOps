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
  await expect(page.getByText("Ready to review").first()).toBeVisible();
  await expect(page.getByText("Recommended review order")).toBeVisible();
  await expect(page.getByText("Jump to")).toBeVisible();
  await expect(page.getByText("Review health")).toBeVisible();
  await expect(
    page.getByText("Every visible fact includes source evidence.").first(),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Key findings/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Extracted facts/i }),
  ).toBeVisible();
  await expect(page.getByText("Total profit").first()).toBeVisible();
  await expect(page.getByText("$44,168,198.40").first()).toBeVisible();
  await expect(page.getByText("Evidence").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: /Citations/i })).toBeVisible();
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
  await expect(page.getByText("Ready to review").first()).toBeVisible();
  await expect(page.getByText(/^Start with /).first()).toBeVisible();
  await expect(page.getByText("Gross income").first()).toBeVisible();
  await expect(page.getByText("Source excerpt").first()).toBeVisible();
  await expect(page.getByText("document.observation.number")).not.toBeVisible();
});

test("/explorer empty search state makes recovery obvious", async ({
  page,
}) => {
  await page.goto("/explorer");
  await page
    .getByPlaceholder("Search records...")
    .fill("no-match-playwright-query");

  await expect(
    page.getByRole("heading", { name: "No records match the current search" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Clear search" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Clear search" }).click();

  await expect(
    page.getByRole("button", { name: /10020Records\.csv/i }),
  ).toBeVisible();
});

test("/explorer lazy loads more files on scroll without pagination controls", async ({
  page,
}) => {
  await page.goto("/explorer");

  const recordsScrollRegion = page.getByTestId(
    "explorer-records-scroll-region",
  );
  const recordEntries = page.getByTestId("explorer-record-list-entry");
  const initialCount = await recordEntries.count();

  expect(initialCount).toBeGreaterThan(0);
  await expect(page.getByText(/^Page \d+ of \d+$/)).toHaveCount(0);
  await expect(page.getByText(/^Showing \d+-\d+ of \d+ records$/)).toHaveCount(0);

  await recordsScrollRegion.evaluate((node) => {
    node.scrollTop = node.scrollHeight;
  });

  await expect
    .poll(async () => recordEntries.count())
    .toBeGreaterThan(initialCount);
});

test("/explorer resets detail scroll when switching to another file", async ({
  page,
}) => {
  await page.goto("/explorer");
  await page.getByPlaceholder("Search records...").fill("10020Records.csv");
  await page.getByRole("button", { name: /10020Records\.csv/i }).click();

  await expect(
    page.getByRole("heading", { name: "10020Records.csv" }),
  ).toBeVisible();

  const detailScrollRegion = page.getByTestId("explorer-detail-scroll-region");
  const scrolledPosition = await detailScrollRegion.evaluate((node) => {
    node.scrollTop = node.scrollHeight;
    return node.scrollTop;
  });

  expect(scrolledPosition).toBeGreaterThan(0);

  await page.getByPlaceholder("Search records...").fill("supermarket_sales");
  await page
    .getByRole("button", { name: /supermarket_sales - Sheet1\.csv/i })
    .click();

  await expect(
    page.getByRole("heading", { name: "supermarket_sales - Sheet1.csv" }),
  ).toBeVisible();
  await expect
    .poll(async () => detailScrollRegion.evaluate((node) => node.scrollTop))
    .toBe(0);
});
