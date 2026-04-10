import { handleAskHistoryRequest } from "@/features/query/server/handle-ask-history-request";
import { handleAskRequest } from "@/features/query/server/handle-ask-request";
import { createLoggedRouteHandler } from "@/features/observability/lib/route-logging";
import { localIngestionRuntime } from "@/features/runtime/local-ingestion-runtime";

export const GET = createLoggedRouteHandler({
  feature: "query",
  handler: async (request) =>
    handleAskHistoryRequest(request, {
      savedQuestionRepository: localIngestionRuntime.savedQuestionRepository,
    }),
  route: "/api/ask",
});

export const POST = createLoggedRouteHandler({
  feature: "query",
  handler: async (request) =>
    handleAskRequest(request, {
      chunkRepository: localIngestionRuntime.chunkRepository,
      embedder: localIngestionRuntime.embedder,
      factRepository: localIngestionRuntime.factRepository,
      savedQuestionRepository: localIngestionRuntime.savedQuestionRepository,
    }),
  route: "/api/ask",
});
