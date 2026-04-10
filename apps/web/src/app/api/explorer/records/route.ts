import { DEFAULT_WORKSPACE } from "@/features/foundation/domain/default-workspace";
import { ensureCuratedDocumentsSeeded } from "@/features/documents/server/seed-curated-documents";
import { handleExplorerRecordsRequest } from "@/features/explorer/server/handle-explorer-records-request";
import { createLoggedRouteHandler } from "@/features/observability/lib/route-logging";
import { localIngestionRuntime } from "@/features/runtime/local-ingestion-runtime";

export const GET = createLoggedRouteHandler({
  feature: "explorer",
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

    return handleExplorerRecordsRequest(request, {
      documentRepository: localIngestionRuntime.documentRepository,
      factRepository: localIngestionRuntime.factRepository,
    });
  },
  route: "/api/explorer/records",
});
