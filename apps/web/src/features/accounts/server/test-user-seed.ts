import { DEFAULT_WORKSPACE } from "@/features/foundation/domain/default-workspace";
import { fallbackSettingsPageData } from "@/features/settings/constants/settings-page-content";

export const TEST_USER_PASSWORD = "password";

export type TestUserSeed = Readonly<{
  email: string;
  name: string;
  operationsAccess: boolean;
  orgId: string;
  reportAccess: boolean;
  role: "admin" | "operator";
  setupAccess: boolean;
}>;

export function getDefaultOrganizationSeed(
  orgId: string = DEFAULT_WORKSPACE.orgId,
) {
  return {
    goals: fallbackSettingsPageData.organization.goals,
    id: orgId,
    industry: fallbackSettingsPageData.organization.industry,
    invoiceCycle: fallbackSettingsPageData.organization.invoiceCycle,
    location: fallbackSettingsPageData.organization.location,
    name: fallbackSettingsPageData.organization.name,
    revenueModel: fallbackSettingsPageData.organization.revenueModel,
    status: "active" as const,
    teamSize: fallbackSettingsPageData.organization.teamSize,
  };
}

export function getTestUserSeeds(
  orgId: string = DEFAULT_WORKSPACE.orgId,
): readonly TestUserSeed[] {
  return [
    {
      email: "admin@example.com",
      name: "Admin User",
      operationsAccess: true,
      orgId,
      reportAccess: true,
      role: "admin",
      setupAccess: true,
    },
    {
      email: "support@example.com",
      name: "Support User",
      operationsAccess: true,
      orgId,
      reportAccess: false,
      role: "operator",
      setupAccess: true,
    },
  ] as const;
}

export function getTestUserSeedRows(
  orgId: string = DEFAULT_WORKSPACE.orgId,
) {
  return getTestUserSeeds(orgId).map((seedUser) => ({
    email: seedUser.email,
    orgId,
    role: seedUser.role,
    status: "active" as const,
  }));
}
