import { type CurrentAppActor } from "@/features/auth/server/current-app-actor";
import { buildSettingsAccess } from "@/features/settings/lib/settings-access";

export function requireSettingsActor(currentActor: CurrentAppActor | null) {
  if (currentActor === null) {
    return {
      actor: null,
      response: Response.json(
        {
          error: "You must be signed in to update settings.",
        },
        { status: 401 },
      ),
    };
  }

  return {
    actor: currentActor.account,
    response: null,
  };
}

export function canManageWorkspaceSettings(currentActor: CurrentAppActor | null) {
  return currentActor === null
    ? false
    : buildSettingsAccess(currentActor.account).canManageWorkspaceSettings;
}

export function canManageOperationalSettings(currentActor: CurrentAppActor | null) {
  return currentActor === null
    ? false
    : buildSettingsAccess(currentActor.account).canManageOperationalSettings;
}

export function canManagePeopleAccessSettings(currentActor: CurrentAppActor | null) {
  return currentActor === null
    ? false
    : buildSettingsAccess(currentActor.account).canManageAccounts;
}

export function canManageBillingSettings(currentActor: CurrentAppActor | null) {
  return currentActor === null
    ? false
    : buildSettingsAccess(currentActor.account).canManageBilling;
}
