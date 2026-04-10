import { describe, expect, it } from "vitest";

import { createOrganizationAccount } from "@/features/accounts/domain/organization-account";
import { createDefaultSettingsRecord } from "@/features/settings/domain/settings-record";
import { createOrganizationRecord } from "@/features/settings/domain/organization-record";
import {
  getSettingsPageDataFromRepository,
  upsertInvitedTeamMember,
} from "@/features/settings/server/settings-record-service";

describe("settings record service", () => {
  it("prefers org and account repositories when building the settings page", async () => {
    const pageData = await getSettingsPageDataFromRepository({
      accountRepository: {
        async getByOrgIdAndEmail() {
          return null;
        },
        async getByOrgIdAndUserId(_orgId, userId) {
          return userId === "user_admin"
            ? createOrganizationAccount({
                createdAt: "2026-04-10T00:00:00.000Z",
                email: "admin@example.com",
                name: "Admin User",
                orgId: "org_123",
                role: "admin",
                status: "active",
                userId: "user_admin",
              })
            : null;
        },
        async listByOrgId() {
          return [
            createOrganizationAccount({
              createdAt: "2026-04-10T01:00:00.000Z",
              email: "viewer@example.com",
              name: "Viewer User",
              orgId: "org_123",
              role: "viewer",
              status: "active",
            }),
            createOrganizationAccount({
              createdAt: "2026-04-10T00:00:00.000Z",
              email: "admin@example.com",
              name: "Admin User",
              orgId: "org_123",
              role: "admin",
              status: "active",
              userId: "user_admin",
            }),
            createOrganizationAccount({
              createdAt: "2026-04-10T02:00:00.000Z",
              email: "operator@example.com",
              name: "Operator User",
              orgId: "org_123",
              role: "operator",
              status: "invited",
            }),
          ];
        },
        async put(account) {
          return account;
        },
      },
      currentActorUserId: "user_admin",
      orgId: "org_123",
      organizationRepository: {
        async getById() {
          return createOrganizationRecord({
            createdAt: "2026-04-10T00:00:00.000Z",
            goals: ["Improve cash flow visibility"],
            id: "org_123",
            industry: "Plumbing / Field service",
            invoiceCycle: "Monthly",
            location: "Miami, FL",
            name: "Precision Plumbing Co.",
            revenueModel: "Job-based",
            status: "active",
            teamSize: "11-25 people",
            updatedAt: "2026-04-10T00:00:00.000Z",
          });
        },
        async list() {
          return [];
        },
        async put(organization) {
          return organization;
        },
      },
      settingsRepository: {
        async getByOrgId() {
          return createDefaultSettingsRecord("org_123");
        },
        async put(settingsRecord) {
          return settingsRecord;
        },
      },
    });

    expect(pageData.organization).toMatchObject({
      industry: "Plumbing / Field service",
      location: "Miami, FL",
      name: "Precision Plumbing Co.",
    });
    expect(pageData.security.authRows[0]).toMatchObject({
      description: "admin@example.com",
    });
    expect(pageData.currentUser).toMatchObject({
      canInviteMembers: true,
      email: "admin@example.com",
      role: "Admin",
      userId: "user_admin",
    });
    expect(pageData.team.members).toEqual([
      expect.objectContaining({
        accessSummary: "Setup, Ops, Reports",
        canEditAuthorization: false,
        email: "admin@example.com",
        isCurrentUser: true,
        role: "Admin",
      }),
      expect.objectContaining({
        accessSummary: "Reports",
        canEditAuthorization: true,
        email: "viewer@example.com",
        isCurrentUser: false,
        role: "Viewer",
      }),
      expect.objectContaining({
        accessSummary: "Setup, Ops",
        canEditAuthorization: true,
        email: "operator@example.com",
        isCurrentUser: false,
        role: "Operator",
        status: "invited",
      }),
    ]);
  });

  it("falls back to labeled legacy team members when no account repo is available", async () => {
    const settingsRecord = upsertInvitedTeamMember(
      createDefaultSettingsRecord("org_123"),
      {
        email: "ops@example.com",
        name: "Ops User",
        role: "operator",
      },
    );

    const pageData = await getSettingsPageDataFromRepository({
      orgId: "org_123",
      settingsRepository: {
        async getByOrgId() {
          return settingsRecord;
        },
        async put(nextSettingsRecord) {
          return nextSettingsRecord;
        },
      },
    });

    expect(pageData.team.members[0]).toMatchObject({
      accessSummary: "Setup, Ops",
      email: "ops@example.com",
      role: "Operator",
      status: "invited",
    });
  });
});
