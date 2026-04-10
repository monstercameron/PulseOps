import { type SettingsPageData } from "@/features/settings/constants/settings-page-content";

type SettingsPageResponse = SettingsPageData &
  Readonly<{
    orgId: string;
  }>;

type SettingsTeamResponse = Readonly<{
  member?: SettingsPageData["team"]["members"][number];
  orgId: string;
  team: SettingsPageData["team"];
}>;

type SettingsApiKeysResponse = Readonly<{
  apiKeys: SettingsPageData["security"]["apiKeys"];
  orgId: string;
}>;

type SettingsSessionsResponse = Readonly<{
  orgId: string;
  sessions: SettingsPageData["security"]["sessions"];
}>;

type SettingsIntegrationsResponse = Readonly<{
  integrations: SettingsPageData["integrations"];
  orgId: string;
}>;

export type SettingsMutationResponse =
  | SettingsApiKeysResponse
  | SettingsIntegrationsResponse
  | SettingsPageResponse
  | SettingsSessionsResponse
  | SettingsTeamResponse;

export function mergeSettingsMutationResponse(
  currentData: SettingsPageData,
  response: SettingsMutationResponse,
): SettingsPageData {
  if ("tabs" in response) {
    return stripOrgId(response);
  }

  if ("team" in response) {
    return {
      ...currentData,
      team: response.team,
    };
  }

  if ("integrations" in response) {
    return {
      ...currentData,
      integrations: response.integrations,
    };
  }

  if ("apiKeys" in response) {
    return {
      ...currentData,
      security: {
        ...currentData.security,
        apiKeys: response.apiKeys,
      },
    };
  }

  return {
    ...currentData,
    security: {
      ...currentData.security,
      sessions: response.sessions,
    },
  };
}

function stripOrgId(response: SettingsPageResponse): SettingsPageData {
  const { orgId, ...pageData } = response;

  void orgId;

  return pageData;
}
