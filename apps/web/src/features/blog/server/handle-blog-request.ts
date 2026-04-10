import { blogRepository } from "@/features/blog/server/blog-repository";
import type { CreateBlogPostInput, UpdateBlogPostInput } from "@/features/blog/domain/blog-post";

export async function handleBlogListRequest(): Promise<Response> {
  const posts = await blogRepository.list();
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

  const existing = await blogRepository.getBySlug(input["slug"] as string);
  if (existing !== null) {
    return Response.json({ error: "A post with this slug already exists." }, { status: 409 });
  }

  const post = await blogRepository.create({
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
  const post = await blogRepository.getById(id);
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
  const update: UpdateBlogPostInput = {
    ...(typeof input["title"] === "string" ? { title: input["title"] } : {}),
    ...(typeof input["slug"] === "string" ? { slug: input["slug"] } : {}),
    ...(typeof input["summary"] === "string" ? { summary: input["summary"] } : {}),
    ...(typeof input["body"] === "string" ? { body: input["body"] } : {}),
    ...(typeof input["author"] === "string" ? { author: input["author"] } : {}),
    ...(input["status"] === "published" || input["status"] === "draft"
      ? { status: input["status"] }
      : {}),
  };

  const post = await blogRepository.update(id, update);
  if (post === null) {
    return Response.json({ error: "Post not found." }, { status: 404 });
  }
  return Response.json({ post });
}

export async function handleBlogDeleteRequest(id: string): Promise<Response> {
  const deleted = await blogRepository.delete(id);
  if (!deleted) {
    return Response.json({ error: "Post not found." }, { status: 404 });
  }
  return new Response(null, { status: 204 });
}
