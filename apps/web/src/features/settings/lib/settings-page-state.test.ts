import { describe, expect, it } from "vitest";

import {
  fallbackSettingsPageData,
  type SettingsPageData,
} from "@/features/settings/constants/settings-page-content";
import { mergeSettingsMutationResponse } from "@/features/settings/lib/settings-page-state";

describe("mergeSettingsMutationResponse", () => {
  it("replaces the full page state when a settings payload is returned", () => {
    const nextSettings: SettingsPageData = {
      ...fallbackSettingsPageData,
      organization: {
        ...fallbackSettingsPageData.organization,
        name: "Next Org",
      },
    };

    expect(
      mergeSettingsMutationResponse(fallbackSettingsPageData, {
        orgId: "org_123",
        ...nextSettings,
      }),
    ).toMatchObject({
      organization: {
        name: "Next Org",
      },
    });
  });

  it("merges team-only responses into the current state", () => {
    const result = mergeSettingsMutationResponse(fallbackSettingsPageData, {
      orgId: "org_123",
      team: {
        ...fallbackSettingsPageData.team,
        members: [
          {
            accessSummary: "Invitation pending",
            canEditAuthorization: false,
            canEditIdentity: false,
            canOpenAccountControls: false,
            canResetPassword: false,
            email: "new@browardhvac.com",
            id: "member_new",
            isCurrentUser: false,
            name: "New Member",
            operationsAccess: true,
            reportAccess: false,
            role: "Operator",
            setupAccess: true,
            status: "invited",
            statusLabel: "Invited",
            userId: "user_new",
          },
        ],
      },
    });

    expect(result.team.members).toEqual([
      expect.objectContaining({
        email: "new@browardhvac.com",
      }),
    ]);
    expect(result.organization).toEqual(fallbackSettingsPageData.organization);
  });

  it("merges security list responses without mutating the other security section", () => {
    const apiKeysResult = mergeSettingsMutationResponse(
      fallbackSettingsPageData,
      {
        apiKeys: [],
        orgId: "org_123",
      },
    );
    const sessionsResult = mergeSettingsMutationResponse(
      fallbackSettingsPageData,
      {
        orgId: "org_123",
        sessions: [],
      },
    );

    expect(apiKeysResult.security.apiKeys).toEqual([]);
    expect(apiKeysResult.security.sessions).toEqual(
      fallbackSettingsPageData.security.sessions,
    );
    expect(sessionsResult.security.sessions).toEqual([]);
    expect(sessionsResult.security.apiKeys).toEqual(
      fallbackSettingsPageData.security.apiKeys,
    );
  });
});
