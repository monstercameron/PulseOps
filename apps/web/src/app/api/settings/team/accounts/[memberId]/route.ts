import { resolveCurrentAppActor } from "@/features/auth/server/current-app-actor";
import { resolveServerPaths } from "@/features/config/server-env";
import { createLoggedRouteHandler } from "@/features/observability/lib/route-logging";
import { localIngestionRuntime } from "@/features/runtime/local-ingestion-runtime";
import { handleTeamAccountUpdateRequest } from "@/features/settings/server/handle-team-account-update-request";

export const PATCH = createLoggedRouteHandler({
  feature: "settings",
  handler: async (request) => {
    const orgId = (await readSettingsOrgIdFromRequest(request)) ?? "";

    return handleTeamAccountUpdateRequest(request, {
      accountRepository: localIngestionRuntime.accountRepository,
      billingAccountRepository: localIngestionRuntime.billingAccountRepository,
      currentActor: await resolveCurrentAppActor({
        accountRepository: localIngestionRuntime.accountRepository,
        authSecret: resolveServerPaths().authSecret,
        orgId,
        request,
      }),
      llmUsageEventRepository: localIngestionRuntime.llmUsageEventRepository,
      memberId: new URL(request.url).pathname.split("/").filter(Boolean).pop() ?? "",
      organizationRepository: localIngestionRuntime.organizationRepository,
      settingsRepository: localIngestionRuntime.settingsRepository,
    });
  },
  route: "/api/settings/team/accounts/[memberId]",
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
