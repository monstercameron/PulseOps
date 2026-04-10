import { createLoggedRouteHandler } from "@/features/observability/lib/route-logging";
import { handleAskHistoryRequest } from "@/features/query/server/handle-ask-history-request";
import { localIngestionRuntime } from "@/features/runtime/local-ingestion-runtime";

export const GET = createLoggedRouteHandler({
  feature: "query",
  handler: async (request) =>
    handleAskHistoryRequest(request, {
      savedQuestionRepository: localIngestionRuntime.savedQuestionRepository,
    }),
  route: "/api/ask/threads",
});
