import { DEFAULT_WORKSPACE } from "@/features/foundation/domain/default-workspace";
import { SettingsPage } from "@/features/settings/components/settings-page";
import { getSettingsPageData } from "@/features/settings/server/handle-settings-page-request";
import { localIngestionRuntime } from "@/features/runtime/local-ingestion-runtime";

export default async function Settings() {
  const initialData = await getSettingsPageData(
    DEFAULT_WORKSPACE.orgId,
    {
      accountRepository: localIngestionRuntime.accountRepository,
      billingAccountRepository: localIngestionRuntime.billingAccountRepository,
      llmUsageEventRepository: localIngestionRuntime.llmUsageEventRepository,
      organizationRepository: localIngestionRuntime.organizationRepository,
      settingsRepository: localIngestionRuntime.settingsRepository,
    },
  );

  return <SettingsPage initialData={initialData} orgId={DEFAULT_WORKSPACE.orgId} />;
}
