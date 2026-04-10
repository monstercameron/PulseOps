import { handleDashboardPageRequest } from "@/features/dashboard/server/handle-dashboard-page-request";
import { createLoggedRouteHandler } from "@/features/observability/lib/route-logging";
import { localIngestionRuntime } from "@/features/runtime/local-ingestion-runtime";

export const GET = createLoggedRouteHandler({
  feature: "dashboard",
  handler: async (request) =>
    handleDashboardPageRequest(request, {
      dashboardSurfaceRepository: localIngestionRuntime.dashboardSurfaceRepository,
      documentRepository: localIngestionRuntime.documentRepository,
      factRepository: localIngestionRuntime.factRepository,
      packRepository: localIngestionRuntime.packRepository,
      queueEventRepository: localIngestionRuntime.queueEventRepository,
      savedQuestionRepository: localIngestionRuntime.savedQuestionRepository,
      settingsRepository: localIngestionRuntime.settingsRepository,
    }),
  route: "/api/dashboard",
});
