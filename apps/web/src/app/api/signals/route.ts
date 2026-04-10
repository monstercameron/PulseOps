import { createLoggedRouteHandler } from "@/features/observability/lib/route-logging";
import { localIngestionRuntime } from "@/features/runtime/local-ingestion-runtime";
import { handleSignalsRequest } from "@/features/signals/server/handle-signals-request";

export const GET = createLoggedRouteHandler({
  feature: "signals",
  handler: async (request) =>
    handleSignalsRequest(request, {
      documentRepository: localIngestionRuntime.documentRepository,
      factRepository: localIngestionRuntime.factRepository,
    }),
  route: "/api/signals",
});
