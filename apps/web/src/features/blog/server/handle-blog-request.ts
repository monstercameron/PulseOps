import { blogRepository } from "@/features/blog/server/blog-repository";
import type { CreateBlogPostInput, UpdateBlogPostInput } from "@/features/blog/domain/blog-post";

export async function handleBlogListRequest(): Promise<Response> {
  const posts = blogRepository.list();
  return Response.json({ posts });
}

export async function handleBlogCreateRequest(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as Record<string, unknown>)["title"] !== "string" ||
    typeof (body as Record<string, unknown>)["slug"] !== "string" ||
    typeof (body as Record<string, unknown>)["summary"] !== "string" ||
    typeof (body as Record<string, unknown>)["body"] !== "string" ||
    typeof (body as Record<string, unknown>)["author"] !== "string"
  ) {
    return Response.json(
      { error: "Missing required fields: title, slug, summary, body, author." },
      { status: 400 },
    );
  }

  const input = body as Record<string, unknown>;
  const status = input["status"] === "published" ? "published" : "draft";

  const existing = blogRepository.getBySlug(input["slug"] as string);
  if (existing !== null) {
    return Response.json({ error: "A post with this slug already exists." }, { status: 409 });
  }

  const post = blogRepository.create({
    author: input["author"] as string,
    body: input["body"] as string,
    slug: input["slug"] as string,
    status,
    summary: input["summary"] as string,
    title: input["title"] as string,
  } satisfies CreateBlogPostInput);

  return Response.json({ post }, { status: 201 });
}

export async function handleBlogGetRequest(id: string): Promise<Response> {
  const post = blogRepository.getById(id);
  if (post === null) {
    return Response.json({ error: "Post not found." }, { status: 404 });
  }
  return Response.json({ post });
}

export async function handleBlogUpdateRequest(
  id: string,
  request: Request,
): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return Response.json({ error: "Body must be an object." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const update: UpdateBlogPostInput = {};

  if (typeof input["title"] === "string") update.title = input["title"];
  if (typeof input["slug"] === "string") update.slug = input["slug"];
  if (typeof input["summary"] === "string") update.summary = input["summary"];
  if (typeof input["body"] === "string") update.body = input["body"];
  if (typeof input["author"] === "string") update.author = input["author"];
  if (input["status"] === "published" || input["status"] === "draft") {
    update.status = input["status"];
  }

  const post = blogRepository.update(id, update);
  if (post === null) {
    return Response.json({ error: "Post not found." }, { status: 404 });
  }
  return Response.json({ post });
}

export async function handleBlogDeleteRequest(id: string): Promise<Response> {
  const deleted = blogRepository.delete(id);
  if (!deleted) {
    return Response.json({ error: "Post not found." }, { status: 404 });
  }
  return new Response(null, { status: 204 });
}
