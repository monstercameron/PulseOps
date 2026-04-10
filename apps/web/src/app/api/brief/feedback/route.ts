import { handleRecommendationFeedback } from "@/features/feedback/server/handle-recommendation-feedback";
import { resolveServerPaths } from "@/features/config/server-env";
import { createLoggedRouteHandler } from "@/features/observability/lib/route-logging";
import { localIngestionRuntime } from "@/features/runtime/local-ingestion-runtime";

export const POST = createLoggedRouteHandler({
  feature: "feedback",
  handler: async (request) =>
    handleRecommendationFeedback(request, {
    auditLogRepository: localIngestionRuntime.auditLogRepository,
    authSecret: resolveServerPaths().authSecret,
    feedbackRepository: localIngestionRuntime.feedbackRepository,
    }),
  route: "/api/brief/feedback",
});
