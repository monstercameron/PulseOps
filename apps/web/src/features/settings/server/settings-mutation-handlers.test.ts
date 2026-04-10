import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { createOrganizationAccount } from "@/features/accounts/domain/organization-account";
import { createLocalAccountRepository } from "@/features/accounts/repositories/local-account-repository";
import { type OrganizationRecord } from "@/features/settings/domain/organization-record";
import { createLocalSettingsRepository } from "@/features/settings/repositories/local-settings-repository";
import { handleApiKeyRevokeRequest } from "@/features/settings/server/handle-api-key-revoke-request";
import { handleSessionRevokeRequest } from "@/features/settings/server/handle-session-revoke-request";
import { handleSettingsUpdateRequest } from "@/features/settings/server/handle-settings-update-request";
import { handleTeamInviteRequest } from "@/features/settings/server/handle-team-invite-request";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("settings mutation handlers", () => {
  it("persists organization and notification updates", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-settings-update-"),
    );
    temporaryDirectories.push(rootDirectory);

    const settingsRepository = createLocalSettingsRepository({ rootDirectory });
    const persistedOrganizations: OrganizationRecord[] = [];
    const response = await handleSettingsUpdateRequest(
      new Request("http://localhost/api/settings", {
        body: JSON.stringify({
          notifications: [
            {
              id: "briefs",
              items: [
                {
                  description: "Send the weekly brief every Monday morning.",
                  enabled: false,
                  title: "Cash and margin brief email",
                },
              ],
              title: "Weekly briefs",
            },
          ],
          orgId: "org_123",
          organization: {
            industry: "Plumbing / Field service",
            invoiceCycle: "Bi-weekly",
            location: "Miami, FL",
            name: "Precision Plumbing Co.",
            revenueModel: "Project-based",
            teamSize: "11-25 people",
          },
        }),
        method: "PATCH",
      }),
      {
        now: () => "2026-04-10T02:00:00.000Z",
        organizationRepository: {
          async getById() {
            return null;
          },
          async list() {
            return persistedOrganizations;
          },
          async put(organizationRecord) {
            persistedOrganizations.push(organizationRecord);

            return organizationRecord;
          },
        },
        settingsRepository,
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      notifications: [
        expect.objectContaining({
          items: [expect.objectContaining({ enabled: false })],
        }),
      ],
      organization: expect.objectContaining({
        name: "Precision Plumbing Co.",
      }),
    });
    expect(persistedOrganizations).toEqual([
      expect.objectContaining({
        id: "org_123",
        name: "Precision Plumbing Co.",
      }),
    ]);
  });

  it("adds invited team members and revokes sessions and api keys", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-settings-actions-"),
    );
    temporaryDirectories.push(rootDirectory);

    const accountRepository = createLocalAccountRepository({ rootDirectory });
    const settingsRepository = createLocalSettingsRepository({ rootDirectory });

    const inviteResponse = await handleTeamInviteRequest(
      new Request("http://localhost/api/settings/team/invitations", {
        body: JSON.stringify({
          invite: {
            email: "ops2@browardhvac.com",
            name: "Ops User",
            role: "operator",
          },
          orgId: "org_123",
        }),
        method: "POST",
      }),
      {
        accountRepository,
        settingsRepository,
      },
    );

    expect(inviteResponse.status).toBe(201);
    await expect(inviteResponse.json()).resolves.toMatchObject({
      member: expect.objectContaining({
        accessSummary: "Setup, Ops",
        email: "ops2@browardhvac.com",
        role: "Operator",
        status: "invited",
      }),
    });

    const sessionResponse = await handleSessionRevokeRequest(
      new Request("http://localhost/api/settings/security/sessions/revoke", {
        body: JSON.stringify({
          orgId: "org_123",
          title: "Safari on iPhone",
        }),
        method: "POST",
      }),
      {
        settingsRepository,
      },
    );

    expect(sessionResponse.status).toBe(200);
    await expect(sessionResponse.json()).resolves.toMatchObject({
      sessions: [expect.objectContaining({ title: "Chrome on macOS" })],
    });

    const apiKeyResponse = await handleApiKeyRevokeRequest(
      new Request("http://localhost/api/settings/security/api-keys/revoke", {
        body: JSON.stringify({
          name: "Pipeline integration key",
          orgId: "org_123",
        }),
        method: "POST",
      }),
      {
        settingsRepository,
      },
    );

    expect(apiKeyResponse.status).toBe(200);
    await expect(apiKeyResponse.json()).resolves.toMatchObject({
      apiKeys: [],
    });
  });

  it("creates an organization record before inviting the first account-backed member", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-settings-org-bootstrap-"),
    );
    temporaryDirectories.push(rootDirectory);

    const accountRepository = createLocalAccountRepository({ rootDirectory });
    const settingsRepository = createLocalSettingsRepository({ rootDirectory });
    const persistedOrganizations: OrganizationRecord[] = [];

    const response = await handleTeamInviteRequest(
      new Request("http://localhost/api/settings/team/invitations", {
        body: JSON.stringify({
          invite: {
            email: "admin@example.com",
            name: "Admin User",
            role: "admin",
          },
          orgId: "org_123",
        }),
        method: "POST",
      }),
      {
        accountRepository,
        now: () => "2026-04-10T03:00:00.000Z",
        organizationRepository: {
          async getById() {
            return null;
          },
          async list() {
            return persistedOrganizations;
          },
          async put(organizationRecord) {
            persistedOrganizations.push(organizationRecord);

            return organizationRecord;
          },
        },
        settingsRepository,
      },
    );

    expect(response.status).toBe(201);
    expect(persistedOrganizations).toEqual([
      expect.objectContaining({
        id: "org_123",
        name: "Broward HVAC Co.",
      }),
    ]);
  });

  it("keeps existing active account members active when re-invited", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-settings-reinvite-"),
    );
    temporaryDirectories.push(rootDirectory);

    const accountRepository = createLocalAccountRepository({ rootDirectory });
    const settingsRepository = createLocalSettingsRepository({ rootDirectory });

    await accountRepository.put(
      createOrganizationAccount({
        email: "support@example.com",
        name: "Support User",
        orgId: "org_123",
        passwordHash: "existing-hash",
        role: "operator",
        status: "active",
      }),
    );

    const response = await handleTeamInviteRequest(
      new Request("http://localhost/api/settings/team/invitations", {
        body: JSON.stringify({
          invite: {
            email: "support@example.com",
            name: "Updated Support User",
            role: "operator",
          },
          orgId: "org_123",
        }),
        method: "POST",
      }),
      {
        accountRepository,
        settingsRepository,
      },
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      member: expect.objectContaining({
        email: "support@example.com",
        name: "Updated Support User",
        status: "active",
        statusLabel: "Active",
      }),
    });
    await expect(
      accountRepository.getByOrgIdAndEmail("org_123", "support@example.com"),
    ).resolves.toMatchObject({
      name: "Updated Support User",
      passwordHash: "existing-hash",
      status: "active",
    });
  });
});
