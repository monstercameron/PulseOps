import { ExplorerPage } from "@/features/explorer/components/explorer-page";
import { getExplorerPageData } from "@/features/explorer/server/handle-explorer-records-request";
import { readDocumentStatusListSearchParam } from "@/features/documents/server/document-query-filters";
import { ensureCuratedDocumentsSeeded } from "@/features/documents/server/seed-curated-documents";
import { DEFAULT_WORKSPACE } from "@/features/foundation/domain/default-workspace";
import { localIngestionRuntime } from "@/features/runtime/local-ingestion-runtime";

type ExplorerPageProps = Readonly<{
  searchParams?: Promise<{
    documentId?: string;
    status?: string;
  }>;
}>;

export default async function Explorer({ searchParams }: ExplorerPageProps) {
  const params = searchParams ? await searchParams : undefined;

  await ensureCuratedDocumentsSeeded({
    documentRepository: localIngestionRuntime.documentRepository,
    entityRepository: localIngestionRuntime.entityRepository,
    factRepository: localIngestionRuntime.factRepository,
    orgId: DEFAULT_WORKSPACE.orgId,
    storage: localIngestionRuntime.storage,
  });

  const initialData = await getExplorerPageData({
    documentId: params?.documentId,
    documentRepository: localIngestionRuntime.documentRepository,
    factRepository: localIngestionRuntime.factRepository,
    orgId: DEFAULT_WORKSPACE.orgId,
    statuses: readDocumentStatusListSearchParam(params?.status),
  });

  return <ExplorerPage initialData={initialData} orgId={DEFAULT_WORKSPACE.orgId} />;
}
