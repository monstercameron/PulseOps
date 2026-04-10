import { createLoggedRouteHandler } from "@/features/observability/lib/route-logging";
import { localIngestionRuntime } from "@/features/runtime/local-ingestion-runtime";
import { handleSessionRevokeRequest } from "@/features/settings/server/handle-session-revoke-request";

export const POST = createLoggedRouteHandler({
  feature: "settings",
  handler: async (request) =>
    handleSessionRevokeRequest(request, {
      settingsRepository: localIngestionRuntime.settingsRepository,
    }),
  route: "/api/settings/security/sessions/revoke",
});
