import { handleErrorBoundaryReport } from "@/features/observability/lib/error-boundary-report";
import { createLoggedRouteHandler } from "@/features/observability/lib/route-logging";

export const POST = createLoggedRouteHandler({
  feature: "frontend",
  handler: async (request, context) =>
    handleErrorBoundaryReport(request, {
      requestId: context.requestId,
      route: "/api/observability/error-boundary",
    }),
  route: "/api/observability/error-boundary",
});
