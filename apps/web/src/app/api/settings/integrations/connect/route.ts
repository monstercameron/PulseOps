import { createLoggedRouteHandler } from "@/features/observability/lib/route-logging";
import { localIngestionRuntime } from "@/features/runtime/local-ingestion-runtime";
import { handleIntegrationConnectRequest } from "@/features/settings/server/handle-integration-connect-request";

export const POST = createLoggedRouteHandler({
  feature: "settings",
  handler: async (request) =>
    handleIntegrationConnectRequest(request, {
      settingsRepository: localIngestionRuntime.settingsRepository,
    }),
  route: "/api/settings/integrations/connect",
});
