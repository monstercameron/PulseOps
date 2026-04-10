import { expect, test } from "@playwright/test";

// The public blog at /blog is a React Server Component using the in-memory
// blog repository directly. Seed posts include two published and one draft.

const SEED_SLUGS = ["cash-flow-mistakes-field-service", "job-costing-hvac"];

// Ensure seed posts are always published before each test, since the empty
// state test patches them to draft and parallel runs can leave them in that state.
test.beforeEach(async ({ request }) => {
  const listRes = await request.get("/api/blog");
  const { posts } = (await listRes.json()) as {
    posts: Array<{ id: string; slug: string; status: string }>;
  };
  for (const post of posts) {
    if (SEED_SLUGS.includes(post.slug) && post.status !== "published") {
      await request.patch(`/api/blog/${post.id}`, { data: { status: "published" } });
    }
  }
});

test("GET /blog renders the page heading", async ({ page }) => {
  await page.goto("/blog");
  await expect(page.getByRole("heading", { name: /insights for field-service operators/i })).toBeVisible();
});

test("/blog shows the 'Blog' section label", async ({ page }) => {
  await page.goto("/blog");
  await expect(page.getByText("Blog").first()).toBeVisible();
});

test("/blog displays the featured section", async ({ page }) => {
  await page.goto("/blog");
  await expect(page.getByText("Featured").first()).toBeVisible();
});

test("/blog shows published seed post titles", async ({ page }) => {
  await page.goto("/blog");

  await expect(
    page.getByText("The 5 Cash Flow Mistakes Field Service Businesses Make Every Week"),
  ).toBeVisible();

  await expect(
    page.getByText("Why HVAC Businesses Lose Margin on Their Best-Selling Service"),
  ).toBeVisible();
});

test("/blog does NOT show draft posts", async ({ page }) => {
  // The third seed post ("AI for Small Business") has status "draft"
  await page.goto("/blog");
  await expect(
    page.getByText("AI for Small Business"),
  ).not.toBeVisible();
});

test("/blog shows author attribution for featured post", async ({ page }) => {
  await page.goto("/blog");

  // Both seed published posts are by "PulseOps Team"
  const authorEls = await page.getByText("PulseOps Team").all();
  expect(authorEls.length).toBeGreaterThanOrEqual(1);
});

test("/blog empty state renders when all posts are drafts", async ({ page, request }) => {
  // Revert both published seed posts to draft
  const listRes = await request.get("/api/blog");
  const { posts } = (await listRes.json()) as {
    posts: Array<{ id: string; status: string }>;
  };

  const published = posts.filter((p) => p.status === "published");
  for (const post of published) {
    await request.patch(`/api/blog/${post.id}`, {
      data: { status: "draft" },
    });
  }

  await page.goto("/blog");
  await expect(
    page.getByText(/no posts published yet/i),
  ).toBeVisible({ timeout: 10_000 });

  // Restore
  for (const post of published) {
    await request.patch(`/api/blog/${post.id}`, {
      data: { status: "published" },
    });
  }
});

test("/blog published post from API appears on public page", async ({ page, request }) => {
  // Create a published post via API
  const slug = `pub-blog-e2e-${Date.now()}`;
  const title = `Public Blog E2E Post ${slug}`;
  const createRes = await request.post("/api/blog", {
    data: {
      title,
      slug,
      summary: "E2E test summary",
      body: "E2E body text",
      author: "E2E Author",
      status: "published",
    },
  });
  expect(createRes.status()).toBe(201);
  const { post } = (await createRes.json()) as { post: { id: string } };

  // Public blog page should reflect the new post (force-dynamic)
  await page.goto("/blog");
  await expect(page.getByText(title)).toBeVisible({ timeout: 10_000 });

  // Cleanup
  await request.delete(`/api/blog/${post.id}`);
});

test("/blog draft post from API does NOT appear on public page", async ({ page, request }) => {
  const slug = `draft-blog-e2e-${Date.now()}`;
  const title = `Draft Blog E2E Post ${slug}`;
  const createRes = await request.post("/api/blog", {
    data: {
      title,
      slug,
      summary: "Draft summary",
      body: "Draft body",
      author: "E2E Author",
      status: "draft",
    },
  });
  const { post } = (await createRes.json()) as { post: { id: string } };

  await page.goto("/blog");
  await expect(page.getByText(title)).not.toBeVisible();

  // Cleanup
  await request.delete(`/api/blog/${post.id}`);
});
