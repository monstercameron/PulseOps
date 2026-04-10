export type BlogPostStatus = "draft" | "published";

export type BlogPost = Readonly<{
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  author: string;
  status: BlogPostStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}>;

export type CreateBlogPostInput = Readonly<{
  slug: string;
  title: string;
  summary: string;
  body: string;
  author: string;
  status: BlogPostStatus;
}>;

export type UpdateBlogPostInput = Partial<CreateBlogPostInput>;
