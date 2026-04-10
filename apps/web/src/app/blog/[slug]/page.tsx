import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { blogRepository } from "@/features/blog/server/blog-repository";
import {
  DynamicBlogPostPage,
  type DynamicBlogPost,
} from "@/features/marketing/components/marketing-pages";

export const dynamic = "force-dynamic";

type Props = Readonly<{ params: Promise<{ slug: string }> }>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await blogRepository.getBySlug(slug);
  if (!post || post.status !== "published") return {};
  return {
    title: post.title,
    description: post.summary,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await blogRepository.getBySlug(slug);

  if (!post || post.status !== "published") {
    notFound();
  }

  const dynPost: DynamicBlogPost = {
    id: post.id,
    slug: post.slug,
    title: post.title,
    summary: post.summary,
    body: post.body,
    author: post.author,
    publishedAt: post.publishedAt,
  };

  return <DynamicBlogPostPage post={dynPost} />;
}
