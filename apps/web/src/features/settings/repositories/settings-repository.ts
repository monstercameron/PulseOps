import { type SettingsRecord } from "@/features/settings/domain/settings-record";

export interface SettingsRepository {
  getByOrgId(orgId: string): Promise<SettingsRecord | null>;
  put(settingsRecord: SettingsRecord): Promise<SettingsRecord>;
}
