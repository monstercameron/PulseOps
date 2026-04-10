import { createLoggedRouteHandler } from "@/features/observability/lib/route-logging";
import {
  handleBlogDeleteRequest,
  handleBlogGetRequest,
  handleBlogUpdateRequest,
} from "@/features/blog/server/handle-blog-request";

function resolveIdFromUrl(request: Request): string {
  return new URL(request.url).pathname.split("/").filter(Boolean).pop() ?? "";
}

export const GET = createLoggedRouteHandler({
  feature: "blog",
  handler: async (request) => handleBlogGetRequest(resolveIdFromUrl(request)),
  route: "/api/blog/[id]",
});

export const PATCH = createLoggedRouteHandler({
  feature: "blog",
  handler: async (request) => handleBlogUpdateRequest(resolveIdFromUrl(request), request),
  route: "/api/blog/[id]",
});

export const DELETE = createLoggedRouteHandler({
  feature: "blog",
  handler: async (request) => handleBlogDeleteRequest(resolveIdFromUrl(request)),
  route: "/api/blog/[id]",
});
