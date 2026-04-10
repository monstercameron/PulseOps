import { createLoggedRouteHandler } from "@/features/observability/lib/route-logging";
import { localIngestionRuntime } from "@/features/runtime/local-ingestion-runtime";
import { handleApiKeyRevokeRequest } from "@/features/settings/server/handle-api-key-revoke-request";

export const POST = createLoggedRouteHandler({
  feature: "settings",
  handler: async (request) =>
    handleApiKeyRevokeRequest(request, {
      settingsRepository: localIngestionRuntime.settingsRepository,
    }),
  route: "/api/settings/security/api-keys/revoke",
});
