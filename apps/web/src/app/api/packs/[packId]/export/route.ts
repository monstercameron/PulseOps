import { createLoggedRouteHandler } from "@/features/observability/lib/route-logging";
import { handlePackExportRequest } from "@/features/packs/server/handle-pack-export-request";
import { localIngestionRuntime } from "@/features/runtime/local-ingestion-runtime";

export const GET = createLoggedRouteHandler({
  feature: "packs",
  handler: async (request) =>
    handlePackExportRequest(request, {
      documentRepository: localIngestionRuntime.documentRepository,
      factRepository: localIngestionRuntime.factRepository,
      packRepository: localIngestionRuntime.packRepository,
    }),
  route: "/api/packs/[packId]/export",
});
