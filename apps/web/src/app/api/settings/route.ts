import { handleSettingsPageRequest } from "@/features/settings/server/handle-settings-page-request";
import { handleSettingsUpdateRequest } from "@/features/settings/server/handle-settings-update-request";
import { createLoggedRouteHandler } from "@/features/observability/lib/route-logging";
import { localIngestionRuntime } from "@/features/runtime/local-ingestion-runtime";

export const GET = createLoggedRouteHandler({
  feature: "settings",
  handler: async (request) =>
    handleSettingsPageRequest(request, {
      accountRepository: localIngestionRuntime.accountRepository,
      billingAccountRepository: localIngestionRuntime.billingAccountRepository,
      llmUsageEventRepository: localIngestionRuntime.llmUsageEventRepository,
      organizationRepository: localIngestionRuntime.organizationRepository,
      settingsRepository: localIngestionRuntime.settingsRepository,
    }),
  route: "/api/settings",
});

export const PATCH = createLoggedRouteHandler({
  feature: "settings",
  handler: async (request) =>
    handleSettingsUpdateRequest(request, {
      accountRepository: localIngestionRuntime.accountRepository,
      billingAccountRepository: localIngestionRuntime.billingAccountRepository,
      llmUsageEventRepository: localIngestionRuntime.llmUsageEventRepository,
      organizationRepository: localIngestionRuntime.organizationRepository,
      settingsRepository: localIngestionRuntime.settingsRepository,
    }),
  route: "/api/settings",
});
