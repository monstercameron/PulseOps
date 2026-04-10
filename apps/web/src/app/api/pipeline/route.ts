import { handlePipelinePageRequest } from "@/features/pipeline/server/handle-pipeline-page-request";
import { createLoggedRouteHandler } from "@/features/observability/lib/route-logging";
import { localIngestionRuntime } from "@/features/runtime/local-ingestion-runtime";

export const GET = createLoggedRouteHandler({
  feature: "pipeline",
  handler: async (request) =>
    handlePipelinePageRequest(request, {
      documentRepository: localIngestionRuntime.documentRepository,
      ingestionJobRepository: localIngestionRuntime.ingestionJobRepository,
    }),
  route: "/api/pipeline",
});
