import { handlePacksPageRequest } from "@/features/packs/server/handle-packs-page-request";
import { handlePackGenerateRequest } from "@/features/packs/server/handle-pack-generate-request";
import { createLoggedRouteHandler } from "@/features/observability/lib/route-logging";
import { localIngestionRuntime } from "@/features/runtime/local-ingestion-runtime";

export const GET = createLoggedRouteHandler({
  feature: "packs",
  handler: async (request) =>
    handlePacksPageRequest(request, {
      documentRepository: localIngestionRuntime.documentRepository,
      factRepository: localIngestionRuntime.factRepository,
      packRepository: localIngestionRuntime.packRepository,
    }),
  route: "/api/packs",
});

export const POST = createLoggedRouteHandler({
  feature: "packs",
  handler: async (request) =>
    handlePackGenerateRequest(request, {
      decisionRunRepository: localIngestionRuntime.decisionRunRepository,
      documentRepository: localIngestionRuntime.documentRepository,
      factRepository: localIngestionRuntime.factRepository,
      packRepository: localIngestionRuntime.packRepository,
      recommendationRepository: localIngestionRuntime.recommendationRepository,
    }),
  route: "/api/packs",
});
