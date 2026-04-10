import { resolveCurrentAppActor } from "@/features/auth/server/current-app-actor";
import { resolveServerPaths } from "@/features/config/server-env";
import { createLoggedRouteHandler } from "@/features/observability/lib/route-logging";
import { localIngestionRuntime } from "@/features/runtime/local-ingestion-runtime";
import { handleSessionRevokeRequest } from "@/features/settings/server/handle-session-revoke-request";

export const POST = createLoggedRouteHandler({
  feature: "settings",
  handler: async (request) => {
    const orgId = (await readSettingsOrgIdFromRequest(request)) ?? "";

    return handleSessionRevokeRequest(request, {
      currentActor: await resolveCurrentAppActor({
        accountRepository: localIngestionRuntime.accountRepository,
        authSecret: resolveServerPaths().authSecret,
        orgId,
        request,
      }),
      settingsRepository: localIngestionRuntime.settingsRepository,
    });
  },
  route: "/api/settings/security/sessions/revoke",
});

async function readSettingsOrgIdFromRequest(request: Request) {
  try {
    const body = (await request.clone().json()) as { orgId?: unknown };

    return typeof body.orgId === "string" && body.orgId.length > 0
      ? body.orgId
      : null;
  } catch {
    return null;
  }
}
