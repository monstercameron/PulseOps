import { type OrganizationAccountRecord } from "@/features/accounts/domain/organization-account";
import {
  defaultSettingsTabLabels,
  type SettingsPageData,
  type SettingsTabId,
} from "@/features/settings/constants/settings-page-content";

type SettingsAccess = Pick<
  SettingsPageData["currentUser"],
  | "canManageAccounts"
  | "canManageBilling"
  | "canManageOperationalSettings"
  | "canManageWorkspaceSettings"
>;

export function buildSettingsAccess(
  account: Pick<
    OrganizationAccountRecord,
    "operationsAccess" | "role" | "setupAccess" | "status"
  >,
): SettingsAccess {
  const isActive = account.status === "active";
  const isAdmin = account.role === "admin";

  return {
    canManageAccounts: isActive && isAdmin,
    canManageBilling: isActive && isAdmin,
    canManageOperationalSettings:
      isActive && (account.setupAccess || account.operationsAccess),
    canManageWorkspaceSettings: isActive && account.setupAccess,
  };
}

export function buildVisibleSettingsTabIds(
  access: SettingsAccess,
): readonly SettingsTabId[] {
  return [
    "myAccount",
    ...(access.canManageWorkspaceSettings ? (["workspace"] as const) : []),
    ...(access.canManageOperationalSettings
      ? (["sourcesOperations"] as const)
      : []),
    ...(access.canManageAccounts ? (["peopleAccess"] as const) : []),
    ...(access.canManageBilling ? (["billing"] as const) : []),
  ];
}

export function buildVisibleSettingsTabs(access: SettingsAccess) {
  return buildVisibleSettingsTabIds(access).map((id) => ({
    id,
    label: defaultSettingsTabLabels[id],
  }));
}
