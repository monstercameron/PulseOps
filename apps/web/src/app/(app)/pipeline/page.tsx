import { PipelinePage } from "@/features/pipeline/components/pipeline-page";
import { getPipelinePageData } from "@/features/pipeline/server/handle-pipeline-page-request";
import { readDocumentStatusListSearchParam } from "@/features/documents/server/document-query-filters";
import { DEFAULT_WORKSPACE } from "@/features/foundation/domain/default-workspace";
import { localIngestionRuntime } from "@/features/runtime/local-ingestion-runtime";

type PipelinePageProps = Readonly<{
  searchParams?: Promise<{
    status?: string;
  }>;
}>;

export default async function Pipeline({ searchParams }: PipelinePageProps) {
  const params = searchParams ? await searchParams : undefined;

  const initialData = await getPipelinePageData({
    documentRepository: localIngestionRuntime.documentRepository,
    ingestionJobRepository: localIngestionRuntime.ingestionJobRepository,
    orgId: DEFAULT_WORKSPACE.orgId,
    statuses: readDocumentStatusListSearchParam(params?.status),
  });

  return <PipelinePage initialData={initialData} orgId={DEFAULT_WORKSPACE.orgId} />;
}
