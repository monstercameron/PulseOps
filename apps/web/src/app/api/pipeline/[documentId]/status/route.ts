import { revalidatePath } from "next/cache";

import { createLoggedRouteHandler } from "@/features/observability/lib/route-logging";
import { handleDocumentStatusUpdateRequest } from "@/features/pipeline/server/handle-document-status-update-request";
import { localIngestionRuntime } from "@/features/runtime/local-ingestion-runtime";

export const PATCH = createLoggedRouteHandler({
  feature: "pipeline",
  handler: async (request) =>
    handleDocumentStatusUpdateRequest(request, {
      auditLogRepository: localIngestionRuntime.auditLogRepository,
      documentRepository: localIngestionRuntime.documentRepository,
      revalidatePaths: (paths) => {
        paths.forEach((path) => revalidatePath(path));
      },
    }),
  route: "/api/pipeline/[documentId]/status",
});
