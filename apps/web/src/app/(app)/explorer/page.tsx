import { ExplorerPage } from "@/features/explorer/components/explorer-page";
import { getExplorerPageData } from "@/features/explorer/server/handle-explorer-records-request";
import { readDocumentStatusListSearchParam } from "@/features/documents/server/document-query-filters";
import { ensureCuratedDocumentsSeeded } from "@/features/documents/server/seed-curated-documents";
import { DEFAULT_WORKSPACE } from "@/features/foundation/domain/default-workspace";
import { getCurrentUiLocale } from "@/features/i18n/server/ui-translations";
import { localIngestionRuntime } from "@/features/runtime/local-ingestion-runtime";

type ExplorerPageProps = Readonly<{
  searchParams?: Promise<{
    documentId?: string;
    status?: string;
  }>;
}>;

export default async function Explorer({ searchParams }: ExplorerPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const locale = await getCurrentUiLocale();

  await ensureCuratedDocumentsSeeded({
    documentRepository: localIngestionRuntime.documentRepository,
    entityRepository: localIngestionRuntime.entityRepository,
    factRepository: localIngestionRuntime.factRepository,
    orgId: DEFAULT_WORKSPACE.orgId,
    parserArtifactRepository: localIngestionRuntime.parserArtifactRepository,
    storage: localIngestionRuntime.storage,
  });

  const initialData = await getExplorerPageData({
    documentId: params?.documentId,
    documentRepository: localIngestionRuntime.documentRepository,
    factRepository: localIngestionRuntime.factRepository,
    locale,
    orgId: DEFAULT_WORKSPACE.orgId,
    parserArtifactRepository: localIngestionRuntime.parserArtifactRepository,
    statuses: readDocumentStatusListSearchParam(params?.status),
    textParserArtifactRepository:
      localIngestionRuntime.textParserArtifactRepository,
  });

  return <ExplorerPage initialData={initialData} orgId={DEFAULT_WORKSPACE.orgId} />;
}
