import { createLoggedRouteHandler } from "@/features/observability/lib/route-logging";
import { handlePackDetailRequest } from "@/features/packs/server/handle-pack-detail-request";
import { localIngestionRuntime } from "@/features/runtime/local-ingestion-runtime";

export const GET = createLoggedRouteHandler({
  feature: "packs",
  handler: async (request) =>
    handlePackDetailRequest(request, {
      documentRepository: localIngestionRuntime.documentRepository,
      factRepository: localIngestionRuntime.factRepository,
      packRepository: localIngestionRuntime.packRepository,
    }),
  route: "/api/packs/[packId]",
});
