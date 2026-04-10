import { DEFAULT_WORKSPACE } from "@/features/foundation/domain/default-workspace";
import { HomePage } from "@/features/home/components/home-page";
import { getMarketingWebsiteDetails } from "@/features/marketing/server/get-marketing-website-details";
import { localIngestionRuntime } from "@/features/runtime/local-ingestion-runtime";

export const dynamic = "force-dynamic";

export default async function Home() {
  const websiteDetails = await getMarketingWebsiteDetails({
    orgId: DEFAULT_WORKSPACE.orgId,
    settingsRepository: localIngestionRuntime.settingsRepository,
  });

  return <HomePage websiteDetails={websiteDetails} />;
}
