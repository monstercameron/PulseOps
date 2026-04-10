import { createLoggedRouteHandler } from "@/features/observability/lib/route-logging";
import { localIngestionRuntime } from "@/features/runtime/local-ingestion-runtime";
import { handleTeamInviteRequest } from "@/features/settings/server/handle-team-invite-request";

export const POST = createLoggedRouteHandler({
  feature: "settings",
  handler: async (request) =>
    handleTeamInviteRequest(request, {
      accountRepository: localIngestionRuntime.accountRepository,
      organizationRepository: localIngestionRuntime.organizationRepository,
      settingsRepository: localIngestionRuntime.settingsRepository,
    }),
  route: "/api/settings/team/invitations",
});
