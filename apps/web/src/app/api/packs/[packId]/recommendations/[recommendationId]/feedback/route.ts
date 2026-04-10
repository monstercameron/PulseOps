import { createLoggedRouteHandler } from "@/features/observability/lib/route-logging";
import { handlePackRecommendationFeedbackRequest } from "@/features/packs/server/handle-pack-recommendation-feedback-request";
import { localIngestionRuntime } from "@/features/runtime/local-ingestion-runtime";

export const POST = createLoggedRouteHandler({
  feature: "packs",
  handler: async (request) =>
    handlePackRecommendationFeedbackRequest(request, {
      auditLogRepository: localIngestionRuntime.auditLogRepository,
      feedbackRepository: localIngestionRuntime.feedbackRepository,
    }),
  route: "/api/packs/[packId]/recommendations/[recommendationId]/feedback",
});
