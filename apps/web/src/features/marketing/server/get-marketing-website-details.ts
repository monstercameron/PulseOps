import {
  fallbackWebsiteDetails,
  type WebsiteDetails,
} from "@/features/marketing/domain/website-details";
import { type SettingsRepository } from "@/features/settings/repositories/settings-repository";
import { getSettingsRecord } from "@/features/settings/server/settings-record-service";

export async function getMarketingWebsiteDetails(input: Readonly<{
  orgId: string;
  settingsRepository?: SettingsRepository;
}>): Promise<WebsiteDetails> {
  if (input.settingsRepository === undefined) {
    return fallbackWebsiteDetails;
  }

  const settingsRecord = await getSettingsRecord(
    input.settingsRepository,
    input.orgId,
  );

  return settingsRecord.websiteDetails;
}
