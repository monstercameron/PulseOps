import { cookies } from "next/headers";

import { APP_AUTH_COOKIE_NAME, resolveCurrentAppActor } from "@/features/auth/server/current-app-actor";
import { resolveServerPaths } from "@/features/config/server-env";
import { DEFAULT_WORKSPACE } from "@/features/foundation/domain/default-workspace";
import { SettingsPage } from "@/features/settings/components/settings-page";
import { getSettingsPageData } from "@/features/settings/server/handle-settings-page-request";
import { localIngestionRuntime } from "@/features/runtime/local-ingestion-runtime";

export const dynamic = "force-dynamic";

export default async function Settings() {
  const cookieStore = await cookies();
  const currentActor = await resolveCurrentAppActor({
    accountRepository: localIngestionRuntime.accountRepository,
    authSecret: resolveServerPaths().authSecret,
    cookieValue: cookieStore.get(APP_AUTH_COOKIE_NAME)?.value,
    orgId: DEFAULT_WORKSPACE.orgId,
  });
  const initialData = await getSettingsPageData(
    DEFAULT_WORKSPACE.orgId,
    {
      accountRepository: localIngestionRuntime.accountRepository,
      billingAccountRepository: localIngestionRuntime.billingAccountRepository,
      billingPaymentMethodRepository:
        localIngestionRuntime.billingPaymentMethodRepository,
      currentActor,
      llmUsageEventRepository: localIngestionRuntime.llmUsageEventRepository,
      organizationRepository: localIngestionRuntime.organizationRepository,
      settingsRepository: localIngestionRuntime.settingsRepository,
    },
  );

  return <SettingsPage initialData={initialData} orgId={DEFAULT_WORKSPACE.orgId} />;
}
