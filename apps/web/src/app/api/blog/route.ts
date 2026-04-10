import { createLoggedRouteHandler } from "@/features/observability/lib/route-logging";
import {
  handleBlogCreateRequest,
  handleBlogListRequest,
} from "@/features/blog/server/handle-blog-request";

export const GET = createLoggedRouteHandler({
  feature: "blog",
  handler: async () => handleBlogListRequest(),
  route: "/api/blog",
});

export const POST = createLoggedRouteHandler({
  feature: "blog",
  handler: async (request) => handleBlogCreateRequest(request),
  route: "/api/blog",
});
