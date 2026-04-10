import path from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import type { BlogPost, CreateBlogPostInput, UpdateBlogPostInput } from "@/features/blog/domain/blog-post";
import { createLocalJsonCollection } from "@/features/persistence/lib/local-json-collection";
import { BLOG_SEED_POSTS } from "@/features/blog/server/blog-seed-data";

const blogPostSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  body: z.string(),
  author: z.string(),
  status: z.enum(["draft", "published"]),
  publishedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const collection = createLocalJsonCollection<BlogPost>({
  filePath: path.resolve(process.cwd(), "data", "blog-posts.json"),
  recordSchema: blogPostSchema,
});

// Seed the JSON file on first use (only if it is empty).
let seeded = false;
async function ensureSeeded() {
  if (seeded) return;
  seeded = true;
  const existing = await collection.list();
  if (existing.length === 0) {
    for (const post of BLOG_SEED_POSTS) {
      await collection.put(post);
    }
  }
}

export const blogRepository = {
  async list(): Promise<readonly BlogPost[]> {
    await ensureSeeded();
    const posts = await collection.list();
    return posts.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  async getById(id: string): Promise<BlogPost | null> {
    await ensureSeeded();
    return collection.getById(id);
  },

  async getBySlug(slug: string): Promise<BlogPost | null> {
    await ensureSeeded();
    const posts = await collection.list();
    return posts.find((p) => p.slug === slug) ?? null;
  },

  async create(input: CreateBlogPostInput): Promise<BlogPost> {
    await ensureSeeded();
    const now = new Date().toISOString();
    const post: BlogPost = {
      id: randomUUID(),
      slug: input.slug,
      title: input.title,
      summary: input.summary,
      body: input.body,
      author: input.author,
      status: input.status,
      publishedAt: input.status === "published" ? now : null,
      createdAt: now,
      updatedAt: now,
    };
    return collection.put(post);
  },

  async update(id: string, input: UpdateBlogPostInput): Promise<BlogPost | null> {
    await ensureSeeded();
    const existing = await collection.getById(id);
    if (!existing) return null;
    const now = new Date().toISOString();
    const next: BlogPost = {
      ...existing,
      ...input,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: now,
      publishedAt:
        input.status === "published" && existing.status !== "published"
          ? now
          : input.status === "draft"
            ? null
            : existing.publishedAt,
    };
    return collection.put(next);
  },

  async delete(id: string): Promise<boolean> {
    await ensureSeeded();
    const existing = await collection.getById(id);
    if (!existing) return false;
    await collection.deleteById(id);
    return true;
  },
};
