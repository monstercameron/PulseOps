import { DEFAULT_WORKSPACE } from "@/features/foundation/domain/default-workspace";
import { PacksPage } from "@/features/packs/components/packs-page";
import { getPacksPageData } from "@/features/packs/server/handle-packs-page-request";
import { localIngestionRuntime } from "@/features/runtime/local-ingestion-runtime";

export default async function Packs() {
  const initialData = await getPacksPageData({
    documentRepository: localIngestionRuntime.documentRepository,
    factRepository: localIngestionRuntime.factRepository,
    orgId: DEFAULT_WORKSPACE.orgId,
    packRepository: localIngestionRuntime.packRepository,
  });

  return <PacksPage initialData={initialData} orgId={DEFAULT_WORKSPACE.orgId} />;
}
