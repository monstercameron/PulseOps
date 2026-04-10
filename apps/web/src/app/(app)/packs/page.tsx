import { DEFAULT_WORKSPACE } from "@/features/foundation/domain/default-workspace";
import { getCurrentUiLocale } from "@/features/i18n/server/ui-translations";
import { PacksPage } from "@/features/packs/components/packs-page";
import { getPacksPageData } from "@/features/packs/server/handle-packs-page-request";
import { localIngestionRuntime } from "@/features/runtime/local-ingestion-runtime";

export default async function Packs() {
  const locale = await getCurrentUiLocale();
  const initialData = await getPacksPageData({
    documentRepository: localIngestionRuntime.documentRepository,
    factRepository: localIngestionRuntime.factRepository,
    locale,
    orgId: DEFAULT_WORKSPACE.orgId,
    packRepository: localIngestionRuntime.packRepository,
  });

  return <PacksPage initialData={initialData} orgId={DEFAULT_WORKSPACE.orgId} />;
}
