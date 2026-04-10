import { expect, test, type APIRequestContext } from "@playwright/test";

// ─── helpers ────────────────────────────────────────────────────────────────

function uniqueSlug(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
}

async function createPost(
  request: APIRequestContext,
  overrides: Partial<{
    title: string;
    slug: string;
    summary: string;
    body: string;
    author: string;
    status: string;
  }> = {},
) {
  const slug = overrides.slug ?? uniqueSlug("e2e-post");
  const res = await request.post("/api/blog", {
    data: {
      title: "E2E Test Post",
      slug,
      summary: "Test summary",
      body: "Test body content",
      author: "Test Author",
      status: "draft",
      ...overrides,
    },
  });
  expect(res.status()).toBe(201);
  const json = (await res.json()) as { post: { id: string; slug: string } };
  return json.post;
}

async function deletePost(request: APIRequestContext, id: string) {
  await request.delete(`/api/blog/${id}`);
}

// ─── GET /api/blog ───────────────────────────────────────────────────────────

test("GET /api/blog returns posts array with seed data", async ({ request }) => {
  const res = await request.get("/api/blog");
  expect(res.status()).toBe(200);

  const json = (await res.json()) as { posts: unknown[] };
  expect(Array.isArray(json.posts)).toBe(true);
  expect(json.posts.length).toBeGreaterThanOrEqual(3);
});

test("GET /api/blog returns expected seed post fields", async ({ request }) => {
  const res = await request.get("/api/blog");
  const json = (await res.json()) as {
    posts: Array<{
      id: string;
      slug: string;
      title: string;
      status: string;
      author: string;
    }>;
  };

  const first = json.posts[0];
  expect(typeof first.id).toBe("string");
  expect(typeof first.slug).toBe("string");
  expect(typeof first.title).toBe("string");
  expect(typeof first.status).toBe("string");
  expect(typeof first.author).toBe("string");
});

test("GET /api/blog includes the cash-flow seed post", async ({ request }) => {
  const res = await request.get("/api/blog");
  const json = (await res.json()) as { posts: Array<{ slug: string }> };

  const slugs = json.posts.map((p) => p.slug);
  expect(slugs).toContain("cash-flow-mistakes-field-service");
});

// ─── POST /api/blog ──────────────────────────────────────────────────────────

test("POST /api/blog creates a new draft post", async ({ request }) => {
  const slug = uniqueSlug("create-draft");
  const res = await request.post("/api/blog", {
    data: {
      title: "Create Draft Test",
      slug,
      summary: "Summary text",
      body: "Body text",
      author: "E2E Author",
    },
  });

  expect(res.status()).toBe(201);
  const json = (await res.json()) as {
    post: { id: string; slug: string; status: string };
  };
  expect(json.post.slug).toBe(slug);
  expect(json.post.status).toBe("draft");
  expect(typeof json.post.id).toBe("string");

  await deletePost(request, json.post.id);
});

test("POST /api/blog creates a published post with publishedAt set", async ({ request }) => {
  const slug = uniqueSlug("create-published");
  const res = await request.post("/api/blog", {
    data: {
      title: "Create Published Test",
      slug,
      summary: "Summary",
      body: "Body",
      author: "E2E Author",
      status: "published",
    },
  });

  expect(res.status()).toBe(201);
  const json = (await res.json()) as {
    post: { id: string; status: string; publishedAt: string | null };
  };
  expect(json.post.status).toBe("published");
  expect(json.post.publishedAt).not.toBeNull();

  await deletePost(request, json.post.id);
});

test("POST /api/blog returns 400 when required fields are missing", async ({ request }) => {
  const res = await request.post("/api/blog", {
    data: { title: "Missing fields" },
  });
  expect(res.status()).toBe(400);
  const json = (await res.json()) as { error: string };
  expect(typeof json.error).toBe("string");
});

test("POST /api/blog returns 409 on duplicate slug", async ({ request }) => {
  const slug = uniqueSlug("dup-slug");
  const post = await createPost(request, { slug });

  const res = await request.post("/api/blog", {
    data: {
      title: "Duplicate Slug",
      slug,
      summary: "s",
      body: "b",
      author: "a",
    },
  });
  expect(res.status()).toBe(409);

  await deletePost(request, post.id);
});

test("POST /api/blog returns 400 for invalid JSON", async ({ request }) => {
  const res = await request.post("/api/blog", {
    headers: { "content-type": "application/json" },
    data: "not-valid-json",
  });
  expect(res.status()).toBe(400);
});

// ─── GET /api/blog/[id] ──────────────────────────────────────────────────────

test("GET /api/blog/:id returns a specific post", async ({ request }) => {
  const post = await createPost(request);

  const res = await request.get(`/api/blog/${post.id}`);
  expect(res.status()).toBe(200);
  const json = (await res.json()) as { post: { id: string; slug: string } };
  expect(json.post.id).toBe(post.id);
  expect(json.post.slug).toBe(post.slug);

  await deletePost(request, post.id);
});

test("GET /api/blog/:id returns 404 for unknown id", async ({ request }) => {
  const res = await request.get("/api/blog/does-not-exist-xyz");
  expect(res.status()).toBe(404);
});

// ─── PATCH /api/blog/[id] ────────────────────────────────────────────────────

test("PATCH /api/blog/:id updates post title", async ({ request }) => {
  const post = await createPost(request);

  const res = await request.patch(`/api/blog/${post.id}`, {
    data: { title: "Updated Title" },
  });
  expect(res.status()).toBe(200);
  const json = (await res.json()) as { post: { title: string } };
  expect(json.post.title).toBe("Updated Title");

  await deletePost(request, post.id);
});

test("PATCH /api/blog/:id can publish a draft post", async ({ request }) => {
  const post = await createPost(request, { status: "draft" });

  const res = await request.patch(`/api/blog/${post.id}`, {
    data: { status: "published" },
  });
  expect(res.status()).toBe(200);
  const json = (await res.json()) as {
    post: { status: string; publishedAt: string | null };
  };
  expect(json.post.status).toBe("published");
  expect(json.post.publishedAt).not.toBeNull();

  await deletePost(request, post.id);
});

test("PATCH /api/blog/:id returns 404 for unknown id", async ({ request }) => {
  const res = await request.patch("/api/blog/no-such-id", {
    data: { title: "X" },
  });
  expect(res.status()).toBe(404);
});

// ─── DELETE /api/blog/[id] ───────────────────────────────────────────────────

test("DELETE /api/blog/:id removes the post", async ({ request }) => {
  const post = await createPost(request);

  const del = await request.delete(`/api/blog/${post.id}`);
  expect(del.status()).toBe(204);

  const get = await request.get(`/api/blog/${post.id}`);
  expect(get.status()).toBe(404);
});

test("DELETE /api/blog/:id returns 404 for unknown id", async ({ request }) => {
  const res = await request.delete("/api/blog/ghost-id-xyz");
  expect(res.status()).toBe(404);
});
