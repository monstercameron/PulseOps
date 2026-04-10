import { randomUUID } from "node:crypto";
import type { BlogPost, CreateBlogPostInput, UpdateBlogPostInput } from "@/features/blog/domain/blog-post";
import { BLOG_SEED_POSTS } from "@/features/blog/server/blog-seed-data";

// Module-level store — resets on server restart, fine for prototype.
const store = new Map<string, BlogPost>(BLOG_SEED_POSTS.map((p) => [p.id, p]));
export const blogRepository = {
  list(): readonly BlogPost[] {
    return Array.from(store.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  getById(id: string): BlogPost | null {
    return store.get(id) ?? null;
  },

  getBySlug(slug: string): BlogPost | null {
    for (const post of store.values()) {
      if (post.slug === slug) return post;
    }
    return null;
  },

  create(input: CreateBlogPostInput): BlogPost {
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
    store.set(post.id, post);
    return post;
  },

  update(id: string, input: UpdateBlogPostInput): BlogPost | null {
    const existing = store.get(id);
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
    store.set(id, next);
    return next;
  },

  delete(id: string): boolean {
    return store.delete(id);
  },
};