import { resolveCurrentAppActor } from "@/features/auth/server/current-app-actor";
import { resolveServerPaths } from "@/features/config/server-env";
import { handleSettingsPageRequest } from "@/features/settings/server/handle-settings-page-request";
import { handleSettingsUpdateRequest } from "@/features/settings/server/handle-settings-update-request";
import { createLoggedRouteHandler } from "@/features/observability/lib/route-logging";
import { localIngestionRuntime } from "@/features/runtime/local-ingestion-runtime";

export const dynamic = "force-dynamic";

export const GET = createLoggedRouteHandler({
  feature: "settings",
  handler: async (request) => {
    const orgId = (await readSettingsOrgIdFromRequest(request)) ?? "";

    return handleSettingsPageRequest(request, {
      accountRepository: localIngestionRuntime.accountRepository,
      billingAccountRepository: localIngestionRuntime.billingAccountRepository,
      billingPaymentMethodRepository:
        localIngestionRuntime.billingPaymentMethodRepository,
      currentActor: await resolveCurrentAppActor({
        accountRepository: localIngestionRuntime.accountRepository,
        authSecret: resolveServerPaths().authSecret,
        orgId,
        request,
      }),
      llmUsageEventRepository: localIngestionRuntime.llmUsageEventRepository,
      organizationRepository: localIngestionRuntime.organizationRepository,
      settingsRepository: localIngestionRuntime.settingsRepository,
    });
  },
  route: "/api/settings",
});

export const PATCH = createLoggedRouteHandler({
  feature: "settings",
  handler: async (request) => {
    const orgId = (await readSettingsOrgIdFromRequest(request)) ?? "";

    return handleSettingsUpdateRequest(request, {
      accountRepository: localIngestionRuntime.accountRepository,
      billingAccountRepository: localIngestionRuntime.billingAccountRepository,
      billingPaymentMethodRepository:
        localIngestionRuntime.billingPaymentMethodRepository,
      currentActor: await resolveCurrentAppActor({
        accountRepository: localIngestionRuntime.accountRepository,
        authSecret: resolveServerPaths().authSecret,
        orgId,
        request,
      }),
      llmUsageEventRepository: localIngestionRuntime.llmUsageEventRepository,
      organizationRepository: localIngestionRuntime.organizationRepository,
      settingsRepository: localIngestionRuntime.settingsRepository,
    });
  },
  route: "/api/settings",
});

async function readSettingsOrgIdFromRequest(request: Request) {
  const orgIdFromQuery = new URL(request.url).searchParams.get("orgId");

  if (orgIdFromQuery !== null && orgIdFromQuery.length > 0) {
    return orgIdFromQuery;
  }

  try {
    const body = (await request.clone().json()) as { orgId?: unknown };

    return typeof body.orgId === "string" && body.orgId.length > 0
      ? body.orgId
      : null;
  } catch {
    return null;
  }
}
