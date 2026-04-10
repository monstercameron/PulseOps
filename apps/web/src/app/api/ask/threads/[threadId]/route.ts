import { createLoggedRouteHandler } from "@/features/observability/lib/route-logging";
import { handleDeleteAskThreadRequest } from "@/features/query/server/handle-delete-ask-thread-request";
import { handleAskThreadRequest } from "@/features/query/server/handle-ask-thread-request";
import { localIngestionRuntime } from "@/features/runtime/local-ingestion-runtime";

export const GET = createLoggedRouteHandler({
  feature: "query",
  handler: async (request) =>
    handleAskThreadRequest(request, {
      savedQuestionRepository: localIngestionRuntime.savedQuestionRepository,
    }),
  route: "/api/ask/threads/[threadId]",
});

export const DELETE = createLoggedRouteHandler({
  feature: "query",
  handler: async (request) =>
    handleDeleteAskThreadRequest(request, {
      savedQuestionRepository: localIngestionRuntime.savedQuestionRepository,
    }),
  route: "/api/ask/threads/[threadId]",
});
