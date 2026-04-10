import { DEFAULT_WORKSPACE } from "@/features/foundation/domain/default-workspace";
import { createLoggedRouteHandler } from "@/features/observability/lib/route-logging";
import { handleDocumentsListRequest } from "@/features/documents/server/handle-documents-list-request";
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

    return handleDocumentsListRequest(request, {
      documentRepository: localIngestionRuntime.documentRepository,
      factRepository: localIngestionRuntime.factRepository,
    });
  },
  route: "/api/documents",
});
