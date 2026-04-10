import { DEFAULT_WORKSPACE } from "@/features/foundation/domain/default-workspace";
import { ContactPage } from "@/features/marketing/components/marketing-pages";
import { getMarketingWebsiteDetails } from "@/features/marketing/server/get-marketing-website-details";
import { localIngestionRuntime } from "@/features/runtime/local-ingestion-runtime";

export const dynamic = "force-dynamic";

export default async function Contact() {
  const websiteDetails = await getMarketingWebsiteDetails({
    orgId: DEFAULT_WORKSPACE.orgId,
    settingsRepository: localIngestionRuntime.settingsRepository,
  });

  return <ContactPage websiteDetails={websiteDetails} />;
}
