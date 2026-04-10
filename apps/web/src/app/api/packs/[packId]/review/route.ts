import { createLoggedRouteHandler } from "@/features/observability/lib/route-logging";
import { handlePackReviewRequest } from "@/features/packs/server/handle-pack-review-request";
import { localIngestionRuntime } from "@/features/runtime/local-ingestion-runtime";

export const POST = createLoggedRouteHandler({
  feature: "packs",
  handler: async (request) =>
    handlePackReviewRequest(request, {
      packRepository: localIngestionRuntime.packRepository,
    }),
  route: "/api/packs/[packId]/review",
});
