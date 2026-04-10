import { expect, test } from "@playwright/test";

// The /content route is inside the (app) layout but renders without hard redirect
// when unauthenticated — AppShell still renders, currentUser is null.
// These tests verify the blog admin UI functionality end to end.

const BASE_SLUG_PREFIX = "ui-e2e";

function uniqueSlug(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
}

// ─── Page loads ──────────────────────────────────────────────────────────────

test("GET /content renders blog admin page title", async ({ page }) => {
  await page.goto("/content");
  await expect(page.getByRole("heading", { name: "Blog posts" })).toBeVisible();
});

test("/content shows the posts table with seed data", async ({ page }) => {
  await page.goto("/content");

  // Wait for data to load (async fetch inside client component)
  await expect(
    page.getByText("The 5 Cash Flow Mistakes Field Service Businesses Make Every Week"),
  ).toBeVisible({ timeout: 10_000 });
});

test("/content table shows column headers", async ({ page }) => {
  await page.goto("/content");
  await expect(page.getByRole("columnheader", { name: "Title" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Author" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Status" })).toBeVisible();
});

// ─── New post modal ───────────────────────────────────────────────────────────

test("clicking 'New post' opens the create modal", async ({ page }) => {
  await page.goto("/content");
  await page.getByRole("button", { name: "New post" }).first().click();
  await expect(page.getByRole("heading", { name: "New post" })).toBeVisible();
});

test("create modal auto-generates slug from title", async ({ page }) => {
  await page.goto("/content");
  await page.getByRole("button", { name: "New post" }).first().click();

  await page.getByLabel("Title").fill("Hello World Test Post");
  await expect(page.getByLabel("Slug")).toHaveValue("hello-world-test-post", {
    timeout: 3000,
  });
});

test("cancel button closes the create modal", async ({ page }) => {
  await page.goto("/content");
  await page.getByRole("button", { name: "New post" }).first().click();
  await expect(page.getByRole("heading", { name: "New post" })).toBeVisible();

  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("heading", { name: "New post" })).not.toBeVisible();
});

// ─── Create a post ───────────────────────────────────────────────────────────

test("creating a new post adds it to the table", async ({ page, request }) => {
  const slug = uniqueSlug(BASE_SLUG_PREFIX);
  const title = `UI Create Test ${slug}`;

  await page.goto("/content");
  await page.getByRole("button", { name: "New post" }).first().click();

  await page.getByLabel("Title").fill(title);
  // Slug is auto-filled; override to our unique slug
  await page.getByLabel("Slug").fill(slug);
  await page.getByLabel("Summary").fill("A summary for the UI test post.");
  await page.getByLabel("Body").fill("Body content for the UI test post.");

  await page.getByRole("button", { name: "Create post" }).click();

  // Modal closes, table updates
  await expect(page.getByRole("heading", { name: "New post" })).not.toBeVisible();
  await expect(page.getByText(title)).toBeVisible({ timeout: 10_000 });

  // Cleanup via API
  const listRes = await request.get("/api/blog");
  const { posts } = (await listRes.json()) as {
    posts: Array<{ id: string; slug: string }>;
  };
  const created = posts.find((p) => p.slug === slug);
  if (created) await request.delete(`/api/blog/${created.id}`);
});

// ─── Edit a post ─────────────────────────────────────────────────────────────

test("editing a post updates its title in the table", async ({ page, request }) => {
  const slug = uniqueSlug(`${BASE_SLUG_PREFIX}-edit`);
  const originalTitle = `UI Edit Original ${slug}`;
  const updatedTitle = `UI Edit Updated ${slug}`;

  // Seed the post via API
  const createRes = await request.post("/api/blog", {
    data: {
      title: originalTitle,
      slug,
      summary: "Summary",
      body: "Body",
      author: "E2E",
      status: "draft",
    },
  });
  const { post } = (await createRes.json()) as { post: { id: string } };

  await page.goto("/content");
  await expect(page.getByText(originalTitle)).toBeVisible({ timeout: 10_000 });

  // Find the row for our post and click Edit
  const row = page.getByRole("row").filter({ hasText: originalTitle });
  await row.getByRole("button", { name: "Edit" }).click();

  // Modal should be pre-filled
  await expect(page.getByRole("heading", { name: "Edit post" })).toBeVisible();

  // Update title
  await page.getByLabel("Title").fill(updatedTitle);
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page.getByRole("heading", { name: "Edit post" })).not.toBeVisible();
  await expect(page.getByText(updatedTitle)).toBeVisible({ timeout: 10_000 });

  // Cleanup
  await request.delete(`/api/blog/${post.id}`);
});

// ─── Status toggle ────────────────────────────────────────────────────────────

test("clicking a status badge toggles published to draft", async ({ page, request }) => {
  const slug = uniqueSlug(`${BASE_SLUG_PREFIX}-toggle`);

  const createRes = await request.post("/api/blog", {
    data: {
      title: `UI Toggle Test ${slug}`,
      slug,
      summary: "Summary",
      body: "Body",
      author: "E2E",
      status: "published",
    },
  });
  const { post } = (await createRes.json()) as { post: { id: string } };

  await page.goto("/content");
  const row = page.getByRole("row").filter({ hasText: `UI Toggle Test ${slug}` });
  await expect(row).toBeVisible({ timeout: 10_000 });

  // Status badge button should show "Published"
  const statusBtn = row.getByTitle("Click to toggle status");
  await expect(statusBtn).toContainText("Published");

  await statusBtn.click();

  // Should now show "Draft" in that row after re-fetch
  await expect(statusBtn).toContainText("Draft", { timeout: 10_000 });

  // Cleanup
  await request.delete(`/api/blog/${post.id}`);
});

// ─── Delete a post ────────────────────────────────────────────────────────────

test("deleting a post removes it from the table", async ({ page, request }) => {
  const slug = uniqueSlug(`${BASE_SLUG_PREFIX}-delete`);
  const titleText = `UI Delete Test ${slug}`;

  const createRes = await request.post("/api/blog", {
    data: {
      title: titleText,
      slug,
      summary: "Summary",
      body: "Body",
      author: "E2E",
      status: "draft",
    },
  });
  const { post } = (await createRes.json()) as { post: { id: string } };

  await page.goto("/content");
  await expect(page.getByText(titleText)).toBeVisible({ timeout: 10_000 });

  const row = page.getByRole("row").filter({ hasText: titleText });
  await row.getByRole("button", { name: "Delete" }).click();

  // Delete confirmation dialog should appear
  await expect(page.getByRole("button", { name: /confirm|delete/i }).last()).toBeVisible({
    timeout: 3000,
  });
  await page.getByRole("button", { name: /confirm|delete/i }).last().click();

  // Row should be gone from table
  await expect(page.getByText(titleText)).not.toBeVisible({ timeout: 10_000 });

  // Cleanup guard — delete via API if still exists
  await request.delete(`/api/blog/${post.id}`);
});
