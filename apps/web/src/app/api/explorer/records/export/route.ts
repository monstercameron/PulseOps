import { DEFAULT_WORKSPACE } from "@/features/foundation/domain/default-workspace";
import { ensureCuratedDocumentsSeeded } from "@/features/documents/server/seed-curated-documents";
import { createLoggedRouteHandler } from "@/features/observability/lib/route-logging";
import { handleExplorerExportRequest } from "@/features/explorer/server/handle-explorer-export-request";
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
        parserArtifactRepository: localIngestionRuntime.parserArtifactRepository,
        storage: localIngestionRuntime.storage,
      });
    }

    return handleExplorerExportRequest(request, {
      documentRepository: localIngestionRuntime.documentRepository,
      factRepository: localIngestionRuntime.factRepository,
      parserArtifactRepository: localIngestionRuntime.parserArtifactRepository,
      textParserArtifactRepository:
        localIngestionRuntime.textParserArtifactRepository,
    });
  },
  route: "/api/explorer/records/export",
});
