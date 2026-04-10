import { DEFAULT_WORKSPACE } from "@/features/foundation/domain/default-workspace";
import { createLoggedRouteHandler } from "@/features/observability/lib/route-logging";
import { handleDocumentDetailRequest } from "@/features/documents/server/handle-document-detail-request";
import { ensureCuratedDocumentsSeeded } from "@/features/documents/server/seed-curated-documents";
import { localIngestionRuntime } from "@/features/runtime/local-ingestion-runtime";

export const GET = createLoggedRouteHandler({
  feature: "documents",
  handler: async (request) => {
    const orgId = new URL(request.url).searchParams.get("orgId");

    if (orgId === DEFAULT_WORKSPACE.orgId) {
      await ensureCuratedDocumentsSeeded({
        documentRepository: localIngestionRuntime.documentRepository,
        entityRepository: localIngestionRuntime.entityRepository,
        factRepository: localIngestionRuntime.factRepository,
        orgId,
        storage: localIngestionRuntime.storage,
      });
    }

    return handleDocumentDetailRequest(request, {
      documentRepository: localIngestionRuntime.documentRepository,
      factRepository: localIngestionRuntime.factRepository,
    });
  },
  route: "/api/documents/[documentId]",
});
