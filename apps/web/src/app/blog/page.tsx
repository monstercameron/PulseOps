import type { BlogPost } from "@/features/blog/domain/blog-post";
import { DynamicBlogPage } from "@/features/marketing/components/marketing-pages";

export const dynamic = "force-dynamic";

async function fetchPublishedPosts(): Promise<BlogPost[]> {
  const port = process.env.PORT ?? "3000";
  const res = await fetch(`http://localhost:${port}/api/blog`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as { posts: BlogPost[] };
  return data.posts.filter((p) => p.status === "published");
}

export default async function Blog() {
  const posts = await fetchPublishedPosts();
  return <DynamicBlogPage posts={posts} />;
}
